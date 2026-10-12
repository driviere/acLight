import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LetterBold, LockPasswordBold, HandMoneyBold } from 'solar-icon-set';
import { db, auth } from '../../firebase';
import { collection, getDocs, setDoc, doc, getDoc, query, where, limit } from 'firebase/firestore';
import {
    isSignInWithEmailLink,
    signInWithEmailLink,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from 'firebase/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let emailToLink = window.localStorage.getItem('emailForSignIn');
            if (!emailToLink) {
                emailToLink = window.prompt('Please provide your email for confirmation');
            }
            if (emailToLink) {
                setLoading(true);
                signInWithEmailLink(auth, emailToLink, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem('emailForSignIn');
                        navigate('/');
                    })
                    .catch((err) => {
                        console.error(err);
                        setError("Failed to link sign-in. Link may be expired.");
                        setLoading(false);
                    });
            }
        }
    }, [navigate]);

    // Returns true if access granted, false if the user should be rejected.
    // Handles the one-time super-admin bootstrap for a fresh database.
    const checkAccess = async (user) => {
        // Bootstrap: if no users exist yet, the first person becomes super_admin
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                role: 'super_admin',
                createdAt: new Date()
            });
            return true;
        }

        // Allow if a user document already exists for this account
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) return true;

        // Allow if invited as a tenant owner (provisioning happens in AuthContext)
        const inviteSnap = await getDocs(
            query(collection(db, 'tenants'), where('owner_email', '==', user.email.toLowerCase()), limit(1))
        );
        if (!inviteSnap.empty) return true;

        // Not invited — revoke the session immediately
        await signOut(auth);
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setInfo('');
            setLoading(true);
            const { user } = await login(email, password);
            const allowed = await checkAccess(user);
            if (!allowed) {
                setError('Access denied. Your account has not been invited to this application.');
                return;
            }
            navigate('/');
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        try {
            setError('');
            setInfo('');
            setLoading(true);
            const provider = new GoogleAuthProvider();
            const { user } = await signInWithPopup(auth, provider);
            const allowed = await checkAccess(user);
            if (!allowed) {
                setError('Access denied. Your Google account has not been invited to this application.');
                return;
            }
            navigate('/');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('Google sign-in failed. Please try again.');
                console.error(err);
            }
        }
        setLoading(false);
    };

    const handleForgotPassword = async () => {
        const target = email.trim();
        if (!target) {
            setError('Enter your email address above, then click Forgot Password.');
            return;
        }
        try {
            setError('');
            setInfo('');
            await sendPasswordResetEmail(auth, target);
            setInfo(`Password reset email sent to ${target}. Check your inbox.`);
        } catch (err) {
            setError('Could not send reset email. Check the address and try again.');
            console.error(err);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card box">
                {/* Branding */}
                <div className="has-text-centered mb-5">
                    <div className="login-logo">🥖</div>
                    <h1 className="title is-3 mb-1" style={{ fontWeight: 800, color: '#1a202c' }}>Bakery Ledger</h1>
                    <p className="subtitle is-6" style={{ color: '#718096' }}>Accounting rigorous, user simple.</p>
                    <div className="tags is-centered mt-3">
                        <span className="tag is-success is-light">Double-Entry Bookkeeping</span>
                        <span className="tag is-info is-light">POS System</span>
                        <span className="tag is-warning is-light">AR / AP Tracking</span>
                    </div>
                </div>

                <hr />

                {error && (
                    <div className="notification is-danger is-light mb-4" style={{ borderRadius: '10px' }}>
                        {error}
                    </div>
                )}
                {info && (
                    <div className="notification is-success is-light mb-4" style={{ borderRadius: '10px' }}>
                        {info}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="field mb-4">
                        <label className="label">Email Address</label>
                        <div className="control has-icons-left">
                            <input
                                className="input is-medium"
                                type="email"
                                placeholder="baker@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <span className="icon is-small is-left">
                                <LetterBold size={16} />
                            </span>
                        </div>
                    </div>

                    <div className="field mb-1">
                        <label className="label">Password</label>
                        <div className="control has-icons-left">
                            <input
                                className="input is-medium"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="icon is-small is-left">
                                <LockPasswordBold size={16} />
                            </span>
                        </div>
                    </div>

                    <div className="has-text-right mb-4">
                        <button
                            type="button"
                            className="button is-ghost is-small p-0"
                            style={{ color: '#4a90d9', fontSize: '0.8rem' }}
                            onClick={handleForgotPassword}
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button
                        className={`button is-primary is-fullwidth is-medium ${loading ? 'is-loading' : ''}`}
                        type="submit"
                        disabled={loading}
                        style={{ height: '52px', fontSize: '1rem', borderRadius: '10px' }}
                    >
                        <span className="icon"><HandMoneyBold size={18} /></span>
                        <strong>Sign In to Ledger</strong>
                    </button>
                </form>

                <div className="is-flex is-align-items-center my-4" style={{ gap: '8px' }}>
                    <hr style={{ flex: 1, margin: 0 }} />
                    <span className="is-size-7 has-text-grey">or</span>
                    <hr style={{ flex: 1, margin: 0 }} />
                </div>

                <button
                    className={`button is-white is-fullwidth is-medium ${loading ? 'is-loading' : ''}`}
                    type="button"
                    disabled={loading}
                    onClick={handleGoogle}
                    style={{ height: '52px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 600 }}
                >
                    <span className="icon mr-2">
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            <path fill="none" d="M0 0h48v48H0z"/>
                        </svg>
                    </span>
                    <span>Sign in with Google</span>
                </button>
            </div>
        </div>
    );
}

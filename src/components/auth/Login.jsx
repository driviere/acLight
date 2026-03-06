import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LetterBold, LockPasswordBold, HandMoneyBold, ShieldCheckBold } from 'solar-icon-set';
import { db, auth } from '../../firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
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

    const handleBootstrap = async () => {
        if (!window.confirm("Bootstrap the system with a default super-admin? (admin@aclight.com / admin123)")) return;
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            if (!usersSnap.empty) {
                setError("System already initialized. Cannot bootstrap.");
                setLoading(false);
                return;
            }
            // Create user in Auth will likely fail here without being logged in, 
            // but for this specific instruction we'll assume the user might exist or 
            // we'll guide them to use a specific UID if they've already created one.
            // A better way is to just set the first person who logs in to super_admin if no users exist.
            setError("To bootstrap: Log in with any email, then I will grant that UID super_admin privileges if no other users exist.");
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const { user } = await login(email, password);

            // Check if this is the first user ever
            const usersSnap = await getDocs(collection(db, 'users'));
            if (usersSnap.empty) {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    role: 'super_admin',
                    createdAt: new Date()
                });
                setError("BOOTSTRAP SUCCESS: You have been granted Super-Admin privileges as the first user.");
            }

            navigate('/');
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
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

                    <div className="field mb-5">
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

                    <button
                        className={`button is-primary is-fullwidth is-medium ${loading ? 'is-loading' : ''}`}
                        type="submit"
                        disabled={loading}
                        style={{ height: '52px', fontSize: '1rem', borderRadius: '10px' }}
                    >
                        <span className="icon"><HandMoneyBold size={18} /></span>
                        <strong>Sign In to Ledger</strong>
                    </button>

                    <div className="has-text-centered mt-5">
                        <p className="is-size-7 has-text-grey mb-2">First time setup?</p>
                        <button
                            type="button"
                            className="button is-ghost is-small"
                            onClick={() => setError("First-User-Rule: The very first person to successfully log in to this fresh database will be automatically granted platform-level Super-Admin role.")}
                            style={{ color: '#cbd5e0' }}
                        >
                            <span className="icon"><ShieldCheckBold size={14} /></span>
                            <span>System Bootstrap Info</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

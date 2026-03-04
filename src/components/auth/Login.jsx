import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LetterBold, LockPasswordBold, HandMoneyBold } from 'solar-icon-set';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
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
                </form>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LetterBold, LockPasswordBold } from 'solar-icon-set';

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
            navigate('/'); // Redirect to dashboard
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="container mt-6" style={{ maxWidth: '400px' }}>
            <div className="box">
                <h2 className="title has-text-centered has-text-primary mb-5">Staff Login</h2>

                {error && <div className="notification is-danger is-light">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field mb-4">
                        <label className="label">Email</label>
                        <div className="control has-icons-left">
                            <input
                                className="input is-medium"
                                type="email"
                                placeholder="baker@bakeryledger.com"
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
                                placeholder="********"
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
                    >
                        <strong>Sign In</strong>
                    </button>
                </form>
            </div>
        </div>
    );
}

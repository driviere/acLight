import React, { useState } from 'react';
import { auth } from '../../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../App';
import { LockPasswordBold, KeyMinimalisticBold, ShieldCheckBold } from 'solar-icon-set';

const AccountManager = () => {
    const { currentUser } = useAuth();
    const { showToast, ToastComponent } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState(''); // Only if they already had one, but we'll try direct first
    const [processing, setProcessing] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match!", "danger");
            return;
        }

        if (newPassword.length < 6) {
            showToast("Password must be at least 6 characters.", "warning");
            return;
        }

        setProcessing(true);
        try {
            await updatePassword(currentUser, newPassword);
            showToast("Password updated successfully!", "success");
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/requires-recent-login') {
                showToast("Security: Please log out and log back in to change your password.", "danger");
            } else {
                showToast(err.message, "danger");
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="box fadeIn">
            <h2 className="title is-4 mb-4">
                <span className="icon mr-2"><ShieldCheckBold size={20} /></span>
                Account Security
            </h2>

            <p className="subtitle is-6 has-text-grey mb-5">
                Protect your account by setting a secure password.
            </p>

            {ToastComponent}

            <form onSubmit={handleUpdatePassword} style={{ maxWidth: '400px' }}>
                <div className="field mb-4">
                    <label className="label">New Password</label>
                    <div className="control has-icons-left">
                        <input
                            className="input"
                            type="password"
                            placeholder="Min 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <span className="icon is-left"><KeyMinimalisticBold size={16} /></span>
                    </div>
                </div>

                <div className="field mb-5">
                    <label className="label">Confirm New Password</label>
                    <div className="control has-icons-left">
                        <input
                            className="input"
                            type="password"
                            placeholder="Repeat password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <span className="icon is-left"><LockPasswordBold size={16} /></span>
                    </div>
                </div>

                <button
                    className={`button is-primary is-fullwidth ${processing ? 'is-loading' : ''}`}
                    type="submit"
                >
                    Update Password
                </button>
            </form>

            <div className="notification is-info is-light mt-5">
                <p className="is-size-7">
                    <strong>Note:</strong> Since you signed in via email link, you haven't set a password yet.
                    Setting one now allows you to log in faster using your email and password in the future.
                </p>
            </div>
        </div>
    );
};

export default AccountManager;

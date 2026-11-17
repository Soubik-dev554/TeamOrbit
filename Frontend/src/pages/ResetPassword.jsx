import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setMessage('');

        if (password.length < 8) {
            setError('Password must contain at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `http://localhost:5000/api/auth/reset-password/${encodeURIComponent(token)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ password })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Unable to reset password.');
            }

            setSuccess(true);
            setMessage(data.message);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="center-screen">
            <div
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '30px',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
            >
                <h2>Reset Password</h2>

                <p>
                    Create a new password for your TeamOrbit account.
                </p>

                {success ? (
                    <>
                        <p style={{ color: 'green' }}>{message}</p>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                        >
                            Go to Login
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label>New Password</label>

                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                minLength={8}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '12px',
                                    marginTop: '6px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Confirm Password</label>

                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                minLength={8}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '12px',
                                    marginTop: '6px'
                                }}
                            />
                        </div>

                        <label style={{ display: 'block', marginBottom: '15px' }}>
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                            />{' '}
                            Show password
                        </label>

                        {error && (
                            <p style={{ color: 'red' }}>{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {!success && (
                    <p style={{ marginTop: '20px' }}>
                        <Link to="/login">Back to Login</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
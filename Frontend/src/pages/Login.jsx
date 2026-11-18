import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import teamorbitLogo from '../assets/teamorbit-logo.png';

const Login = () => {
    const [form, setForm] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const { setUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setBusy(true);

        try {
            const response = await api.post('/auth/login', form);

            const user = response.data.user;

            setUser(user);

            // Redirect users according to their role
            if (user.role === 'superadmin') {
                navigate('/superadmin', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }

        } catch (err) {
            setError(
                err.response?.data?.message || 'Login failed. Please try again.'
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-brand">
                <img
                    src={teamorbitLogo}
                    alt="TeamOrbit"
                    className="brand-mark"
                />
            </div>

            <section className="auth-card">

                <div className="eyebrow">WELCOME BACK</div>

                <h1>Sign in to your workspace</h1>

                <p className="muted">
                    Keep your projects moving forward.
                </p>

                {error && (
                    <div className="alert">
                        {error}
                    </div>
                )}

                <form className="form-stack" onSubmit={handleSubmit}>

                    <label>
                        Email address

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />
                    </label>

                    <label>
                        Password

                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="At least 8 characters"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={busy}
                    >
                        {busy ? 'Signing in...' : 'Sign in'}
                    </button>

                </form>

        <p className="auth-foot">
                    New to TeamOrbit?{' '}
                    <Link to="/register">
                        Create an account
                    </Link>
                </p>

            </section>

            <p className="auth-caption">
                Plan clearly. Build together. Deliver better.
            </p>

        </div>
    );
};

export default Login;

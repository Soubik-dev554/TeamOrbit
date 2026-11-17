import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../api';
import { useAuth } from '../context/AuthContext';

const Register = () => {

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        companyName: ''
    });

    const [otp, setOtp] = useState('');

    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [busy, setBusy] = useState(false);
    const [resendBusy, setResendBusy] = useState(false);

    const [otpStep, setOtpStep] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const { setUser } = useAuth();
    const navigate = useNavigate();


    // OTP resend countdown
    useEffect(() => {

        if (countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);

    }, [countdown]);


    // Handle input changes
    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));

    };


    // Step 1: Register Company Admin
    const handleSubmit = async (e) => {

        e.preventDefault();

        setError('');
        setNotice('');
        setBusy(true);

        try {

            const response = await api.post(
                '/auth/register-organization',
                form
            );

            if (response.data.requiresEmailVerification) {

                setOtpStep(true);

                setNotice(response.data.message);

                // Backend initially applies a 60-second cooldown.
                setCountdown(60);

            } else {

                throw new Error('Unexpected registration response.');

            }

        } catch (err) {

            setError(
                err.response?.data?.message || err.message
            );

        } finally {

            setBusy(false);

        }

    };


    // Step 2: Verify Email OTP
    const handleVerifyOTP = async (e) => {

        e.preventDefault();

        setError('');
        setNotice('');

        if (!/^\d{6}$/.test(otp)) {

            setError('Please enter a valid six-digit OTP.');
            return;

        }

        setBusy(true);

        try {

            const response = await api.post(
                '/auth/verify-email',
                {
                    email: form.email,
                    otp
                }
            );

            // Store authenticated Admin
            setUser(response.data.user);

            setNotice('Email verified successfully!');

            // Redirect to Admin Dashboard
            navigate('/');

        } catch (err) {

            setError(
                err.response?.data?.message || err.message
            );

        } finally {

            setBusy(false);

        }

    };


    // Step 3: Resend OTP
    const handleResendOTP = async () => {

        setError('');
        setNotice('');

        setResendBusy(true);

        try {

            const response = await api.post(
                '/auth/resend-otp',
                {
                    email: form.email
                }
            );

            setNotice(response.data.message);

            setCountdown(
                response.data.cooldownSeconds || 60
            );

        } catch (err) {

            const remainingSeconds =
                err.response?.data?.remainingSeconds;

            if (remainingSeconds) {
                setCountdown(remainingSeconds);
            }

            setError(
                err.response?.data?.message || err.message
            );

        } finally {

            setResendBusy(false);

        }

    };


    // Back to registration form
    const handleBack = () => {

        setOtpStep(false);
        setOtp('');

        setError('');
        setNotice('');

    };


    return (

        <div className="auth-page">

            <div className="auth-brand">
                <span className="brand-mark">T</span>
                TaskFlow
            </div>


            <section className="auth-card">

                <div className="eyebrow">
                    {otpStep ? 'EMAIL VERIFICATION' : 'GET STARTED'}
                </div>


                {!otpStep ? (

                    <>

                        <h1>Create your account</h1>

                        <p className="muted">
                            Your team's next great project starts here.
                        </p>


                        {error && (
                            <div className="alert">
                                {error}
                            </div>
                        )}


                        <form
                            className="form-stack"
                            onSubmit={handleSubmit}
                        >

                            <label>
                                Full name

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    required
                                />
                            </label>


                            <label>
                                Company name

                                <input
                                    type="text"
                                    name="companyName"
                                    value={form.companyName}
                                    onChange={handleChange}
                                    placeholder="Your company name"
                                    required
                                />
                            </label>


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
                                    minLength={8}
                                    required
                                />
                            </label>


                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                disabled={busy}
                            >
                                {busy
                                    ? 'Creating account...'
                                    : 'Create account'
                                }
                            </button>

                        </form>


                        <p className="auth-foot">
                            Already have an account?{' '}

                            <Link to="/login">
                                Sign in
                            </Link>
                        </p>

                    </>

                ) : (

                    <>

                        <h1>Verify your email</h1>

                        <p className="muted">
                            We've sent a six-digit verification code to:
                        </p>

                        <p>
                            <strong>{form.email}</strong>
                        </p>


                        {error && (
                            <div className="alert">
                                {error}
                            </div>
                        )}

                        {notice && (
                            <div className="alert">
                                {notice}
                            </div>
                        )}


                        <form
                            className="form-stack"
                            onSubmit={handleVerifyOTP}
                        >

                            <label>
                                Enter verification code

                                <input
                                    type="text"
                                    name="otp"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .replace(/\D/g, '')
                                            .slice(0, 6);

                                        setOtp(value);
                                    }}
                                    placeholder="Enter 6-digit OTP"
                                    inputMode="numeric"
                                    maxLength={6}
                                    required
                                />
                            </label>


                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                disabled={busy || otp.length !== 6}
                            >
                                {busy
                                    ? 'Verifying...'
                                    : 'Verify Email'
                                }
                            </button>

                        </form>


                        <div className="auth-foot">

                            {countdown > 0 ? (

                                <p>
                                    Resend OTP in{' '}
                                    <strong>{countdown}s</strong>
                                </p>

                            ) : (

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleResendOTP}
                                    disabled={resendBusy}
                                >
                                    {resendBusy
                                        ? 'Sending...'
                                        : 'Resend OTP'
                                    }
                                </button>

                            )}

                        </div>


                        <p className="auth-foot">

                            <button
                                type="button"
                                onClick={handleBack}
                                className="btn"
                            >
                                Back to registration
                            </button>

                        </p>

                    </>

                )}

            </section>


            <p className="auth-caption">
                Plan clearly. Build together. Deliver better.
            </p>

        </div>

    );

};

export default Register;
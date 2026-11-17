import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const EmployeeInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    otp: '',
    password: '',
    confirmPassword: ''
  });

  // ==========================================
  // LOAD INVITATION DETAILS
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const loadInvitation = async () => {
      try {
        setLoading(true);
        setError('');

        if (!token) {
          throw new Error('Invalid invitation link.');
        }

        const response = await api.get(
          `/users/invitation/${encodeURIComponent(token)}`
        );

        if (isMounted) {
          setInvitation(response.data.invitation);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Unable to verify invitation.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);


  // ==========================================
  // SEND OTP
  // ==========================================

  const handleSendOTP = async () => {
    try {
      setSendingOTP(true);
      setError('');
      setSuccess('');

      const response = await api.post(
        `/users/invitation/${encodeURIComponent(token)}/send-otp`
      );

      setOtpSent(true);

      setSuccess(
        response.data.message ||
          'Verification OTP sent successfully. Please check your email.'
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to send OTP. Please try again.'
      );
    } finally {
      setSendingOTP(false);
    }
  };


  // ==========================================
  // COMPLETE REGISTRATION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!otpSent) {
      setError('Please verify your email using OTP first.');
      return;
    }

    if (!/^\d{6}$/.test(form.otp)) {
      setError('Please enter a valid six-digit OTP.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post(
        `/users/invitation/${encodeURIComponent(token)}/complete`,
        {
          otp: form.otp,
          password: form.password
        }
      );

      setSuccess(
        response.data.message ||
          'Registration completed successfully.'
      );

      // Employee registration completed.
      // Redirect to login, NOT /employees.
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Verifying your invitation...
          </p>
        </div>
      </div>
    );
  }


  // ==========================================
  // INVALID INVITATION
  // ==========================================

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Invitation Unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error || 'This invitation link is invalid or has expired.'}
          </p>

          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Go to Login
          </button>

        </div>
      </div>
    );
  }


  // ==========================================
  // INVITATION REGISTRATION PAGE
  // ==========================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">

      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">

        {/* Logo / Heading */}

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-200">
            T
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome to TeamOrbit
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            You have been invited to join your organization.
            Verify your email and create your account.
          </p>

        </div>


        {/* Invitation Information */}

        <div className="mt-8 space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Employee Name
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-slate-900">
              {invitation.name}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-slate-900">
              {invitation.email}
            </p>
          </div>

        </div>


        {/* Error Message */}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}


        {/* Success Message */}

        {success && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}


        {/* Send OTP Button */}

        {!otpSent && (
          <div className="mt-7">

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={sendingOTP}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingOTP
                ? 'Sending Verification Code...'
                : 'Verify Email & Send OTP'}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
              A six-digit verification code will be sent to your invited email address.
            </p>

          </div>
        )}


        {/* Registration Form */}

        {otpSent && (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">

            {/* OTP */}

            <div>

              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Verification Code
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={form.otp}
                onChange={(e) =>
                  setForm({
                    ...form,
                    otp: e.target.value.replace(/\D/g, '').slice(0, 6)
                  })
                }
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />

            </div>


            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Create Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value
                  })
                }
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />

            </div>


            {/* Confirm Password */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({
                    ...form,
                    confirmPassword: e.target.value
                  })
                }
                placeholder="Re-enter your password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />

            </div>


            {/* Submit */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Creating Your Account...'
                : 'Complete Registration'}
            </button>


            {/* Resend OTP */}

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={sendingOTP}
              className="w-full py-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800 disabled:opacity-50"
            >
              {sendingOTP ? 'Sending...' : 'Resend Verification Code'}
            </button>

            <p className="text-center text-xs text-slate-400">
              Your verification code expires in 5 minutes.
            </p>

          </form>
        )}


        {/* Footer */}

        <div className="mt-8 border-t border-slate-100 pt-5 text-center">

          <p className="text-xs text-slate-400">
            Secure employee registration powered by TeamOrbit.
          </p>

        </div>

      </div>

    </div>
  );
};

export default EmployeeInvitation;
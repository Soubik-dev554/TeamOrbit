import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import teamOrbitLogo from '../assets/teamorbit-icon.png';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [stats, setStats] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [employeesError, setEmployeesError] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [updatingEmployeeId, setUpdatingEmployeeId] = useState('');
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [adminsError, setAdminsError] = useState('');
    const [adminSearch, setAdminSearch] = useState('');
    const [updatingAdminId, setUpdatingAdminId] = useState('');
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Create Admin states
    const [showCreateAdmin, setShowCreateAdmin] = useState(false);
    const [creatingAdmin, setCreatingAdmin] = useState(false);
    const [adminError, setAdminError] = useState('');
    const [adminSuccess, setAdminSuccess] = useState('');

    const [adminForm, setAdminForm] = useState({
        name: '',
        email: '',
        password: '',
        organizationId: ''
    });

    // Fetch Dashboard Data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            const [statsResponse, organizationsResponse] = await Promise.all([
                api.get('/superadmin/stats'),
                api.get('/superadmin/organizations')
            ]);

            setStats(statsResponse.data.stats);
            setOrganizations(organizationsResponse.data.organizations);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to load dashboard data.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch all Company Admins
    const fetchAdmins = async () => {
        try {
            setAdminsLoading(true);
            setAdminsError('');

            const response = await api.get('/superadmin/admins');
            setAdmins(response.data.admins || []);
        } catch (err) {
            setAdminsError(
                err.response?.data?.message ||
                err.message ||
                'Failed to load Company Admins.'
            );
        } finally {
            setAdminsLoading(false);
        }
    };

    // Activate or suspend a Company Admin
    const handleAdminStatusChange = async (admin) => {
        const nextStatus = !admin.isActive;
        const action = nextStatus ? 'activate' : 'suspend';

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${admin.name}'s account?`
        );

        if (!confirmed) return;

        try {
            setUpdatingAdminId(admin._id);
            setAdminsError('');

            const response = await api.patch(
                `/superadmin/admins/${admin._id}/status`,
                { isActive: nextStatus }
            );

            setAdmins((currentAdmins) =>
                currentAdmins.map((item) =>
                    item._id === admin._id
                        ? { ...item, isActive: response.data.admin.isActive }
                        : item
                )
            );

            // Keep platform statistics in sync after an account status change.
            const statsResponse = await api.get('/superadmin/stats');
            setStats(statsResponse.data.stats);
        } catch (err) {
            setAdminsError(
                err.response?.data?.message ||
                err.message ||
                'Unable to update this Admin account.'
            );
        } finally {
            setUpdatingAdminId('');
        }
    };

    // Search Company Admins by name, email, or organization
    const filteredAdmins = useMemo(() => {
        const query = adminSearch.trim().toLowerCase();

        if (!query) return admins;

        return admins.filter((admin) =>
            admin.name?.toLowerCase().includes(query) ||
            admin.email?.toLowerCase().includes(query) ||
            admin.organization?.name?.toLowerCase().includes(query)
        );
    }, [admins, adminSearch]);

    // Fetch all Employees
    const fetchEmployees = async () => {
        try {
            setEmployeesLoading(true);
            setEmployeesError('');

            const response = await api.get('/superadmin/employees');
            setEmployees(response.data.employees || []);
        } catch (err) {
            setEmployeesError(
                err.response?.data?.message ||
                err.message ||
                'Failed to load Employees.'
            );
        } finally {
            setEmployeesLoading(false);
        }
    };

    // Activate or suspend an Employee
    const handleEmployeeStatusChange = async (employee) => {
        const nextStatus = !employee.isActive;
        const action = nextStatus ? 'activate' : 'suspend';

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${employee.name}'s account?`
        );

        if (!confirmed) return;

        try {
            setUpdatingEmployeeId(employee._id);
            setEmployeesError('');

            const response = await api.patch(
                `/superadmin/employees/${employee._id}/status`,
                { isActive: nextStatus }
            );

            setEmployees((currentEmployees) =>
                currentEmployees.map((item) =>
                    item._id === employee._id
                        ? { ...item, isActive: response.data.employee.isActive }
                        : item
                )
            );

            const statsResponse = await api.get('/superadmin/stats');
            setStats(statsResponse.data.stats);
        } catch (err) {
            setEmployeesError(
                err.response?.data?.message ||
                err.message ||
                'Unable to update this Employee account.'
            );
        } finally {
            setUpdatingEmployeeId('');
        }
    };

    // Search Employees by name, email, or organization
    const filteredEmployees = useMemo(() => {
        const query = employeeSearch.trim().toLowerCase();

        if (!query) return employees;

        return employees.filter((employee) =>
            employee.name?.toLowerCase().includes(query) ||
            employee.email?.toLowerCase().includes(query) ||
            employee.organization?.name?.toLowerCase().includes(query)
        );
    }, [employees, employeeSearch]);

    // Logout
    const handleLogout = async () => {
        if (loggingOut) return;

        try {
            setLoggingOut(true);

            await api.post('/auth/logout');

            setUser(null);
            navigate('/login', { replace: true });

        } catch (err) {
            console.error('Logout failed:', err);

            setError(
                err.response?.data?.message ||
                'Unable to log out. Please try again.'
            );
        } finally {
            setLoggingOut(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchAdmins();
        fetchEmployees();
    }, []);

    // Search and Filter Organizations
    const filteredOrganizations = useMemo(() => {
        return organizations.filter((org) => {
            const query = search.toLowerCase();

            const matchesSearch =
                org.name?.toLowerCase().includes(query) ||
                org.owner?.name?.toLowerCase().includes(query) ||
                org.owner?.email?.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && org.isActive) ||
                (statusFilter === 'suspended' && !org.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [organizations, search, statusFilter]);

    // Active Organizations for Admin Creation
    const activeOrganizations = useMemo(() => {
        return organizations.filter((org) => org.isActive);
    }, [organizations]);

    // Handle Admin Form Changes
    const handleAdminFormChange = (e) => {
        const { name, value } = e.target;

        setAdminForm((prev) => ({
            ...prev,
            [name]: value
        }));

        setAdminError('');
        setAdminSuccess('');
    };

    // Open Create Admin Modal
    const openCreateAdminModal = () => {
        setAdminForm({
            name: '',
            email: '',
            password: '',
            organizationId: ''
        });

        setAdminError('');
        setAdminSuccess('');
        setShowCreateAdmin(true);
    };

    // Close Create Admin Modal
    const closeCreateAdminModal = () => {
        if (creatingAdmin) return;

        setShowCreateAdmin(false);
        setAdminError('');
        setAdminSuccess('');
    };

    // Create Admin Account
    const handleCreateAdmin = async (e) => {
        e.preventDefault();

        if (creatingAdmin) return;

        setAdminError('');
        setAdminSuccess('');

        const name = adminForm.name.trim();
        const email = adminForm.email.trim().toLowerCase();
        const password = adminForm.password;
        const organizationId = adminForm.organizationId;

        if (!name || !email || !password || !organizationId) {
            setAdminError('Please complete all required fields.');
            return;
        }

        if (password.length < 8) {
            setAdminError('Password must contain at least 8 characters.');
            return;
        }

        setCreatingAdmin(true);

        try {
            const response = await api.post('/superadmin/create-admin', {
                name,
                email,
                password,
                organizationId
            });

            setAdminSuccess(
                response.data.message || 'Admin account created successfully.'
            );

            // Reset form
            setAdminForm({
                name: '',
                email: '',
                password: '',
                organizationId: ''
            });

            // Refresh dashboard data without closing the modal
            const [statsResponse, organizationsResponse] = await Promise.all([
                api.get('/superadmin/stats'),
                api.get('/superadmin/organizations')
            ]);

            setStats(statsResponse.data.stats);
            setOrganizations(organizationsResponse.data.organizations);

        } catch (err) {
            setAdminError(
                err.response?.data?.message ||
                'Unable to create Admin account. Please try again.'
            );
        } finally {
            setCreatingAdmin(false);
        }
    };

    // Statistics Cards
    const statCards = [
        {
            title: 'Total Organizations',
            value: stats?.totalOrganizations ?? 0,
            icon: '🏢',
            color: 'bg-violet-50 text-violet-600'
        },
        {
            title: 'Active Organizations',
            value: stats?.activeOrganizations ?? 0,
            icon: '✓',
            color: 'bg-emerald-50 text-emerald-600'
        },
        {
            title: 'Total Users',
            value: stats?.totalUsers ?? 0,
            icon: '👥',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Company Admins',
            value: stats?.totalAdmins ?? 0,
            icon: '👨‍💼',
            color: 'bg-orange-50 text-orange-600'
        },
        {
            title: 'Total Employees',
            value: stats?.totalEmployees ?? 0,
            icon: '👤',
            color: 'bg-pink-50 text-pink-600'
        },
        {
            title: 'Total Projects',
            value: stats?.totalProjects ?? 0,
            icon: '📁',
            color: 'bg-cyan-50 text-cyan-600'
        },
        {
            title: 'Total Tasks',
            value: stats?.totalTasks ?? 0,
            icon: '📋',
            color: 'bg-indigo-50 text-indigo-600'
        },
        {
            title: 'Suspended Organizations',
            value: stats?.suspendedOrganizations ?? 0,
            icon: '⚠️',
            color: 'bg-red-50 text-red-600'
        }
    ];

    // Loading Screen
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 md:p-10">
                <div className="mx-auto max-w-7xl animate-pulse space-y-8">

                    <div className="h-10 w-64 rounded-lg bg-slate-200" />

                    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-32 rounded-2xl bg-white shadow-sm"
                            />
                        ))}
                    </div>

                    <div className="h-72 rounded-2xl bg-white shadow-sm" />

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">

            <main className="mx-auto w-full max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 md:px-8 lg:px-10">

                {/* Header */}
                <header className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-6">

                    <div>
                        {/* TeamOrbit Brand */}
                        <div className="mb-4 flex items-center gap-3">
                            <img
                                src={teamOrbitLogo}
                                alt="TeamOrbit"
                                className="h-12 w-12 shrink-0 object-contain"
                            />
                            <span className="text-xl font-extrabold tracking-tight text-slate-900">
                                TeamOrbit
                            </span>
                        </div>

                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />

                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                                Platform Administration
                            </span>
                        </div>

                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                            Super Admin Dashboard
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage organizations and monitor the TeamOrbit platform.
                        </p>
                    </div>

                    {/* Header Actions */}
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">

                        {/* Create Admin */}
                        <button
                            onClick={openCreateAdminModal}
                            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 sm:w-auto sm:px-5"
                        >
                            + Create Admin
                        </button>

                        {/* View Website */}
                        <button
                            onClick={() =>
                                window.open(
                                    '/?view=public',
                                    '_blank',
                                    'noopener,noreferrer'
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 sm:w-auto"
                        >
                            ↗ View Website
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={fetchDashboardData}
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60 sm:w-auto sm:px-5"
                        >
                            ↻ Refresh Data
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
                        >
                            {loggingOut ? 'Logging out...' : '↪ Logout'}
                        </button>

                    </div>

                </header>

                {/* Error */}
                {error && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                        <span>{error}</span>

                        <button
                            onClick={fetchDashboardData}
                            className="font-bold underline"
                        >
                            Try again
                        </button>

                    </div>
                )}

                {/* Create Admin Modal */}
                {showCreateAdmin && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                closeCreateAdminModal();
                            }
                        }}
                    >
                        <div className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">

                            {/* Modal Header */}
                            <div className="mb-6 flex items-start justify-between">

                                <div>
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                                        👨‍💼
                                    </div>

                                    <h2 className="text-xl font-extrabold text-slate-900">
                                        Create Admin Account
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Add a new administrator to an organization.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeCreateAdminModal}
                                    disabled={creatingAdmin}
                                    className="rounded-lg px-3 py-2 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                    aria-label="Close modal"
                                >
                                    ✕
                                </button>

                            </div>

                            {/* Success Message */}
                            {adminSuccess && (
                                <div
                                    role="status"
                                    className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                                >
                                    <div className="font-bold">
                                        ✓ {adminSuccess}
                                    </div>

                                    <p className="mt-1">
                                        The new Admin can now log in using the credentials provided.
                                    </p>
                                </div>
                            )}

                            {/* Error Message */}
                            {adminError && (
                                <div
                                    role="alert"
                                    className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                                >
                                    {adminError}
                                </div>
                            )}

                            {/* Admin Form */}
                            <form
                                onSubmit={handleCreateAdmin}
                                className="space-y-5"
                            >

                                {/* Name */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Admin Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={adminForm.name}
                                        onChange={handleAdminFormChange}
                                        placeholder="Enter full name"
                                        maxLength={80}
                                        required
                                        disabled={creatingAdmin}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Admin Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={adminForm.email}
                                        onChange={handleAdminFormChange}
                                        placeholder="admin@company.com"
                                        required
                                        disabled={creatingAdmin}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Temporary Password
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        value={adminForm.password}
                                        onChange={handleAdminFormChange}
                                        placeholder="Minimum 8 characters"
                                        minLength={8}
                                        required
                                        disabled={creatingAdmin}
                                        autoComplete="new-password"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                                    />

                                    <p className="mt-1.5 text-xs text-slate-400">
                                        The Admin will use this password for their first login.
                                    </p>
                                </div>

                                {/* Organization */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Select Organization
                                    </label>

                                    <select
                                        name="organizationId"
                                        value={adminForm.organizationId}
                                        onChange={handleAdminFormChange}
                                        required
                                        disabled={creatingAdmin}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                                    >
                                        <option value="">
                                            Select an organization
                                        </option>

                                        {activeOrganizations.map((org) => (
                                            <option
                                                key={org._id}
                                                value={org._id}
                                            >
                                                {org.name}
                                            </option>
                                        ))}
                                    </select>

                                    {activeOrganizations.length === 0 && (
                                        <p className="mt-2 text-xs text-red-500">
                                            No active organizations available. Create an organization first.
                                        </p>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                                    <button
                                        type="button"
                                        onClick={closeCreateAdminModal}
                                        disabled={creatingAdmin}
                                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            creatingAdmin ||
                                            activeOrganizations.length === 0
                                        }
                                        className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {creatingAdmin
                                            ? 'Creating Admin...'
                                            : 'Create Admin Account'}
                                    </button>

                                </div>

                            </form>

                        </div>
                    </div>
                )}

                {/* Platform Statistics */}
                <section>

                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">
                            Platform Overview
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Your platform statistics at a glance.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">

                        {statCards.map((card) => (
                            <div
                                key={card.title}
                                className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-5"
                            >

                                <div className="flex items-center justify-between">

                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold ${card.color}`}>
                                        {card.icon}
                                    </div>

                                    <span className="text-xs font-medium text-slate-400">
                                        Platform
                                    </span>

                                </div>

                                <div className="mt-5">

                                    <p className="break-words text-xs font-medium text-slate-500 sm:text-sm">
                                        {card.title}
                                    </p>

                                    <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                        {card.value.toLocaleString()}
                                    </h3>

                                </div>

                            </div>
                        ))}

                    </div>

                </section>

                {/* Organizations */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* Section Header */}
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 sm:p-6 lg:flex-row lg:items-center">

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Registered Organizations
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                View and monitor companies registered on TeamOrbit.
                            </p>
                        </div>

                        <span className="w-fit rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600">
                            {organizations.length} Organizations
                        </span>

                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:p-5">

                        <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 px-4">

                            <span className="text-lg text-slate-400">
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Search company, admin or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border-0 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                            />

                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-indigo-400"
                        >
                            <option value="all">All Organizations</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>

                    </div>

                    {/* Organization List */}
                    {filteredOrganizations.length === 0 ? (

                        <div className="px-6 py-16 text-center">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                                🏢
                            </div>

                            <h3 className="mt-4 font-bold text-slate-800">
                                No organizations found
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Try changing your search or status filter.
                            </p>

                        </div>

                    ) : (

                        <div className="divide-y divide-slate-100">

                            {filteredOrganizations.map((organization) => (

                                <div
                                    key={organization._id}
                                    className="flex min-w-0 flex-col gap-4 p-4 transition hover:bg-slate-50 sm:p-5 md:flex-row md:items-center md:justify-between"
                                >

                                    <div className="flex min-w-0 items-center gap-4">

                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
                                            {organization.name?.charAt(0)?.toUpperCase() || 'O'}
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <h3 className="truncate font-bold text-slate-900">
                                                {organization.name}
                                            </h3>

                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {organization.owner?.name || 'Not assigned'}
                                            </p>

                                            <p className="mt-1 truncate text-xs text-slate-400">
                                                {organization.owner?.email || 'N/A'}
                                            </p>

                                        </div>

                                    </div>

                                    <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">

                                        <div className="text-xs text-slate-500">

                                            <span className="block font-semibold text-slate-700">
                                                Created
                                            </span>

                                            <span className="mt-1 block">
                                                {new Date(
                                                    organization.createdAt
                                                ).toLocaleDateString()}
                                            </span>

                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                                organization.isActive
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-red-50 text-red-700'
                                            }`}
                                        >
                                            <span className="mr-1">●</span>

                                            {organization.isActive
                                                ? 'Active'
                                                : 'Suspended'}
                                        </span>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                    {/* Table Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500">
                        Showing {filteredOrganizations.length} of {organizations.length} organizations
                    </div>

                </section>

                {/* Manage Company Admins */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Manage Company Admins
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                View, search, activate, or suspend administrators across all organizations.
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                            <span className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600">
                                {admins.length} Company Admins
                            </span>
                            <button
                                type="button"
                                onClick={fetchAdmins}
                                disabled={adminsLoading}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {adminsLoading ? 'Refreshing...' : '↻ Refresh'}
                            </button>
                        </div>
                    </div>

                    <div className="border-b border-slate-100 p-4 sm:p-5">
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4">
                            <span className="text-lg text-slate-400">⌕</span>
                            <input
                                type="text"
                                value={adminSearch}
                                onChange={(e) => setAdminSearch(e.target.value)}
                                placeholder="Search by admin name, email, or company..."
                                className="w-full border-0 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                            />
                        </div>
                    </div>

                    {adminsError && (
                        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <span>{adminsError}</span>
                                <button
                                    type="button"
                                    onClick={fetchAdmins}
                                    className="font-bold underline"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {adminsLoading && admins.length === 0 ? (
                        <div className="space-y-3 p-6">
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        </div>
                    ) : filteredAdmins.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                                👨‍💼
                            </div>
                            <h3 className="mt-4 font-bold text-slate-800">
                                {admins.length === 0 ? 'No Company Admins found' : 'No matching Admins'}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                {admins.length === 0
                                    ? 'Company Admin accounts will appear here.'
                                    : 'Try another name, email, or company search.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredAdmins.map((admin) => (
                                <div
                                    key={admin._id}
                                    className="flex min-w-0 flex-col gap-4 p-4 transition hover:bg-slate-50 sm:p-5 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg font-bold text-orange-600">
                                            {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-bold text-slate-900">
                                                {admin.name}
                                            </h3>
                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {admin.email}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-slate-400">
                                                Organization: {admin.organization?.name || 'Organization unavailable'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                        <div className="text-xs text-slate-500">
                                            <span className="block font-semibold text-slate-700">
                                                Organization Status
                                            </span>
                                            <span className={`mt-1 inline-block font-semibold ${
                                                admin.organization?.isActive
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600'
                                            }`}>
                                                {admin.organization?.isActive ? 'Active' : 'Suspended'}
                                            </span>
                                        </div>

                                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                            admin.isActive
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-red-50 text-red-700'
                                        }`}>
                                            <span className="mr-1">●</span>
                                            {admin.isActive ? 'Admin Active' : 'Admin Suspended'}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleAdminStatusChange(admin)}
                                            disabled={
                                                updatingAdminId === admin._id ||
                                                (!admin.isActive && !admin.organization?.isActive)
                                            }
                                            title={
                                                !admin.isActive && !admin.organization?.isActive
                                                    ? 'Activate the organization before activating this admin.'
                                                    : ''
                                            }
                                            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                admin.isActive
                                                    ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            }`}
                                        >
                                            {updatingAdminId === admin._id
                                                ? 'Updating...'
                                                : admin.isActive
                                                    ? 'Suspend Admin'
                                                    : 'Activate Admin'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500">
                        Showing {filteredAdmins.length} of {admins.length} Company Admins
                    </div>
                </section>

                {/* Manage Employees */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Manage Employees
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                View, search, activate, or suspend employees across all organizations.
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                            <span className="rounded-lg bg-pink-50 px-3 py-2 text-xs font-bold text-pink-600">
                                {employees.length} Employees
                            </span>
                            <button
                                type="button"
                                onClick={fetchEmployees}
                                disabled={employeesLoading}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {employeesLoading ? 'Refreshing...' : '↻ Refresh'}
                            </button>
                        </div>
                    </div>

                    <div className="border-b border-slate-100 p-4 sm:p-5">
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4">
                            <span className="text-lg text-slate-400">⌕</span>
                            <input
                                type="text"
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                placeholder="Search by employee name, email, or company..."
                                className="w-full border-0 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                            />
                        </div>
                    </div>

                    {employeesError && (
                        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <span>{employeesError}</span>
                                <button
                                    type="button"
                                    onClick={fetchEmployees}
                                    className="font-bold underline"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {employeesLoading && employees.length === 0 ? (
                        <div className="space-y-3 p-6">
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                                👤
                            </div>
                            <h3 className="mt-4 font-bold text-slate-800">
                                {employees.length === 0 ? 'No Employees found' : 'No matching Employees'}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                {employees.length === 0
                                    ? 'Employee accounts will appear here.'
                                    : 'Try another name, email, or company search.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredEmployees.map((employee) => (
                                <div
                                    key={employee._id}
                                    className="flex min-w-0 flex-col gap-4 p-4 transition hover:bg-slate-50 sm:p-5 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-lg font-bold text-pink-600">
                                            {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-bold text-slate-900">
                                                {employee.name}
                                            </h3>
                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {employee.email}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-slate-400">
                                                Organization: {employee.organization?.name || 'Organization unavailable'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                        <div className="text-xs text-slate-500">
                                            <span className="block font-semibold text-slate-700">
                                                Organization Status
                                            </span>
                                            <span className={`mt-1 inline-block font-semibold ${
                                                employee.organization?.isActive
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600'
                                            }`}>
                                                {employee.organization?.isActive ? 'Active' : 'Suspended'}
                                            </span>
                                        </div>

                                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                            employee.isActive
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-red-50 text-red-700'
                                        }`}>
                                            <span className="mr-1">●</span>
                                            {employee.isActive ? 'Employee Active' : 'Employee Suspended'}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleEmployeeStatusChange(employee)}
                                            disabled={
                                                updatingEmployeeId === employee._id ||
                                                (!employee.isActive && !employee.organization?.isActive)
                                            }
                                            title={
                                                !employee.isActive && !employee.organization?.isActive
                                                    ? 'Activate the organization before activating this employee.'
                                                    : ''
                                            }
                                            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                employee.isActive
                                                    ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            }`}
                                        >
                                            {updatingEmployeeId === employee._id
                                                ? 'Updating...'
                                                : employee.isActive
                                                    ? 'Suspend Employee'
                                                    : 'Activate Employee'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500">
                        Showing {filteredEmployees.length} of {employees.length} Employees
                    </div>
                </section>

                {/* Footer */}
                <footer className="flex flex-col justify-between gap-2 pb-4 text-xs text-slate-400 sm:flex-row">

                    <p>
                        © {new Date().getFullYear()} TeamOrbit Platform Administration
                    </p>

                    <p>
                        Super Admin Control Center
                    </p>

                </footer>

            </main>
        </div>
    );
}
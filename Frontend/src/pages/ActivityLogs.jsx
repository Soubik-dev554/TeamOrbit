import { useCallback, useEffect, useState } from 'react';
import api from '../api';

const activityTypes = [
    { label: 'All Activities', value: '' },
    { label: 'Project Created', value: 'PROJECT_CREATED' },
    { label: 'Project Updated', value: 'PROJECT_UPDATED' },
    { label: 'Project Deleted', value: 'PROJECT_DELETED' },
    { label: 'Task Created', value: 'TASK_CREATED' },
    { label: 'Task Assigned', value: 'TASK_ASSIGNED' },
    { label: 'Task Updated', value: 'TASK_UPDATED' },
    { label: 'Status Changed', value: 'TASK_STATUS_CHANGED' },
    { label: 'Priority Changed', value: 'TASK_PRIORITY_CHANGED' },
    { label: 'Task Deleted', value: 'TASK_DELETED' },
    { label: 'Employee Created', value: 'EMPLOYEE_CREATED' },
    { label: 'Employee Activated', value: 'EMPLOYEE_ACTIVATED' },
    { label: 'Employee Suspended', value: 'EMPLOYEE_SUSPENDED' }
];

const getActionStyle = (action = '') => {
    if (action.includes('PROJECT')) {
        return {
            icon: '▣',
            color: 'bg-purple-100 text-purple-700'
        };
    }

    if (action.includes('TASK')) {
        return {
            icon: '☷',
            color: 'bg-blue-100 text-blue-700'
        };
    }

    if (action.includes('EMPLOYEE')) {
        return {
            icon: '♙',
            color: 'bg-emerald-100 text-emerald-700'
        };
    }

    return {
        icon: '◷',
        color: 'bg-gray-100 text-gray-700'
    };
};

const formatAction = (action = '') =>
    action.replaceAll('_', ' ').toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());

const formatDate = (date) => {
    if (!date) return 'Unknown date';

    return new Date(date).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [action, setAction] = useState('');
    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    });

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/activity-logs', {
                params: {
                    page,
                    limit: 20,
                    search: search.trim() || undefined,
                    action: action || undefined
                }
            });

            setLogs(response.data.logs || []);
            setPagination(response.data.pagination || {
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0
            });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load activity logs.'
            );
        } finally {
            setLoading(false);
        }
    }, [page, search, action]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 sm:space-y-6">

            {/* Header */}
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Activity Logs
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitor activities and changes across your organization.
                    </p>
                </div>

                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50 sm:w-auto sm:py-2.5"
                >
                    <span>↻</span>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">

                <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
                    <p className="break-words text-xs text-gray-500 sm:text-sm">Total Activities</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                        {pagination.total}
                    </h2>
                    <p className="mt-2 break-words text-[10px] text-gray-400 sm:text-xs">
                        Recorded organization activities
                    </p>
                </div>

                <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
                    <p className="break-words text-xs text-gray-500 sm:text-sm">Current Page</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                        {pagination.page}
                    </h2>
                    <p className="mt-2 break-words text-[10px] text-gray-400 sm:text-xs">
                        Currently viewing
                    </p>
                </div>

                <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
                    <p className="break-words text-xs text-gray-500 sm:text-sm">Total Pages</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                        {pagination.totalPages}
                    </h2>
                    <p className="mt-2 break-words text-[10px] text-gray-400 sm:text-xs">
                        Available activity pages
                    </p>
                </div>

            </div>

            {/* Filters */}
            <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">

                    <div className="relative min-w-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full min-w-0 rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <select
                        value={action}
                        onChange={(e) => {
                            setAction(e.target.value);
                            setPage(1);
                        }}
                        className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        {activityTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>

                </div>
            </div>

            {/* Activity Container */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Recent Activities
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Organization activity history
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                        {pagination.total} Records
                    </span>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="py-16 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 mt-4">
                            Loading activities...
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="py-12 text-center">
                        <p className="text-red-600 text-sm">{error}</p>

                        <button
                            onClick={fetchLogs}
                            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && logs.length === 0 && (
                    <div className="py-16 text-center px-4">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-2xl text-gray-500">
                            ◷
                        </div>

                        <h3 className="font-semibold text-gray-900 mt-4">
                            No activities found
                        </h3>

                        <p className="text-sm text-gray-500 mt-2">
                            Activities will appear here when users perform
                            actions in your workspace.
                        </p>
                    </div>
                )}

                {/* Activity Timeline */}
                {!loading && !error && logs.length > 0 && (
                    <div className="divide-y divide-gray-100">

                        {logs.map(log => {
                            const style = getActionStyle(log.action);

                            return (
                                <div
                                    key={log._id}
                                    className="flex min-w-0 gap-3 p-4 transition hover:bg-gray-50 sm:gap-4 sm:p-5"
                                >
                                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg ${style.color}`}>
                                        {style.icon}
                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-sm text-gray-900">
                                                    {formatAction(log.action)}
                                                </h3>

                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${style.color}`}>
                                                    {log.user?.role || 'User'}
                                                </span>
                                            </div>

                                            <span className="text-xs text-gray-400 shrink-0">
                                                {formatDate(log.createdAt)}
                                            </span>
                                        </div>

                                        <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                                            {log.description}
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 break-words text-xs text-gray-500 sm:gap-x-5">
                                            <span>
                                                <strong className="text-gray-700">By:</strong>{' '}
                                                {log.user?.name || 'Unknown User'}
                                            </span>

                                            {log.relatedTask && (
                                                <span>
                                                    <strong className="text-gray-700">Task:</strong>{' '}
                                                    {log.relatedTask.title}
                                                </span>
                                            )}

                                            {log.relatedProject && (
                                                <span>
                                                    <strong className="text-gray-700">Project:</strong>{' '}
                                                    {log.relatedProject.name}
                                                </span>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            );
                        })}

                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && pagination.totalPages > 1 && (
                    <div className="flex flex-col items-stretch justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">

                        <p className="break-words text-xs text-gray-500 sm:text-sm">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>

                        <div className="grid grid-cols-2 gap-2 sm:flex">

                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(prev => prev - 1)}
                                className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                            >
                                ← Previous
                            </button>

                            <button
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(prev => prev + 1)}
                                className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                            >
                                Next →
                            </button>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
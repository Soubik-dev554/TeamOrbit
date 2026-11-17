import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const getStatusLabel = (status) => {
    const labels = {
        todo: 'To do',
        'in-progress': 'In progress',
        done: 'Done'
    };

    return labels[status] || status;
};

function Dashboard() {
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [employeeTasks, setEmployeeTasks] = useState([]);
    const [performance, setPerformance] = useState(null);

    const [error, setError] = useState('');
    const [analyticsError, setAnalyticsError] = useState('');
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const [updatingTask, setUpdatingTask] = useState(null);

    const isEmployee = user?.role === 'employee';
    const isCompanyAdmin = user?.role === 'admin';

    // ============================================
    // ADMIN DASHBOARD DATA
    // ============================================

    const loadDashboard = async () => {
        try {
            setError('');

            const response = await api.get('/dashboard');
            setData(response.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to load dashboard.'
            );
        }
    };

    // ============================================
    // EMPLOYEE PERFORMANCE ANALYTICS
    // ============================================

    const loadEmployeePerformance = async () => {
        try {
            setAnalyticsLoading(true);
            setAnalyticsError('');

            const response = await api.get(
                '/dashboard/employee-performance'
            );

            setPerformance(response.data);
        } catch (err) {
            setAnalyticsError(
                err.response?.data?.message ||
                err.message ||
                'Unable to load employee analytics.'
            );
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // ============================================
    // EMPLOYEE ASSIGNED TASKS
    // ============================================

    const loadEmployeeTasks = async () => {
        try {
            const response = await api.get('/tasks');

            setEmployeeTasks(response.data.tasks || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to load assigned tasks.'
            );
        }
    };

    useEffect(() => {
        if (isEmployee) {
            loadEmployeeTasks();
        } else {
            loadDashboard();

            if (isCompanyAdmin) {
                loadEmployeePerformance();
            }
        }
    }, [isEmployee, isCompanyAdmin]);

    // ============================================
    // EMPLOYEE UPDATES TASK STATUS
    // ============================================

    const updateTaskStatus = async (taskId, status) => {
        try {
            setUpdatingTask(taskId);
            setError('');

            await api.patch(`/tasks/${taskId}`, { status });

            await loadEmployeeTasks();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to update task status.'
            );
        } finally {
            setUpdatingTask(null);
        }
    };

    if (error) {
        return <div className="alert">{error}</div>;
    }

    // ============================================
    // EMPLOYEE DASHBOARD
    // ============================================

    if (isEmployee) {
        const completed = employeeTasks.filter(
            task => task.status === 'done'
        ).length;

        const inProgress = employeeTasks.filter(
            task => task.status === 'in-progress'
        ).length;

        const todo = employeeTasks.filter(
            task => task.status === 'todo'
        ).length;

        const completedPercentage = employeeTasks.length
            ? Math.round((completed / employeeTasks.length) * 100)
            : 0;

        return (
            <>
                {/* Dashboard Heading */}

                <div className="page-heading flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="eyebrow">YOUR WORKSPACE</div>

                        <h1>My Dashboard</h1>

                        <p className="muted">
                            Welcome back, {user?.name}. Here's your assigned work.
                        </p>
                    </div>
                </div>

                {/* Statistics */}

                <div className="stats-grid">
                    <Stat
                        label="Total assigned tasks"
                        value={employeeTasks.length}
                        icon="☷"
                        tone="violet"
                    />

                    <Stat
                        label="To do"
                        value={todo}
                        icon="◷"
                        tone="amber"
                    />

                    <Stat
                        label="In progress"
                        value={inProgress}
                        icon="◴"
                        tone="blue"
                    />

                    <Stat
                        label="Completed"
                        value={completed}
                        icon="✓"
                        tone="green"
                    />
                </div>

                {/* Task Progress */}

                <section className="panel min-w-0">
                    <div className="panel-heading">
                        <div>
                            <h2>My Task Progress</h2>

                            <p className="muted">
                                Your overall task completion
                            </p>
                        </div>
                    </div>

                    <div className="progress-summary">
                        <div className="progress-number">
                            {completedPercentage}
                            <small>%</small>
                        </div>

                        <p className="muted">
                            of your tasks completed
                        </p>

                        <div className="progress-track">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${completedPercentage}%`
                                }}
                            />
                        </div>

                        <div className="progress-legend">
                            <span>
                                <i className="dot dot-gray" /> To do
                                <b>{todo}</b>
                            </span>

                            <span>
                                <i className="dot dot-blue" /> In progress
                                <b>{inProgress}</b>
                            </span>

                            <span>
                                <i className="dot dot-green" /> Done
                                <b>{completed}</b>
                            </span>
                        </div>
                    </div>
                </section>

                {/* Assigned Tasks */}

                <section className="panel recent-panel min-w-0">
                    <div className="panel-heading flex-wrap">
                        <div className="min-w-0">
                            <h2>My Assigned Tasks</h2>

                            <p className="muted">
                                View your tasks and update their progress.
                            </p>
                        </div>

                        <Link to="/tasks">All tasks ↗</Link>
                    </div>

                    {employeeTasks.length > 0 ? (
                        <>
                            {/* Desktop and Tablet Table */}

                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr>
                                            <th>TASK</th>
                                            <th>PROJECT</th>
                                            <th>PRIORITY</th>
                                            <th>DUE DATE</th>
                                            <th>STATUS</th>
                                            <th>UPDATE STATUS</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {employeeTasks.map(task => (
                                            <tr key={task._id}>
                                                <td>
                                                    <strong>{task.title}</strong>

                                                    {task.description && (
                                                        <small className="muted block whitespace-normal">
                                                            {task.description}
                                                        </small>
                                                    )}
                                                </td>

                                                <td>
                                                    {task.project?.name || '-'}
                                                </td>

                                                <td>
                                                    <Priority value={task.priority} />
                                                </td>

                                                <td>
                                                    {task.dueDate
                                                        ? new Date(task.dueDate).toLocaleDateString()
                                                        : '-'}
                                                </td>

                                                <td>
                                                    <Status value={task.status} />
                                                </td>

                                                <td>
                                                    <select
                                                        className="inline-select max-w-full"
                                                        value={task.status}
                                                        disabled={updatingTask === task._id}
                                                        onChange={(e) =>
                                                            updateTaskStatus(
                                                                task._id,
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="todo">
                                                            To do
                                                        </option>

                                                        <option value="in-progress">
                                                            In progress
                                                        </option>

                                                        <option value="done">
                                                            Done
                                                        </option>
                                                    </select>

                                                    {updatingTask === task._id && (
                                                        <small className="muted block">
                                                            Updating...
                                                        </small>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Task Cards */}

                            <div className="grid min-w-0 grid-cols-1 gap-3 sm:hidden">
                                {employeeTasks.map(task => (
                                    <div
                                        key={task._id}
                                        className="min-w-0 rounded-xl border border-[#eceef5] bg-white p-4"
                                    >
                                        {/* Task Information */}

                                        <div className="min-w-0">
                                            <h3 className="break-words text-sm font-bold text-[#20243a]">
                                                {task.title}
                                            </h3>

                                            {task.description && (
                                                <p className="mt-2 break-words text-xs leading-relaxed text-[#858ba1]">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Project */}

                                        <div className="mt-4 border-t border-[#eceef5] pt-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a0a5b5]">
                                                Project
                                            </p>

                                            <p className="mt-1 break-words text-xs font-medium text-[#34394e]">
                                                {task.project?.name || '-'}
                                            </p>
                                        </div>

                                        {/* Priority and Due Date */}

                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a0a5b5]">
                                                    Priority
                                                </p>

                                                <div className="mt-2">
                                                    <Priority value={task.priority} />
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a0a5b5]">
                                                    Due Date
                                                </p>

                                                <p className="mt-2 break-words text-xs font-medium text-[#34394e]">
                                                    {task.dueDate
                                                        ? new Date(task.dueDate).toLocaleDateString()
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Current Status */}

                                        <div className="mt-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a0a5b5]">
                                                Current Status
                                            </p>

                                            <div className="mt-2">
                                                <Status value={task.status} />
                                            </div>
                                        </div>

                                        {/* Update Status */}

                                        <div className="mt-4 border-t border-[#eceef5] pt-3">
                                            <label
                                                htmlFor={`task-status-${task._id}`}
                                                className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-[#a0a5b5]"
                                            >
                                                Update Status
                                            </label>

                                            <select
                                                id={`task-status-${task._id}`}
                                                className="w-full rounded-lg border border-[#e4e6ef] bg-white px-3 py-2.5 text-xs text-[#34394e] outline-none focus:border-[#a69df3] focus:ring-2 focus:ring-[#6858df12]"
                                                value={task.status}
                                                disabled={updatingTask === task._id}
                                                onChange={(e) =>
                                                    updateTaskStatus(
                                                        task._id,
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="todo">
                                                    To do
                                                </option>

                                                <option value="in-progress">
                                                    In progress
                                                </option>

                                                <option value="done">
                                                    Done
                                                </option>
                                            </select>

                                            {updatingTask === task._id && (
                                                <p className="mt-2 text-[11px] text-[#858ba1]">
                                                    Updating...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Empty text="You don't have any assigned tasks yet." />
                    )}
                </section>
            </>
        );
    }

    // ============================================
    // COMPANY ADMIN DASHBOARD
    // ============================================

    if (!data) {
        return <div className="muted">Loading dashboard...</div>;
    }

    const { summary, projects, recentTasks } = data;

    const completedPercentage = summary.totalTasks
        ? Math.round((summary.done / summary.totalTasks) * 100)
        : 0;

    const analyticsSummary = performance?.summary;
    const employeePerformance = performance?.employeePerformance || [];

    return (
        <>
            {/* Dashboard Heading */}

            <div className="page-heading flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="eyebrow">YOUR WORKSPACE</div>

                    <h1>Overview</h1>

                    <p className="muted">
                        Here's what's happening across your projects.
                    </p>
                </div>

                <Link
                    to="/projects"
                    className="btn btn-primary w-full sm:w-auto"
                >
                    + New project
                </Link>
            </div>

            {/* Dashboard Statistics */}

            <div className="stats-grid">
                <Stat
                    label="Total projects"
                    value={summary.totalProjects}
                    icon="▣"
                    tone="violet"
                />

                <Stat
                    label="Total tasks"
                    value={summary.totalTasks}
                    icon="☷"
                    tone="blue"
                />

                <Stat
                    label="In progress"
                    value={summary.inProgress}
                    icon="◷"
                    tone="amber"
                />

                <Stat
                    label="Completed tasks"
                    value={summary.done}
                    icon="✓"
                    tone="green"
                />
            </div>

            {/* =====================================
                EMPLOYEE PERFORMANCE ANALYTICS
            ====================================== */}

            <section className="panel min-w-0">
                <div className="panel-heading flex-wrap">
                    <div className="min-w-0">
                        <h2>Employee Performance Analytics</h2>

                        <p className="muted">
                            Monitor employee productivity and task completion.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary shrink-0"
                        onClick={loadEmployeePerformance}
                        disabled={analyticsLoading}
                    >
                        {analyticsLoading ? 'Refreshing...' : '↻ Refresh'}
                    </button>
                </div>

                {analyticsLoading && !performance ? (
                    <div className="empty-state">
                        <p>Loading employee analytics...</p>
                    </div>
                ) : analyticsError ? (
                    <div className="alert">
                        {analyticsError}
                    </div>
                ) : analyticsSummary ? (
                    <>
                        {/* Analytics Summary Cards */}

                        <div className="stats-grid">
                            <Stat
                                label="Total employees"
                                value={analyticsSummary.totalEmployees}
                                icon="👥"
                                tone="violet"
                            />

                            <Stat
                                label="Assigned tasks"
                                value={analyticsSummary.totalTasks}
                                icon="☷"
                                tone="blue"
                            />

                            <Stat
                                label="Completed tasks"
                                value={analyticsSummary.completedTasks}
                                icon="✓"
                                tone="green"
                            />

                            <Stat
                                label="Pending tasks"
                                value={analyticsSummary.pendingTasks}
                                icon="◷"
                                tone="amber"
                            />

                            <Stat
                                label="Overdue tasks"
                                value={analyticsSummary.overdueTasks}
                                icon="⚠"
                                tone="red"
                            />

                            <Stat
                                label="Overall completion"
                                value={`${analyticsSummary.completionPercentage}%`}
                                icon="📊"
                                tone="green"
                            />
                        </div>

                        {/* Overall Progress */}

                        <div className="progress-summary">
                            <h3 className="text-sm font-semibold">
                                Organization Task Completion
                            </h3>

                            <div className="progress-number">
                                {analyticsSummary.completionPercentage}
                                <small>%</small>
                            </div>

                            <p className="muted">
                                Overall employee task completion rate
                            </p>

                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${analyticsSummary.completionPercentage}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Individual Employee Performance */}

                        <div className="mb-4 mt-6">
                            <h2 className="font-['Manrope'] text-[15px] font-bold">
                                Individual Employee Performance
                            </h2>

                            <p className="muted">
                                Compare assigned tasks and completion rates.
                            </p>
                        </div>

                        {employeePerformance.length > 0 ? (
                            <>
                                {/* Desktop and Tablet Table */}

                                <div className="hidden overflow-x-auto sm:block">
                                    <table className="w-full min-w-[650px]">
                                        <thead>
                                            <tr>
                                                <th>EMPLOYEE</th>
                                                <th>STATUS</th>
                                                <th>TOTAL TASKS</th>
                                                <th>COMPLETED</th>
                                                <th>PENDING</th>
                                                <th>OVERDUE</th>
                                                <th>COMPLETION</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {employeePerformance.map(item => (
                                                <tr key={item.employee._id}>
                                                    <td>
                                                        <strong>
                                                            {item.employee.name}
                                                        </strong>

                                                        <small className="muted block">
                                                            {item.employee.email}
                                                        </small>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`pill ${
                                                                item.employee.isActive
                                                                    ? 'status-done'
                                                                    : 'status-todo'
                                                            }`}
                                                        >
                                                            {item.employee.isActive
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </span>
                                                    </td>

                                                    <td>{item.totalTasks}</td>

                                                    <td>
                                                        <strong className="text-green-600">
                                                            {item.completedTasks}
                                                        </strong>
                                                    </td>

                                                    <td>{item.pendingTasks}</td>

                                                    <td>
                                                        <strong className="text-red-600">
                                                            {item.overdueTasks}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <div className="flex min-w-[100px] items-center gap-2">
                                                            <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#f0f1f7]">
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-[#7565ed] to-[#9b8cf8]"
                                                                    style={{
                                                                        width: `${item.completionPercentage}%`
                                                                    }}
                                                                />
                                                            </div>

                                                            <strong>
                                                                {item.completionPercentage}%
                                                            </strong>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Employee Cards */}

                                <div className="grid min-w-0 grid-cols-1 gap-3 sm:hidden">
                                    {employeePerformance.map(item => (
                                        <div
                                            key={item.employee._id}
                                            className="min-w-0 rounded-xl border border-[#eceef5] bg-white p-4"
                                        >
                                            <div className="flex min-w-0 items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="break-words text-sm font-bold text-[#20243a]">
                                                        {item.employee.name}
                                                    </h3>

                                                    <p className="mt-1 break-all text-[11px] text-[#858ba1]">
                                                        {item.employee.email}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`pill shrink-0 ${
                                                        item.employee.isActive
                                                            ? 'status-done'
                                                            : 'status-todo'
                                                    }`}
                                                >
                                                    {item.employee.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="rounded-lg bg-[#f8f9fc] p-3">
                                                    <p className="text-[10px] text-[#858ba1]">
                                                        Total Tasks
                                                    </p>
                                                    <strong className="mt-1 block text-lg">
                                                        {item.totalTasks}
                                                    </strong>
                                                </div>

                                                <div className="rounded-lg bg-[#f8f9fc] p-3">
                                                    <p className="text-[10px] text-[#858ba1]">
                                                        Completed
                                                    </p>
                                                    <strong className="mt-1 block text-lg text-green-600">
                                                        {item.completedTasks}
                                                    </strong>
                                                </div>

                                                <div className="rounded-lg bg-[#f8f9fc] p-3">
                                                    <p className="text-[10px] text-[#858ba1]">
                                                        Pending
                                                    </p>
                                                    <strong className="mt-1 block text-lg">
                                                        {item.pendingTasks}
                                                    </strong>
                                                </div>

                                                <div className="rounded-lg bg-[#f8f9fc] p-3">
                                                    <p className="text-[10px] text-[#858ba1]">
                                                        Overdue
                                                    </p>
                                                    <strong className="mt-1 block text-lg text-red-600">
                                                        {item.overdueTasks}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-[11px] text-[#858ba1]">
                                                        Completion
                                                    </span>

                                                    <strong className="text-sm text-[#20243a]">
                                                        {item.completionPercentage}%
                                                    </strong>
                                                </div>

                                                <div className="h-2 overflow-hidden rounded-full bg-[#f0f1f7]">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-[#7565ed] to-[#9b8cf8]"
                                                        style={{
                                                            width: `${item.completionPercentage}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <Empty text="No employees found in your organization." />
                        )}
                    </>
                ) : null}
            </section>

            {/* =====================================
                PROJECT DASHBOARD
            ====================================== */}

            <div className="dashboard-grid">
                <section className="panel min-w-0">
                    <div className="panel-heading">
                        <div className="min-w-0">
                            <h2>Your projects</h2>

                            <p className="muted">
                                Recently updated work
                            </p>
                        </div>

                        <Link to="/projects">View all ↗</Link>
                    </div>

                    {projects.length > 0 ? (
                        projects.map(project => (
                            <Link
                                to={`/projects/${project._id}`}
                                className="project-row min-w-0"
                                key={project._id}
                            >
                                <span className="project-icon">▣</span>

                                <span className="row-main">
                                    <strong>{project.name}</strong>

                                    <small>
                                        {project.status} · Updated{' '}
                                        {new Date(project.updatedAt).toLocaleDateString()}
                                    </small>
                                </span>

                                <span className="row-arrow">→</span>
                            </Link>
                        ))
                    ) : (
                        <Empty text="No projects yet. Create your first project to get started." />
                    )}
                </section>

                <section className="panel min-w-0">
                    <div className="panel-heading">
                        <div>
                            <h2>Task progress</h2>

                            <p className="muted">
                                Across all your projects
                            </p>
                        </div>
                    </div>

                    <div className="progress-summary">
                        <div className="progress-number">
                            {completedPercentage}
                            <small>%</small>
                        </div>

                        <p className="muted">
                            of tasks completed
                        </p>

                        <div className="progress-track">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${completedPercentage}%`
                                }}
                            />
                        </div>

                        <div className="progress-legend">
                            <span>
                                <i className="dot dot-gray" /> To do
                                <b>{summary.todo}</b>
                            </span>

                            <span>
                                <i className="dot dot-blue" /> In progress
                                <b>{summary.inProgress}</b>
                            </span>

                            <span>
                                <i className="dot dot-green" /> Done
                                <b>{summary.done}</b>
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            {/* =====================================
                RECENT TASKS
            ====================================== */}

            <section className="panel recent-panel min-w-0">
                <div className="panel-heading flex-wrap">
                    <div className="min-w-0">
                        <h2>Recent tasks</h2>

                        <p className="muted">
                            Latest activity in your workspace
                        </p>
                    </div>

                    <Link to="/tasks">All tasks ↗</Link>
                </div>

                {recentTasks.length > 0 ? (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>TASK</th>
                                    <th>PROJECT</th>
                                    <th>ASSIGNEE</th>
                                    <th>PRIORITY</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentTasks.map(task => (
                                    <tr key={task._id}>
                                        <td>
                                            <strong>{task.title}</strong>
                                        </td>

                                        <td>
                                            {task.project?.name || '-'}
                                        </td>

                                        <td>
                                            {task.assignee?.name || 'Unassigned'}
                                        </td>

                                        <td>
                                            <Priority value={task.priority} />
                                        </td>

                                        <td>
                                            <Status value={task.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Empty text="Tasks you create will appear here." />
                )}
            </section>
        </>
    );
}

export default Dashboard;


// ============================================
// REUSABLE COMPONENTS
// ============================================

// Statistics Card

export function Stat({ label, value, icon, tone }) {
    const toneClasses = {
        violet: 'bg-[#efedff] text-[#6c5ce7]',
        blue: 'bg-[#e9f4ff] text-[#4394e8]',
        amber: 'bg-[#fff3dc] text-[#db9a30]',
        green: 'bg-[#e4f9f0] text-[#27a77b]',
        red: 'bg-red-50 text-red-600'
    };

    return (
        <div className="stat-card min-w-0">
            <span
                className={`stat-icon ${toneClasses[tone] || toneClasses.violet}`}
            >
                {icon}
            </span>

            <span className="stat-label break-words">
                {label}
            </span>

            <strong className="stat-value break-words">
                {value}
            </strong>

            <span className="stat-foot">
                In your workspace
            </span>
        </div>
    );
}


// Empty State

export function Empty({ text }) {
    return (
        <div className="empty-state">
            <span>✳</span>
            <p>{text}</p>
        </div>
    );
}


// Task Status Badge

export function Status({ value }) {
    return (
        <span className={`pill status-${value}`}>
            {getStatusLabel(value)}
        </span>
    );
}


// Task Priority Badge

export function Priority({ value }) {
    return (
        <span className={`priority priority-${value}`}>
            {value}
        </span>
    );
}

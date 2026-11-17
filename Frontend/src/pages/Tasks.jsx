import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Priority } from './Dashboard';

const Tasks = () => {

    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        priority: '',
        projectId: ''
    });

    const [error, setError] = useState('');

    // COMMENT STATES
    const [selectedTask, setSelectedTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const isAdmin = user?.role === 'admin';


    // GET TASKS AND PROJECTS
    const loadTasks = async () => {

        try {
            const [taskResponse, projectResponse] = await Promise.all([
                api.get('/tasks', {
                    params: filters
                }),

                api.get('/projects')
            ]);

            setTasks(taskResponse.data.tasks);
            setProjects(projectResponse.data.projects);

            setError('');

        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };


    useEffect(() => {
        loadTasks();
    }, [
        filters.search,
        filters.status,
        filters.priority,
        filters.projectId
    ]);


    // HANDLE FILTER CHANGES
    const handleFilterChange = (e) => {

        const { name, value } = e.target;

        setFilters({
            ...filters,
            [name]: value
        });
    };


    // UPDATE TASK STATUS
    const handleStatusChange = async (task, status) => {

        try {
            await api.patch(`/tasks/${task._id}`, {
                status: status
            });

            loadTasks();

        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };


    // DELETE TASK
    const handleDelete = async (task) => {

        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${task.title}"?`
        );

        if (!confirmDelete) return;

        try {
            await api.delete(`/tasks/${task._id}`);

            if (selectedTask?._id === task._id) {
                setSelectedTask(null);
                setComments([]);
            }

            loadTasks();

        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };


    // LOAD COMMENTS
    const loadComments = async (task) => {

        setCommentsLoading(true);
        setCommentError('');

        try {
            const response = await api.get(`/comments/${task._id}`);

            setComments(response.data.comments || []);

        } catch (err) {
            setCommentError(
                err.response?.data?.message || 'Failed to load comments.'
            );
        } finally {
            setCommentsLoading(false);
        }
    };


    // OPEN OR CLOSE COMMENTS
    const handleOpenComments = async (task) => {

        if (selectedTask?._id === task._id) {
            setSelectedTask(null);
            setComments([]);
            setCommentText('');
            setEditingCommentId(null);
            return;
        }

        setSelectedTask(task);
        setComments([]);
        setCommentText('');
        setEditingCommentId(null);

        await loadComments(task);
    };


    // AUTOMATICALLY OPEN TASK FROM NOTIFICATION
    useEffect(() => {

        const taskId = location.state?.openTaskId;

        if (!taskId || tasks.length === 0) return;

        const task = tasks.find(
            item => item._id === taskId
        );

        if (!task) {
            // Clear stale notification navigation state
            navigate('/tasks', {
                replace: true,
                state: null
            });

            return;
        }

        if (location.state?.openComments) {

            setSelectedTask(task);
            setComments([]);
            setCommentText('');
            setEditingCommentId(null);

            // Load comments for the selected task
            const fetchTaskComments = async () => {

                setCommentsLoading(true);
                setCommentError('');

                try {
                    const response = await api.get(
                        `/comments/${task._id}`
                    );

                    setComments(response.data.comments || []);

                } catch (err) {
                    setCommentError(
                        err.response?.data?.message ||
                        'Failed to load comments.'
                    );
                } finally {
                    setCommentsLoading(false);
                }
            };

            fetchTaskComments();

        }

        // Clear navigation state to prevent reopening
        navigate('/tasks', {
            replace: true,
            state: null
        });

    }, [location.state, tasks, navigate]);


    // ADD COMMENT
    const handleAddComment = async (e) => {

        e.preventDefault();

        if (!commentText.trim() || !selectedTask) return;

        setCommentSubmitting(true);
        setCommentError('');

        try {
            await api.post(`/comments/${selectedTask._id}`, {
                content: commentText.trim()
            });

            setCommentText('');

            await loadComments(selectedTask);

        } catch (err) {
            setCommentError(
                err.response?.data?.message || 'Failed to add comment.'
            );
        } finally {
            setCommentSubmitting(false);
        }
    };


    // START EDITING COMMENT
    const handleEditStart = (comment) => {

        setEditingCommentId(comment._id);
        setEditContent(comment.content);
    };


    // CANCEL COMMENT EDIT
    const handleEditCancel = () => {

        setEditingCommentId(null);
        setEditContent('');
    };


    // SAVE COMMENT EDIT
    const handleEditComment = async (commentId) => {

        if (!editContent.trim()) {
            setCommentError('Comment cannot be empty.');
            return;
        }

        setCommentSubmitting(true);
        setCommentError('');

        try {
            await api.put(`/comments/${commentId}`, {
                content: editContent.trim()
            });

            setEditingCommentId(null);
            setEditContent('');

            await loadComments(selectedTask);

        } catch (err) {
            setCommentError(
                err.response?.data?.message || 'Failed to update comment.'
            );
        } finally {
            setCommentSubmitting(false);
        }
    };


    // DELETE COMMENT
    const handleDeleteComment = async (commentId) => {

        const confirmed = window.confirm(
            'Are you sure you want to delete this comment?'
        );

        if (!confirmed) return;

        setCommentError('');

        try {
            await api.delete(`/comments/${commentId}`);

            setComments(prev =>
                prev.filter(comment => comment._id !== commentId)
            );

        } catch (err) {
            setCommentError(
                err.response?.data?.message || 'Failed to delete comment.'
            );
        }
    };


    // CLEAR FILTERS
    const clearFilters = () => {

        setFilters({
            search: '',
            status: '',
            priority: '',
            projectId: ''
        });
    };


    // CHECK COMMENT PERMISSIONS
    const canEditComment = (comment) => {

        const authorId = comment.author?._id;

        return (
            authorId === user?._id ||
            authorId === user?.id
        );
    };


    const canDeleteComment = (comment) => {

        return isAdmin || canEditComment(comment);
    };


    return (
        <>

            <div className="page-heading flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <div className="eyebrow">ALL YOUR WORK</div>

                    <h1>Tasks</h1>

                    <p className="muted">
                        Search, filter, and keep every task moving.
                    </p>
                </div>

            </div>


            {error && (
                <div className="alert">
                    {error}
                </div>
            )}


            <section className="panel min-w-0">

                {/* SEARCH AND FILTERS */}
                <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(130px,auto))]">

                    <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            ⌕
                        </span>

                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search tasks by title..."
                            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <select
                        name="projectId"
                        value={filters.projectId}
                        onChange={handleFilterChange}
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="">All projects</option>

                        {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.name}
                            </option>
                        ))}
                    </select>

                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="">All statuses</option>
                        <option value="todo">To do</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Done</option>
                    </select>

                    <select
                        name="priority"
                        value={filters.priority}
                        onChange={handleFilterChange}
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="">All priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>

                </div>


                <div className="panel-heading task-results-heading flex-wrap">

                    <h2>
                        Task list{' '}
                        <span className="count-badge">
                            {tasks.length}
                        </span>
                    </h2>

                </div>


                {tasks.length > 0 ? (
                    <>
                        {/* DESKTOP TABLE */}
                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full min-w-[760px]">
                                <thead>
                                    <tr>
                                        <th>TASK</th>
                                        <th>PROJECT</th>
                                        <th>ASSIGNEE</th>
                                        <th>PRIORITY</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {tasks.map((task) => (
                                        <tr key={task._id}>
                                            <td>
                                                <strong>{task.title}</strong>
                                                <div className="table-sub">
                                                    {task.dueDate
                                                        ? `Due ${new Date(task.dueDate).toLocaleDateString()}`
                                                        : task.description}
                                                </div>
                                            </td>

                                            <td>{task.project?.name || '-'}</td>
                                            <td>{task.assignee?.name || 'Unassigned'}</td>

                                            <td>
                                                <Priority value={task.priority} />
                                            </td>

                                            <td>
                                                <select
                                                    className="inline-select"
                                                    value={task.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(task, e.target.value)
                                                    }
                                                >
                                                    <option value="todo">To do</option>
                                                    <option value="in-progress">In progress</option>
                                                    <option value="done">Done</option>
                                                </select>
                                            </td>

                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        className="text-action"
                                                        onClick={() => handleOpenComments(task)}
                                                    >
                                                        {selectedTask?._id === task._id ? 'Close' : 'Comments'}
                                                    </button>

                                                    {isAdmin && (
                                                        <button
                                                            className="text-action danger-text"
                                                            onClick={() => handleDelete(task)}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE TASK CARDS */}
                        <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:hidden">
                            {tasks.map((task) => (
                                <article
                                    key={task._id}
                                    className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="break-words text-sm font-bold text-slate-900">
                                                {task.title}
                                            </h3>
                                            <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                                                {task.description || 'No description added.'}
                                            </p>
                                        </div>

                                        <div className="shrink-0">
                                            <Priority value={task.priority} />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-100 pt-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Project
                                            </p>
                                            <p className="mt-1 break-words text-xs font-medium text-slate-700">
                                                {task.project?.name || '-'}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Assignee
                                            </p>
                                            <p className="mt-1 break-words text-xs font-medium text-slate-700">
                                                {task.assignee?.name || 'Unassigned'}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Due date
                                            </p>
                                            <p className="mt-1 break-words text-xs font-medium text-slate-700">
                                                {task.dueDate
                                                    ? new Date(task.dueDate).toLocaleDateString()
                                                    : '-'}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Status
                                            </p>
                                            <div className="mt-1">
                                                <span className={`pill status-${task.status}`}>
                                                    {task.status === 'todo'
                                                        ? 'To do'
                                                        : task.status === 'in-progress'
                                                            ? 'In progress'
                                                            : 'Done'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-slate-100 pt-3">
                                        <label
                                            htmlFor={`task-status-mobile-${task._id}`}
                                            className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                                        >
                                            Update status
                                        </label>

                                        <select
                                            id={`task-status-mobile-${task._id}`}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                            value={task.status}
                                            onChange={(e) =>
                                                handleStatusChange(task, e.target.value)
                                            }
                                        >
                                            <option value="todo">To do</option>
                                            <option value="in-progress">In progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                                        <button
                                            type="button"
                                            className="text-sm font-semibold text-indigo-600"
                                            onClick={() => handleOpenComments(task)}
                                        >
                                            {selectedTask?._id === task._id ? 'Close comments' : 'Comments'}
                                        </button>

                                        {isAdmin && (
                                            <button
                                                type="button"
                                                className="text-sm font-semibold text-red-500"
                                                onClick={() => handleDelete(task)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <span>⌕</span>
                        <p>No tasks match those filters.</p>
                        <button
                            className="btn btn-light"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </button>
                    </div>
                )}

            </section>


            {/* TASK COMMENTS SECTION */}
            {selectedTask && (

                <section
                    className="panel mt-6 min-w-0"
                >

                    <div className="panel-heading">

                        <div>
                            <div className="eyebrow">
                                TASK DISCUSSION
                            </div>

                            <h2>
                                {selectedTask.title}
                            </h2>

                            <p className="muted">
                                Discuss this task with your team.
                            </p>
                        </div>

                        <button
                            className="btn btn-light"
                            onClick={() => handleOpenComments(selectedTask)}
                        >
                            Close
                        </button>

                    </div>


                    {commentError && (
                        <div className="alert">
                            {commentError}
                        </div>
                    )}


                    {/* ADD COMMENT FORM */}
                    <form
                        onSubmit={handleAddComment}
                        style={{ marginTop: '20px' }}
                    >

                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            maxLength={2000}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                resize: 'vertical',
                                font: 'inherit'
                            }}
                        />

                        <div
                            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >

                            <small className="muted">
                                {commentText.length}/2000 characters
                            </small>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    !commentText.trim() || commentSubmitting
                                }
                            >
                                {commentSubmitting
                                    ? 'Posting...'
                                    : 'Post Comment'}
                            </button>

                        </div>

                    </form>


                    {/* COMMENT LIST */}
                    <div style={{ marginTop: '28px' }}>

                        <div className="panel-heading">

                            <h3>
                                Discussion ({comments.length})
                            </h3>

                        </div>


                        {commentsLoading ? (

                            <p className="muted">
                                Loading comments...
                            </p>

                        ) : comments.length > 0 ? (

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}
                            >

                                {comments.map((comment) => (

                                    <div
                                        key={comment._id}
                                        style={{
                                            padding: '16px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '10px'
                                        }}
                                    >

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                            <div>
                                                <strong>
                                                    {comment.author?.name || 'Unknown User'}
                                                </strong>

                                                <div className="table-sub">
                                                    {new Date(
                                                        comment.createdAt
                                                    ).toLocaleString()}

                                                    {new Date(comment.updatedAt).getTime() !==
                                                        new Date(comment.createdAt).getTime() &&
                                                        ' · Edited'}
                                                </div>
                                            </div>


                                            <div className="flex flex-wrap items-center gap-3">

                                                {canEditComment(comment) && (
                                                    <button
                                                        className="text-action"
                                                        onClick={() =>
                                                            handleEditStart(comment)
                                                        }
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                {canDeleteComment(comment) && (
                                                    <button
                                                        className="text-action danger-text"
                                                        onClick={() =>
                                                            handleDeleteComment(comment._id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                )}

                                            </div>

                                        </div>


                                        {editingCommentId === comment._id ? (

                                            <div style={{ marginTop: '14px' }}>

                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) =>
                                                        setEditContent(e.target.value)
                                                    }
                                                    maxLength={2000}
                                                    rows={3}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        resize: 'vertical',
                                                        font: 'inherit'
                                                    }}
                                                />

                                                <div
                                                    className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
                                                >

                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        disabled={
                                                            !editContent.trim() ||
                                                            commentSubmitting
                                                        }
                                                        onClick={() =>
                                                            handleEditComment(comment._id)
                                                        }
                                                    >
                                                        Save Changes
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-light"
                                                        onClick={handleEditCancel}
                                                    >
                                                        Cancel
                                                    </button>

                                                </div>

                                            </div>

                                        ) : (

                                            <p
                                                style={{
                                                    marginTop: '14px',
                                                    whiteSpace: 'pre-wrap',
                                                    overflowWrap: 'anywhere'
                                                }}
                                            >
                                                {comment.content}
                                            </p>

                                        )}

                                    </div>

                                ))}

                            </div>

                        ) : (

                            <div className="empty-state">
                                <p>No comments yet.</p>
                                <small>
                                    Start the discussion by adding the first comment.
                                </small>
                            </div>

                        )}

                    </div>

                </section>

            )}

        </>
    );
};

export default Tasks;

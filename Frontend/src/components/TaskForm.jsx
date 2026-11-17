import { useEffect, useState } from 'react';
import api from '../api';

const initial = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  assignee: ''
};

export default function TaskForm({ projectId, task, onSaved, onCancel }) {
  const [form, setForm] = useState(initial);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load active employees
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);

        const response = await api.get('/users');

        const activeEmployees = (response.data.users || []).filter(
          (user) => user.role === 'employee' && user.isActive
        );

        setUsers(activeEmployees);

      } catch (err) {
        console.error('Failed to load employees:', err.message);
        setError('Unable to load employees. Please try again.');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Load existing task data when editing
  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate
          ? task.dueDate.slice(0, 10)
          : '',
        assignee: task.assignee?._id || task.assignee?.id || ''
      });
    } else {
      setForm(initial);
    }
  }, [task]);

  // Handle input changes
  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  // Submit task
  async function submit(e) {
    e.preventDefault();

    setError('');

    try {
      setSubmitting(true);

      if (task) {
        await api.patch(`/tasks/${task._id}`, form);
      } else {
        await api.post(`/tasks/projects/${projectId}/tasks`, form);
      }

      onSaved();

    } catch (err) {
      setError(err.message || 'Unable to save task.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>

      {error && (
        <div className="alert">
          {error}
        </div>
      )}

      <label>
        Task title

        <input
          required
          name="title"
          value={form.title}
          onChange={change}
          placeholder="e.g. Build sign-in page"
        />
      </label>

      <label>
        Description

        <textarea
          name="description"
          value={form.description}
          onChange={change}
          rows="3"
          placeholder="What needs to be done?"
        />
      </label>

      <div className="form-row">

        <label>
          Priority

          <select
            name="priority"
            value={form.priority}
            onChange={change}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>

        <label>
          Status

          <select
            name="status"
            value={form.status}
            onChange={change}
          >
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>

      </div>

      <div className="form-row">

        <label>
          Due date

          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={change}
          />
        </label>

        <label>
          Assign to

          <select
            name="assignee"
            value={form.assignee}
            onChange={change}
            disabled={loadingUsers}
          >
            <option value="">
              {loadingUsers ? 'Loading employees...' : 'Unassigned'}
            </option>

            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}

          </select>
        </label>

      </div>

      <div className="form-actions">

        <button
          type="button"
          className="btn btn-light"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || loadingUsers}
        >
          {submitting
            ? 'Saving...'
            : task
              ? 'Save changes'
              : 'Create task'}
        </button>

      </div>

    </form>
  );
}
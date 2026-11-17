import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active',
  });

  // Get all projects
  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  // Open form for creating or editing a project
  const openForm = (project = null) => {
    setEditingProject(project);

    if (project) {
      setForm({
        name: project.name,
        description: project.description || '',
        status: project.status,
      });
    } else {
      setForm({
        name: '',
        description: '',
        status: 'active',
      });
    }

    setError('');
    setShowForm(true);
  };

  // Create or update project
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingProject) {
        await api.patch(`/projects/${editingProject._id}`, form);
      } else {
        await api.post('/projects', form);
      }

      setShowForm(false);
      setEditingProject(null);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // Delete project
  const handleDelete = async (project) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${project.name}" and all its tasks?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/projects/${project._id}`);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // Close project form
  const closeForm = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const inputClasses =
    'mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400 sm:text-xs">
            ORGANIZE YOUR WORK
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Projects
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Plan, track, and deliver your team's work.
          </p>
        </div>

        <button
          type="button"
          className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 sm:w-auto"
          onClick={() => openForm()}
        >
          + New project
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Create and edit project form */}
      {showForm && (
        <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              {editingProject ? 'Edit project' : 'Create a project'}
            </h2>

            <button
              type="button"
              aria-label="Close project form"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={closeForm}
            >
              ✕
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Project name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Website redesign"
                className={inputClasses}
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                placeholder="What is this project about?"
                className={`${inputClasses} resize-y`}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
              >
                {editingProject ? 'Save changes' : 'Create project'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Display all projects */}
      {projects.length > 0 && (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {projects.map((project, index) => (
            <article
              className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              key={project._id}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-semibold ${
                    [
                      'bg-violet-50 text-violet-600',
                      'bg-sky-50 text-sky-600',
                      'bg-emerald-50 text-emerald-600',
                      'bg-orange-50 text-orange-600',
                    ][index % 4]
                  }`}
                >
                  ▣
                </span>

                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                    project.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : project.status === 'completed'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <Link
                className="mt-4 break-words text-base font-semibold text-slate-900 transition hover:text-indigo-600"
                to={`/projects/${project._id}`}
              >
                {project.name}
              </Link>

              <p className="mt-2 min-h-12 break-words text-sm leading-6 text-slate-500">
                {project.description || 'No description added yet.'}
              </p>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-400">
                  Updated{' '}
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                    onClick={() => openForm(project)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="text-sm font-semibold text-red-500 transition hover:text-red-700"
                    onClick={() => handleDelete(project)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Show message when there are no projects */}
      {projects.length === 0 && !showForm && !error && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mx-auto flex max-w-md flex-col items-center py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
              ▣
            </span>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Your projects start here
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a project to organize tasks, deadlines, and team
              assignments.
            </p>

            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
              onClick={() => openForm()}
            >
              Create your first project
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Projects;

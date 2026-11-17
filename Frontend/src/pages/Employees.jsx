import { useEffect, useState } from 'react';
import api from '../api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/users');
      setEmployees(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load employees.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response = await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });

      setForm({
        name: '',
        email: '',
      });

      setSuccess(
        response.data?.message ||
          'Invitation sent successfully. The employee can join using the email invitation.'
      );
      setShowForm(false);
      await loadEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to send employee invitation.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (employee) => {
    const newStatus = !employee.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus ? 'activate' : 'suspend'} ${employee.name}?`
    );

    if (!confirmed) return;

    try {
      setError('');

      await api.patch(`/users/${employee._id}/status`, {
        isActive: newStatus,
      });

      await loadEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to update employee status.'
      );
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const searchText = search.toLowerCase();

    return (
      employee.name?.toLowerCase().includes(searchText) ||
      employee.email?.toLowerCase().includes(searchText)
    );
  });

  const inputClasses =
    'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 sm:space-y-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 sm:text-xs">
            TEAM MANAGEMENT
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Employees
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage your organization's employees.
          </p>
        </div>

        <button
          type="button"
          className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 sm:w-auto"
          onClick={() => {
            setShowForm((current) => !current);
            setError('');
            setSuccess('');
          }}
        >
          {showForm ? 'Cancel' : '+ Add Employee'}
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

      {success && (
        <div
          role="status"
          className="break-words rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      {/* Add employee invitation form */}
      {showForm && (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Invite New Employee
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Send an invitation link to the employee's email. They will verify
              their email and create their own password.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="employee-name"
                className="block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>
              <input
                id="employee-name"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Enter employee name"
                className={`${inputClasses} mt-2`}
                required
              />
            </div>

            <div>
              <label
                htmlFor="employee-email"
                className="block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>
              <input
                id="employee-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="Enter employee email"
                className={`${inputClasses} mt-2`}
                required
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={submitting}
              >
                {submitting ? 'Sending Invitation...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Employee directory */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              Employee Directory
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {employees.length} employees in your organization
            </p>
          </div>

          <span className="w-fit rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600">
            {filteredEmployees.length} shown
          </span>
        </div>

        <div className="border-b border-slate-100 p-4 sm:p-5">
          <label htmlFor="employee-search" className="sr-only">
            Search employees by name or email
          </label>
          <input
            id="employee-search"
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClasses}
          />
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">
            Loading employees...
          </div>
        ) : filteredEmployees.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-bold tracking-wider text-slate-400">
                    <th className="px-5 py-4">EMPLOYEE</th>
                    <th className="px-5 py-4">EMAIL</th>
                    <th className="px-5 py-4">STATUS</th>
                    <th className="px-5 py-4">ACTION</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} className="text-sm">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {employee.name}
                      </td>

                      <td className="break-all px-5 py-4 text-slate-500">
                        {employee.email}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            employee.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {employee.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          className={`text-sm font-semibold transition ${
                            employee.isActive
                              ? 'text-red-500 hover:text-red-700'
                              : 'text-indigo-600 hover:text-indigo-800'
                          }`}
                          onClick={() => handleStatusChange(employee)}
                        >
                          {employee.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile employee cards */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:hidden">
              {filteredEmployees.map((employee) => (
                <article
                  key={employee._id}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-base font-bold text-violet-600">
                      {employee.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-bold text-slate-900">
                        {employee.name}
                      </h3>
                      <p className="mt-1 break-all text-xs leading-5 text-slate-500">
                        {employee.email}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                        employee.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {employee.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        employee.isActive
                          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      onClick={() => handleStatusChange(employee)}
                    >
                      {employee.isActive ? 'Suspend Employee' : 'Activate Employee'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-400">
             ⌕
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              No employees found.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try another name or email address.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Employees;

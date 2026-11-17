import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import teamOrbitLogo from '../assets/teamorbit-icon.png';

export default function Layout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      navigate('/login');
    }
  }

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: '▦', end: true },
    { to: '/projects', label: 'Projects', icon: '▣' },
    { to: '/tasks', label: 'Tasks', icon: '☷' },
    ...(user?.role === 'admin'
      ? [
          { to: '/employees', label: 'Employees', icon: '♙' },
          { to: '/activity-logs', label: 'Activity Logs', icon: '◷' },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#20243a]">

      {/* Sidebar */}
      <aside className="
        relative z-20 flex w-full flex-col border-b border-[#eceef5] bg-white
        md:fixed md:inset-y-0 md:left-0 md:w-[248px] md:border-b-0 md:border-r
        md:px-[17px] md:py-7
      ">

        {/* TeamOrbit Brand */}
        <div className="flex items-center gap-2 px-5 py-4 md:px-[5px] md:pb-[42px] md:pt-0">

          <img
            src={teamOrbitLogo}
            alt="TeamOrbit Logo"
            className="h-11 w-11 shrink-0 object-contain"
          />

          <span className="font-['Manrope'] text-[19px] font-extrabold tracking-tight">
            TeamOrbit
            <small className="mt-0.5 block text-[9px] font-bold tracking-[1.6px] text-[#a0a5b7]">
              WORKSPACE
            </small>
          </span>

        </div>

        {/* Navigation */}
        <div className="hidden px-3 pb-3 text-[10px] font-bold tracking-[1.6px] text-[#a0a5b7] md:block">
          WORKSPACE
        </div>

        <nav className="
          flex items-center gap-1 overflow-x-auto px-3 pb-3
          md:flex-col md:items-stretch md:overflow-visible md:px-0 md:pb-0
        ">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to}
              className={({ isActive }) => `
                flex shrink-0 items-center gap-3 rounded-[10px]
                px-3 py-2.5 text-[12px] font-semibold transition-colors
                ${isActive
                  ? 'bg-[#f0efff] text-[#6858df]'
                  : 'text-[#747b92] hover:bg-[#f0efff] hover:text-[#6858df]'
                }
              `}
            >
              <span className="w-5 shrink-0 text-center text-lg">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar User */}
        <div className="
          mt-auto hidden items-center gap-2 border-t border-[#eceef5]
          px-1 pt-[18px] md:flex
        ">
          <div className="
            grid h-[35px] w-[35px] shrink-0 place-items-center
            rounded-full bg-[#e8e4ff] font-bold text-[#6858df]
          ">
            {user?.name?.[0]?.toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <strong className="block truncate text-xs">
              {user?.name}
            </strong>
            <small className="mt-1 block truncate text-[10px] text-[#858ba1]">
              {user?.email}
            </small>
          </div>

          <button
            className="rounded-lg p-2 text-[#81879b] transition hover:bg-[#f2f3f8]"
            title="Log out"
            onClick={logout}
          >
            ↗
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen min-w-0 md:ml-[248px]">

        {/* Topbar */}
        <header className="
          flex h-[60px] items-center justify-between gap-3
          border-b border-[#eceef5] bg-white px-4
          text-xs text-[#737990]
          sm:px-6 md:h-[68px] md:px-[38px]
        ">
          <div className="min-w-0 truncate">
            <span className="text-[#a2a6b5]">Workspace</span>
            <span className="px-2 text-[#c6c8d2]">/</span>
            <span>My workspace</span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <NotificationBell />

            <span className="h-[7px] w-[7px] rounded-full bg-[#39bd8b]" />

            <span className="hidden max-w-[130px] truncate sm:inline">
              {user?.name}
            </span>

            {/* Mobile Logout */}
            <button
              className="rounded-lg px-2 py-1 text-[#81879b] hover:bg-[#f2f3f8] md:hidden"
              title="Log out"
              onClick={logout}
            >
              ↗
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="
          mx-auto w-full max-w-[1500px] min-w-0
          px-4 py-6 sm:px-6 sm:py-7
          lg:px-[38px] lg:pb-[55px] lg:pt-[34px]
        ">
          <Outlet />
        </div>

      </main>
    </div>
  );
}
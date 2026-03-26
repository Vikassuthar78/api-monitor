import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/tester', label: 'API Tester', icon: '🧪' },
  { to: '/logs', label: 'Logs', icon: '📋' },
  { to: '/compare', label: 'Compare', icon: '⚖️' },
  { to: '/scheduler', label: 'Scheduler', icon: '⏰' },
  { to: '/alerts', label: 'Alerts', icon: '🔔' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className="w-60 h-screen flex flex-col border-r border-dark-600 bg-dark-800/80 backdrop-blur-md shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-dark-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-600/30">
            A
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">API Monitor</div>
            <div className="text-xs text-gray-500 mt-0.5">Testing & Analytics</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 pb-4 border-t border-dark-600 pt-3">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <span>🚪</span><span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

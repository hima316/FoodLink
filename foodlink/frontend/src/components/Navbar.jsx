import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Leaf, LayoutDashboard, Package, ClipboardList, ArrowLeftRight, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const donorLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/add-food', icon: <PlusCircle size={16} />, label: 'Add Food' },
    { to: '/my-listings', icon: <Package size={16} />, label: 'My Listings' },
    { to: '/transactions', icon: <ArrowLeftRight size={16} />, label: 'Transactions' },
  ];

  const ngoLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/browse', icon: <Package size={16} />, label: 'Browse Food' },
    { to: '/my-requests', icon: <ClipboardList size={16} />, label: 'My Requests' },
    { to: '/transactions', icon: <ArrowLeftRight size={16} />, label: 'Transactions' },
  ];

  const links = user?.role === 'donor' ? donorLinks : ngoLinks;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Leaf size={18} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-brand-800">FoodLink</span>
              <div className="text-[10px] text-gray-400 font-body leading-none -mt-0.5">Redistribution System</div>
            </div>
          </Link>

          {/* Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* User info + logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                <div className={`text-xs capitalize font-medium ${user.role === 'donor' ? 'text-brand-600' : 'text-blue-600'}`}>
                  {user.role}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        {user && (
          <div className="md:hidden pb-3 flex gap-1 overflow-x-auto">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive(link.to)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Home, 
  Calendar, 
  Bot, 
  Timer, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  Clock,
  LayoutGrid,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { name: 'Schedule', path: '/timetable', icon: Calendar },
    { name: 'AI Planner', path: '/ai-assistant', icon: Bot },
    { name: 'Focus Timer', path: '/focus', icon: Timer },
    { name: 'Analytics', path: '/stats', icon: LayoutGrid },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-black/20 backdrop-blur-md border-r border-white/5 z-50 p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-accent-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/10 border border-primary-500/20">
            <Clock size={20} />
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-white">Time<span className="text-primary-400">Mint</span></span>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 transition-colors",
                  isActive 
                    ? "bg-white/5 border border-white/5 text-primary-400" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <ItemIcon size={18} className={cn(isActive && "text-primary-400")} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-white/5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="text-sm font-medium">Appearance</span>
          </button>
          
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass-dark rounded-3xl z-50 px-2 py-3 flex justify-around items-center border border-white/10">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              location.pathname === item.path ? "text-primary-400" : "text-slate-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-black/40 backdrop-blur-xl border-b border-white/10 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-accent-500 rounded-lg flex items-center justify-center text-white">
            <Clock size={16} />
          </div>
          <span className="text-lg font-display font-bold text-white">TimeMint</span>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="p-2 text-red-400"
        >
          <LogOut size={20} />
        </button>
      </div>
    </>
  );
};

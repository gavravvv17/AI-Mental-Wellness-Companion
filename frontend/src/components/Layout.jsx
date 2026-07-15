import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Smile, BarChart3, BookOpen, TreePine,
  Wind, Users, MessageCircleHeart, LogOut, Menu, X, Sprout
} from 'lucide-react';

const navItems = [
  { id: 'dashboard',   label: 'Home',         icon: LayoutDashboard, color: '#8b5cf6', bg: '#f5f0ff' },
  { id: 'mood',        label: 'Mood Log',      icon: Smile,           color: '#f56e0f', bg: '#fff9f6' },
  { id: 'analytics',  label: 'Insights',      icon: BarChart3,       color: '#0ea5e9', bg: '#f0f8ff' },
  { id: 'journal',    label: 'Journal',       icon: BookOpen,        color: '#d97706', bg: '#fffef0' },
  { id: 'timeline',   label: 'Life Timeline', icon: TreePine,        color: '#4caf50', bg: '#f0faf0' },
  { id: 'mindfulness',label: 'Mindfulness',   icon: Wind,            color: '#0ea5e9', bg: '#f0f8ff' },
  { id: 'circle',     label: 'My Circle',     icon: Users,           color: '#ec4899', bg: '#fff5f5' },
  { id: 'chatbot',    label: 'AI Buddy',      icon: MessageCircleHeart, color: '#8b5cf6', bg: '#f5f0ff' },
];

const Layout = ({ children, currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({ item, onClick }) => {
    const Icon = item.icon;
    const active = currentTab === item.id;
    return (
      <button
        onClick={() => { setCurrentTab(item.id); onClick?.(); }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-left"
        style={active ? {
          background: item.bg,
          color: item.color,
          boxShadow: `0 2px 10px ${item.color}18`,
        } : {}}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={active
            ? { background: item.color, boxShadow: `0 3px 10px ${item.color}40` }
            : { background: '#F7F9FC' }
          }
        >
          <Icon className="w-4.5 h-4.5" style={{ color: active ? '#fff' : item.color }} />
        </div>
        <span className={`text-sm font-semibold transition-colors ${active ? '' : 'text-ink-400 group-hover:text-ink-800'}`}
          style={active ? { color: item.color } : {}}>
          {item.label}
        </span>
        {active && (
          <div className="ml-auto w-2 h-2 rounded-full" style={{ background: item.color }} />
        )}
      </button>
    );
  };

  const SidebarContent = ({ onLinkClick }) => (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-ink-800 leading-none">MindMate</h1>
          <p className="text-[10px] text-ink-300 font-medium mt-0.5">Wellness Companion</p>
        </div>
      </div>

      {/* Nav */}
      <div className="space-y-1 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-300 px-4 mb-2">Menu</p>
        {navItems.map(item => (
          <NavLink key={item.id} item={item} onClick={onLinkClick} />
        ))}
      </div>

      {/* User Card */}
      <div className="mt-4 pt-4 border-t border-warm-100">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-800 truncate">{user?.fullName || 'Friend'}</p>
            <p className="text-[10px] text-ink-300 truncate">@{user?.username}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#FAFAF7' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 sidebar z-20">
        <SidebarContent />
      </aside>

      {/* Mobile: Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3.5 bg-white border-b border-warm-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-ink-800">MindMate</span>
        </div>
        <button onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-warm-50 border border-warm-200 text-ink-400">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full bg-white shadow-2xl animate-scale-in">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-warm-50 border border-warm-200 text-ink-400">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onLinkClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-warm-100 px-2 py-2 flex items-center justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button key={item.id} onClick={() => setCurrentTab(item.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all"
              style={active ? { background: item.bg } : {}}>
              <Icon className="w-5 h-5" style={{ color: active ? item.color : '#9ca3af' }} />
              <span className="text-[9px] font-semibold"
                style={{ color: active ? item.color : '#9ca3af' }}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-[62px] lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

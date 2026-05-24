import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gift,
  RefreshCw,
  Wallet,
  BarChart3,
  Settings,
  Scale,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

const navItems = [
  { id: 'odds', label: 'Low Hold', icon: Scale },
  { id: 'arbitrage', label: 'Arbitrage', icon: CircleDollarSign },
  { id: 'promo', label: 'Promotions', icon: Gift },
  { id: 'rollover', label: 'Rollover', icon: RefreshCw },
  { id: 'deposits', label: 'Deposits', icon: Wallet },
  { id: 'bets', label: 'Bet Tracker', icon: BarChart3 },
];

export function Sidebar({ activeTab, onTabChange, onCollapseChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, isLocalMock, isAuthenticated } = useAuth();

  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-neutral-950 border-r border-neutral-800 z-50 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="relative flex items-center border-b border-neutral-800 px-3 py-3">
        <button
          onClick={() => onTabChange('odds')}
          className={`flex items-center min-w-0 ${collapsed ? 'mx-auto' : 'w-full pr-4'}`}
        >
          <img
            src="/lgm-tracker-logo.png?v=2"
            alt="LGM Tracker"
            className={`object-contain ${collapsed ? 'h-8 w-8' : 'w-full h-auto'}`}
          />
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-neutral-700 flex items-center justify-center bg-neutral-950 hover:bg-neutral-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-2.5 h-2.5 text-neutral-400" />
          ) : (
            <ChevronLeft className="w-2.5 h-2.5 text-neutral-400" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-neutral-800 space-y-1">
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            activeTab === 'settings'
              ? 'bg-cyan-500/10 text-cyan-400'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </button>
        {isAuthenticated && !isLocalMock && (
          <button
            type="button"
            onClick={() => void signOut()}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-neutral-400 hover:text-white hover:bg-neutral-900 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Sign out</span>}
          </button>
        )}
      </div>

    </aside>
  );
}

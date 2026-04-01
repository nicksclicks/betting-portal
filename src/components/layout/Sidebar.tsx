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
} from 'lucide-react';

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

  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-neutral-950 border-r border-neutral-800 z-50 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="relative flex items-center p-4 border-b border-neutral-800">
        <button
          onClick={() => onTabChange('odds')}
          className={`flex items-center gap-3 ${collapsed ? 'mx-auto' : ''}`}
        >
          <div className="w-8 h-8 rounded border border-neutral-700 flex items-center justify-center bg-black">
            <span className="text-white font-serif text-lg font-bold">N</span>
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-lg tracking-tight">Nick's Bets</span>
          )}
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

      <div className="p-2 border-t border-neutral-800">
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
      </div>

    </aside>
  );
}

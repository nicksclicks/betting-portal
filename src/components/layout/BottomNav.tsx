import {
  CircleDollarSign,
  Gift,
  RefreshCw,
  Wallet,
  BarChart3,
  Settings,
  Scale,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'odds', label: 'Low Hold', icon: Scale },
  { id: 'arbitrage', label: 'Arb', icon: CircleDollarSign },
  { id: 'promo', label: 'Promo', icon: Gift },
  { id: 'rollover', label: 'Rollover', icon: RefreshCw },
  { id: 'deposits', label: 'Deposits', icon: Wallet },
  { id: 'bets', label: 'Bets', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-800 z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[44px] py-1.5 px-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-neutral-500 active:text-neutral-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-cyan-400' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

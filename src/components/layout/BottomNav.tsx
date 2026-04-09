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
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 z-50 md:hidden safe-area-bottom">
      <div
        className="flex items-stretch gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-none snap-x snap-mandatory touch-pan-x"
        style={{ paddingLeft: 'max(0.5rem, env(safe-area-inset-left))', paddingRight: 'max(0.5rem, env(safe-area-inset-right))' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center shrink-0 snap-center min-w-[3rem] flex-1 basis-0 py-2 px-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-neutral-500 active:text-neutral-300 active:bg-neutral-900'
              }`}
            >
              <Icon className={`w-[1.125rem] h-[1.125rem] sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span
                className={`text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 font-medium leading-tight text-center px-0.5 ${isActive ? 'text-cyan-400' : ''}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

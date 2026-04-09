import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { OddsBoard } from './components/odds/OddsBoard';
import { ArbitrageCalculator } from './components/calculators/ArbitrageCalculator';
import { PromoConverter } from './components/calculators/PromoConverter';
import { RolloverCalculator } from './components/calculators/RolloverCalculator';
import { DepositTracker } from './components/deposits/DepositTracker';
import { BetTracker } from './components/bets/BetTracker';
import { SettingsPage } from './components/settings/SettingsPage';
import { Sportsbook } from './constants/sportsbooks';

interface CalculatorPrefill {
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsB: number;
  bookA: Sportsbook;
  bookB: Sportsbook;
}

function App() {
  const [activeTab, setActiveTab] = useState('odds');
  const [calculatorPrefill, setCalculatorPrefill] = useState<CalculatorPrefill | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOddsClick = (data: CalculatorPrefill) => {
    setCalculatorPrefill(data);
    setActiveTab('arbitrage');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'odds':
        return <OddsBoard onOddsClick={handleOddsClick} />;
      case 'arbitrage':
        return <ArbitrageCalculator prefillData={calculatorPrefill} />;
      case 'promo':
        return <PromoConverter />;
      case 'rollover':
        return <RolloverCalculator />;
      case 'deposits':
        return <DepositTracker />;
      case 'bets':
        return <BetTracker />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OddsBoard onOddsClick={handleOddsClick} />;
    }
  };

  const contentMargin = isMobile ? '0px' : (sidebarCollapsed ? '64px' : '224px');

  return (
    <div className="min-h-screen bg-black">
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCollapseChange={setSidebarCollapsed}
        />
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: contentMargin }}
      >
        <main className="min-h-[100dvh] min-h-screen pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 md:min-h-screen">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

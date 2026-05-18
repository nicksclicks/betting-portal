import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { useBrowserPath } from './hooks/useBrowserPath';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { OddsBoard } from './components/odds/OddsBoard';
import { ArbitrageCalculator } from './components/calculators/ArbitrageCalculator';
import { PromoConverter } from './components/calculators/PromoConverter';
import { RolloverCalculator } from './components/calculators/RolloverCalculator';
import { DepositTracker } from './components/deposits/DepositTracker';
import { BetTracker } from './components/bets/BetTracker';
import { SettingsPage } from './components/settings/SettingsPage';
import { LegalDisclaimer } from './components/legal/LegalDisclaimer';
import { Sportsbook } from './constants/sportsbooks';

interface CalculatorPrefill {
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsB: number;
  bookA: Sportsbook;
  bookB: Sportsbook;
}

function ProfileMissingScreen() {
  const { refreshProfile, signOut, loading } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await refreshProfile();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-black">
      <div className="card max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-semibold text-white">Finish setting up your account</h1>
        <p className="text-neutral-400 text-sm">
          You are signed in, but your profile row is not ready yet. Try again in a moment, or sign out and contact an
          admin.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={() => void retry()}
            disabled={retrying || loading}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            {(retrying || loading) && <Loader2 className="w-4 h-4 animate-spin" />}
            Retry
          </button>
          <button type="button" onClick={() => void signOut()} className="btn-secondary">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function BettingPortalShell() {
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

  const contentMargin = isMobile ? '0px' : sidebarCollapsed ? '64px' : '224px';

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
            <div className="mt-10 pt-6 border-t border-neutral-900">
              <LegalDisclaimer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { loading, isAuthenticated, profile, isLocalMock } = useAuth();
  const { pathname, navigate } = useBrowserPath();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-neutral-500" aria-label="Loading" />
      </div>
    );
  }

  if (pathname === '/reset-password') {
    return <ResetPasswordPage onNavigate={navigate} />;
  }

  if (!isAuthenticated) {
    if (pathname === '/forgot-password') {
      return <ForgotPasswordPage onNavigate={navigate} />;
    }
    return <LoginPage onNavigate={navigate} />;
  }

  if (!profile && !isLocalMock) {
    return <ProfileMissingScreen />;
  }

  return <BettingPortalShell />;
}

export default App;

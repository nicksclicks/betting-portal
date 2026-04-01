import { useState, useEffect } from 'react';
import { Target, BarChart2, TrendingUp, Download, Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Bet } from '../../types/database';
import { AddBetModal } from './AddBetModal';
import { formatCurrency } from '../../utils/odds';

type BetStatus = 'all' | 'pending' | 'won' | 'lost';

export function BetTracker() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BetStatus>('all');

  const fetchBets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBets();
  }, []);

  const updateBetStatus = async (id: string, status: Bet['status']) => {
    const { error } = await supabase
      .from('bets')
      .update({ status, settled_at: status !== 'pending' ? new Date().toISOString() : null })
      .eq('id', id);

    if (!error) {
      fetchBets();
    }
  };

  const deleteBet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bet?')) {
      return;
    }
    const { error } = await supabase.from('bets').delete().eq('id', id);
    if (!error) {
      fetchBets();
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Bet Name',
      'Sportsbook',
      'Odds',
      'Amount Staked',
      'Bonus Bet',
      'Odds Boost',
      'Status',
      'Created At',
    ];

    const rows = bets.map((b) => [
      b.bet_name,
      b.sportsbook,
      b.odds.toString(),
      b.amount_staked.toString(),
      b.is_bonus_bet ? 'Yes' : 'No',
      b.is_odds_boost ? 'Yes' : 'No',
      b.status,
      new Date(b.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBets = statusFilter === 'all'
    ? bets
    : bets.filter((bet) => bet.status === statusFilter);

  const groupedBets = filteredBets.reduce((acc, bet) => {
    const key = bet.group_id || bet.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(bet);
    return acc;
  }, {} as Record<string, Bet[]>);

  const stats = {
    total: bets.length,
    pending: bets.filter((b) => b.status === 'pending').length,
    won: bets.filter((b) => b.status === 'won').length,
    totalStaked: bets.reduce((sum, b) => sum + b.amount_staked, 0),
  };

  const getStatusClass = (status: Bet['status']) => {
    switch (status) {
      case 'won':
        return 'status-active';
      case 'lost':
        return 'status-withdrawn';
      default:
        return 'status-completed';
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Bet Tracker</h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Track all your bets in one place. Monitor performance and manage your bankroll.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Track Bets</h3>
          <p className="text-neutral-500 text-sm">Monitor all your active wagers</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <BarChart2 className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Performance Stats</h3>
          <p className="text-neutral-500 text-sm">See your win/loss record</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Bankroll Overview</h3>
          <p className="text-neutral-500 text-sm">Track total amount staked</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
        <div className="p-4 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-xs md:text-sm mb-1">Total</p>
          <p className="text-xl md:text-2xl font-bold text-white font-mono">{stats.total}</p>
        </div>
        <div className="p-4 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-xs md:text-sm mb-1">Pending</p>
          <p className="text-xl md:text-2xl font-bold text-amber-400 font-mono">{stats.pending}</p>
        </div>
        <div className="p-4 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-xs md:text-sm mb-1">Won</p>
          <p className="text-xl md:text-2xl font-bold text-lime-400 font-mono">{stats.won}</p>
        </div>
        <div className="p-4 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-xs md:text-sm mb-1">Staked</p>
          <p className="text-xl md:text-2xl font-bold text-blue-400 font-mono">{formatCurrency(stats.totalStaked)}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-4">
            <p className="text-neutral-500 text-xs md:text-sm">
              {filteredBets.length} bet{filteredBets.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-0.5 md:gap-1">
              {(['all', 'pending', 'won', 'lost'] as BetStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs rounded-lg transition-colors capitalize ${
                    statusFilter === status
                      ? 'bg-cyan-500 text-black font-medium'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="btn-secondary text-xs md:text-sm flex items-center gap-2">
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Export</span> CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-xs md:text-sm flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-xs md:text-sm font-medium text-neutral-500">Bet Name</th>
                  <th className="text-left py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">Book</th>
                  <th className="text-right py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">Odds</th>
                  <th className="text-right py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">Staked</th>
                  <th className="text-left py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">Date</th>
                  <th className="text-center py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">Status</th>
                  <th className="text-right py-3 md:py-4 px-3 md:px-4 text-xs md:text-sm font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-neutral-500">
                      Loading...
                    </td>
                  </tr>
                ) : Object.keys(groupedBets).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-neutral-500">
                      No bets yet. Click "Add Bet" to get started.
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedBets).map(([groupId, groupBets]) =>
                    groupBets.map((bet, idx) => (
                      <tr
                        key={bet.id}
                        className={`border-b border-neutral-800/50 hover:bg-neutral-900/50 transition-colors ${
                          groupBets.length > 1 && idx === 0 ? 'border-l-2 border-l-cyan-500' : ''
                        } ${groupBets.length > 1 && idx > 0 ? 'border-l-2 border-l-cyan-500/50' : ''}`}
                      >
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <div className="flex items-center gap-1 md:gap-2">
                            <span className="font-medium text-white text-xs md:text-sm truncate max-w-[100px] md:max-w-none">{bet.bet_name}</span>
                            {bet.is_bonus_bet && (
                              <span className="px-1 md:px-1.5 py-0.5 text-[8px] md:text-[10px] bg-amber-500/20 text-amber-400 rounded">
                                B
                              </span>
                            )}
                            {bet.is_odds_boost && (
                              <span className="px-1 md:px-1.5 py-0.5 text-[8px] md:text-[10px] bg-lime-500/20 text-lime-400 rounded">
                                +
                              </span>
                            )}
                          </div>
                          {groupBets.length > 1 && idx === 0 && (
                            <div className="text-[8px] md:text-[10px] text-cyan-400 mt-0.5">Grouped</div>
                          )}
                        </td>
                        <td className="py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm text-neutral-400">{bet.sportsbook}</td>
                        <td className="py-3 md:py-4 px-2 md:px-4 text-right font-mono text-white text-xs md:text-sm">
                          {formatOdds(bet.odds)}
                        </td>
                        <td className="py-3 md:py-4 px-2 md:px-4 text-right font-mono text-white text-xs md:text-sm">
                          {formatCurrency(bet.amount_staked)}
                        </td>
                        <td className="py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm text-neutral-500">
                          {formatDate(bet.created_at)}
                        </td>
                        <td className="py-3 md:py-4 px-2 md:px-4 text-center">
                          <span className={`${getStatusClass(bet.status)} text-[10px] md:text-xs`}>{bet.status}</span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <div className="flex justify-end gap-0.5 md:gap-1">
                            {bet.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateBetStatus(bet.id, 'won')}
                                  className="p-1 md:p-1.5 text-neutral-500 hover:text-lime-400 hover:bg-lime-500/10 rounded transition-colors"
                                  title="Mark as Won"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <button
                                  onClick={() => updateBetStatus(bet.id, 'lost')}
                                  className="p-1 md:p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Mark as Lost"
                                >
                                  <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteBet(bet.id)}
                              className="p-1 md:p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddBetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBets}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Wallet, PiggyBank, TrendingUp, Download, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Deposit, DepositInsert, DepositUpdate } from '../../types/database';
import { SportsbookSelect } from '../shared/SportsbookSelect';
import { formatCurrency } from '../../utils/odds';
import { DEPOSIT_STATUSES, DepositStatus } from '../../constants/sportsbooks';

export function DepositTracker() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DepositInsert>>({
    sportsbook: '',
    deposit_amount: 0,
    deposit_date: new Date().toISOString().split('T')[0],
    bonus_received: 0,
    rollover_multiplier: 1,
    current_balance: 0,
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .order('deposit_date', { ascending: false });

    if (error) {
      console.error('Error fetching deposits:', error);
    } else {
      setDeposits(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sportsbook || !formData.deposit_amount) {
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('deposits')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        } as DepositUpdate)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating deposit:', error);
      }
    } else {
      const { error } = await supabase
        .from('deposits')
        .insert([formData as DepositInsert]);

      if (error) {
        console.error('Error creating deposit:', error);
      }
    }

    resetForm();
    fetchDeposits();
  };

  const handleEdit = (deposit: Deposit) => {
    setFormData({
      sportsbook: deposit.sportsbook,
      deposit_amount: deposit.deposit_amount,
      deposit_date: deposit.deposit_date,
      bonus_received: deposit.bonus_received,
      rollover_multiplier: deposit.rollover_multiplier,
      current_balance: deposit.current_balance,
      status: deposit.status,
      notes: deposit.notes || '',
    });
    setEditingId(deposit.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deposit?')) {
      return;
    }

    const { error } = await supabase.from('deposits').delete().eq('id', id);

    if (error) {
      console.error('Error deleting deposit:', error);
    } else {
      fetchDeposits();
    }
  };

  const resetForm = () => {
    setFormData({
      sportsbook: '',
      deposit_amount: 0,
      deposit_date: new Date().toISOString().split('T')[0],
      bonus_received: 0,
      rollover_multiplier: 1,
      current_balance: 0,
      status: 'active',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const exportToCSV = () => {
    const headers = [
      'Sportsbook',
      'Deposit Amount',
      'Deposit Date',
      'Bonus Received',
      'Rollover',
      'Current Balance',
      'Status',
      'Notes',
    ];

    const rows = deposits.map((d) => [
      d.sportsbook,
      d.deposit_amount.toString(),
      d.deposit_date,
      d.bonus_received.toString(),
      `${d.rollover_multiplier}x`,
      d.current_balance.toString(),
      d.status,
      d.notes || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposits-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusClass = (status: DepositStatus) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'withdrawn':
        return 'status-withdrawn';
      default:
        return '';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalDeposited = deposits.reduce((sum, d) => sum + d.deposit_amount, 0);
  const totalBonus = deposits.reduce((sum, d) => sum + d.bonus_received, 0);
  const totalBalance = deposits.reduce((sum, d) => sum + d.current_balance, 0);

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Deposit Tracker</h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Track all your sportsbook deposits, bonuses, and current balances in one place.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Track Deposits</h3>
          <p className="text-neutral-500 text-sm">Monitor all your sportsbook funds</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <PiggyBank className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Bonus Tracking</h3>
          <p className="text-neutral-500 text-sm">Keep track of bonus amounts</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Balance Overview</h3>
          <p className="text-neutral-500 text-sm">See your total across all books</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
        <div className="p-3 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-xs md:text-sm mb-1">Deposited</p>
          <p className="text-lg md:text-2xl font-bold text-white font-mono">
            {formatCurrency(totalDeposited)}
          </p>
        </div>
        <div className="p-3 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-xs md:text-sm mb-1">Bonus</p>
          <p className="text-lg md:text-2xl font-bold text-lime-400 font-mono">
            {formatCurrency(totalBonus)}
          </p>
        </div>
        <div className="p-3 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <p className="text-neutral-500 text-xs md:text-sm mb-1">Balance</p>
          <p className="text-lg md:text-2xl font-bold text-blue-400 font-mono">
            {formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <p className="text-neutral-500 text-xs md:text-sm">
            {deposits.length} deposit{deposits.length !== 1 ? 's' : ''} tracked
          </p>
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="btn-secondary text-xs md:text-sm flex items-center gap-2">
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Export</span> CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-xs md:text-sm flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Add
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Deposit' : 'Add New Deposit'}
              </h3>
              <button onClick={resetForm} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SportsbookSelect
                  label="Sportsbook"
                  value={formData.sportsbook || ''}
                  onChange={(v) => setFormData((prev) => ({ ...prev, sportsbook: v }))}
                  id="deposit-sportsbook"
                />

                <div>
                  <label className="label">Deposit Amount</label>
                  <input
                    type="number"
                    value={formData.deposit_amount || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deposit_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="input-field font-mono"
                    placeholder="100"
                    required
                  />
                </div>

                <div>
                  <label className="label">Deposit Date</label>
                  <input
                    type="date"
                    value={formData.deposit_date || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, deposit_date: e.target.value }))
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Bonus Received</label>
                  <input
                    type="number"
                    value={formData.bonus_received || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bonus_received: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="input-field font-mono"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="label">Rollover Multiplier</label>
                  <input
                    type="number"
                    value={formData.rollover_multiplier || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rollover_multiplier: parseFloat(e.target.value) || 1,
                      }))
                    }
                    className="input-field font-mono"
                    placeholder="10"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="label">Current Balance</label>
                  <input
                    type="number"
                    value={formData.current_balance || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        current_balance: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="input-field font-mono"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as DepositStatus,
                      }))
                    }
                    className="select-field"
                  >
                    {DEPOSIT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Notes (Optional)</label>
                  <input
                    type="text"
                    value={formData.notes || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="input-field"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Save Changes' : 'Add Deposit'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    Sportsbook
                  </th>
                  <th className="text-right py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    Deposit
                  </th>
                  <th className="text-left py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    Date
                  </th>
                  <th className="text-right py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    Bonus
                  </th>
                  <th className="text-center py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    Roll
                  </th>
                  <th className="text-right py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    Balance
                  </th>
                  <th className="text-center py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    Status
                  </th>
                  <th className="text-right py-3 md:py-4 px-3 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-neutral-500">
                      Loading...
                    </td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-neutral-500">
                      No deposits yet. Click "Add Deposit" to get started.
                    </td>
                  </tr>
                ) : (
                  deposits.map((deposit) => (
                    <tr
                      key={deposit.id}
                      className="border-b border-neutral-800/50 hover:bg-neutral-900/50 transition-colors"
                    >
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <div className="font-medium text-white text-xs md:text-sm">{deposit.sportsbook}</div>
                        {deposit.notes && (
                          <div className="text-[10px] md:text-xs text-neutral-600 truncate max-w-[100px] md:max-w-[150px]">
                            {deposit.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-right font-mono text-white text-xs md:text-sm">
                        {formatCurrency(deposit.deposit_amount)}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm text-neutral-500">
                        {formatDate(deposit.deposit_date)}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-right font-mono text-lime-400 text-xs md:text-sm">
                        {deposit.bonus_received > 0
                          ? formatCurrency(deposit.bonus_received)
                          : '-'}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-center text-xs md:text-sm text-neutral-500">
                        {deposit.rollover_multiplier}x
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-right font-mono text-blue-400 text-xs md:text-sm">
                        {formatCurrency(deposit.current_balance)}
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-center">
                        <span className={`${getStatusClass(deposit.status)} text-[10px] md:text-xs`}>{deposit.status}</span>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <button
                            onClick={() => handleEdit(deposit)}
                            className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(deposit.id)}
                            className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-500/30 rounded-lg transition-colors"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResultCardProps {
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  large?: boolean;
}

export function ResultCard({ label, value, variant = 'default', large = false }: ResultCardProps) {
  const variantStyles = {
    default: 'bg-slate-700/50 text-slate-100',
    success: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20 text-amber-400',
    danger: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className={`rounded-lg p-4 ${variantStyles[variant]}`}>
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</div>
      <div className={`font-mono font-bold ${large ? 'text-2xl' : 'text-lg'}`}>{value}</div>
    </div>
  );
}

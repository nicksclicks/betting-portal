export function parseAmericanOddsInput(value: string): number | null {
  const trimmed = value.trim().replace(/^\+/, '');
  if (!/^-?\d+$/.test(trimmed)) return null;
  const parsed = parseInt(trimmed, 10);
  if (parsed === 0) return null;
  return parsed;
}

export function parsePositiveMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const parsed = parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function parseNonNegativeMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const parsed = parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function parsePositiveDecimalInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const parsed = parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

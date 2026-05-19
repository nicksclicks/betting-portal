export function saveErrorMessage(
  error: { code?: string; message?: string },
  fallback: string
): string {
  if (error.code === '42501' || error.message?.includes('row-level security')) {
    return 'Could not save. Sign in again or contact support if this continues.';
  }
  return fallback;
}

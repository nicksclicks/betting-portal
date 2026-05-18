interface LegalDisclaimerProps {
  className?: string;
}

export function LegalDisclaimer({ className }: LegalDisclaimerProps) {
  return (
    <aside
      className={['text-xs text-neutral-500 leading-relaxed space-y-2', className].filter(Boolean).join(' ')}
      aria-label="Legal disclaimer"
    >
      <p>
        This application is for informational and personal record-keeping only. It does not provide gambling advice,
        picks, or an invitation to wager.
      </p>
      <p>
        Odds and other data may be delayed, incomplete, or incorrect. You are responsible for your own decisions and for
        following the laws where you live. You must meet the legal age to gamble in your jurisdiction.
      </p>
      <p>
        The app is provided as-is, without warranties. We are not liable for any losses or damages from use of this
        service.
      </p>
    </aside>
  );
}

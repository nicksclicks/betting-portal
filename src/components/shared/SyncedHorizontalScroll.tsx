import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SyncedHorizontalScrollProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SyncedHorizontalScroll({
  children,
  className = '',
  bodyClassName = '',
}: SyncedHorizontalScrollProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const updateWidth = () => {
      const content = body.firstElementChild as HTMLElement | null;
      const width = content?.scrollWidth ?? body.scrollWidth;
      setScrollWidth(width);
      setCanScroll(width > body.clientWidth + 1);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(body);
    const content = body.firstElementChild;
    if (content) observer.observe(content);

    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    const top = topRef.current;
    const body = bodyRef.current;
    const bottom = bottomRef.current;
    if (!top || !body || !bottom) return;

    let syncing = false;

    const sync = (source: HTMLDivElement) => {
      if (syncing) return;
      syncing = true;
      const left = source.scrollLeft;
      if (source !== top) top.scrollLeft = left;
      if (source !== body) body.scrollLeft = left;
      if (source !== bottom) bottom.scrollLeft = left;
      syncing = false;
    };

    const onTopScroll = () => sync(top);
    const onBodyScroll = () => sync(body);
    const onBottomScroll = () => sync(bottom);

    top.addEventListener('scroll', onTopScroll, { passive: true });
    body.addEventListener('scroll', onBodyScroll, { passive: true });
    bottom.addEventListener('scroll', onBottomScroll, { passive: true });

    return () => {
      top.removeEventListener('scroll', onTopScroll);
      body.removeEventListener('scroll', onBodyScroll);
      bottom.removeEventListener('scroll', onBottomScroll);
    };
  }, [canScroll]);

  const spacerWidth = scrollWidth > 0 ? scrollWidth : undefined;
  const trackClass =
    'scrollbar-table overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x bg-neutral-950';
  const trackVisibility = canScroll ? '' : 'hidden';

  return (
    <div className={className}>
      <div
        ref={topRef}
        className={`${trackClass} border-b border-neutral-800 ${trackVisibility}`}
      >
        <div style={{ width: spacerWidth }} className="h-3 shrink-0" />
      </div>

      <div
        ref={bodyRef}
        className={`scrollbar-none overflow-x-auto overscroll-x-contain touch-pan-x ${bodyClassName}`}
      >
        {children}
      </div>

      <div
        ref={bottomRef}
        className={`${trackClass} border-t border-neutral-800 ${trackVisibility}`}
      >
        <div style={{ width: spacerWidth }} className="h-3 shrink-0" />
      </div>
    </div>
  );
}

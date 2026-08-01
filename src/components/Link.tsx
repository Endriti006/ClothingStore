import { type ReactNode, type MouseEvent } from 'react';
import { buildHash, navigate, type Route } from '../lib/router';

export function Link({
  route,
  children,
  className = '',
  onClick,
  ariaLabel,
}: {
  route: Route;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const handleClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    navigate(route);
    onClick?.();
  };
  return (
    <a href={buildHash(route)} onClick={handleClick} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

import type { ReactNode } from "react";
import { storeLinks } from "../config";

type StoreButtonProps = {
  storeName: string;
  href: string | null;
  variant?: "dark" | "light";
  icon: ReactNode;
};

function StoreButton({ storeName, href, variant = "light", icon }: StoreButtonProps) {
  const soon = !href;
  const className = `store-btn store-btn--${variant}${soon ? " store-btn--soon" : ""}`;

  const content = (
    <>
      <span className="store-btn__icon" aria-hidden>
        {icon}
      </span>
      <span>{storeName}</span>
      {soon ? <span className="store-btn__badge">בקרוב</span> : null}
    </>
  );

  if (soon) {
    return (
      <button type="button" className={className} disabled>
        {content}
      </button>
    );
  }

  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1-.1 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.1-3.6zM14.9 6.5c.6-.7 1-1.7.9-2.7-0.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.5 3.6v16.8c0 .6.6 1 1.1.7l14.2-8.4c.5-.3.5-1.1 0-1.4L5.6 2.9c-.5-.3-1.1.1-1.1.7z" />
    </svg>
  );
}

export function StoreButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`store-buttons${compact ? " store-buttons--compact" : ""}`}>
      <StoreButton
        storeName="App Store"
        href={storeLinks.appStoreUrl}
        variant="dark"
        icon={<AppleIcon />}
      />
      <StoreButton
        storeName="Google Play"
        href={storeLinks.playStoreUrl}
        variant="light"
        icon={<PlayIcon />}
      />
    </div>
  );
}

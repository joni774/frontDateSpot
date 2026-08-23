import { siteUrl } from "../config";
import { StoreButtons } from "./StoreButtons";

export function Header() {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <a className="topbar__brand" href="/">
          DateSpot
        </a>
        <div className="topbar__actions">
          <StoreButtons compact />
        </div>
        <a className="topbar__site" href={siteUrl} target="_blank" rel="noopener noreferrer">
          datespot.co.il
        </a>
      </div>
    </header>
  );
}

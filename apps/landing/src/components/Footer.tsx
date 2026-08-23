import { siteUrl } from "../config";

export function Footer() {
  const year = new Date().getFullYear();
  const host = siteUrl.replace(/^https?:\/\//, "");

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__brand">DateSpot</p>
        <p className="footer__meta">
          <a href={siteUrl}>{host}</a>
          <span aria-hidden className="footer__dot">
            ·
          </span>
          <span>© {year} DateSpot</span>
        </p>
      </div>
    </footer>
  );
}

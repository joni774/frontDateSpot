import { siteUrl } from "../config";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__media" aria-hidden>
        <img className="hero__image" src="/hero.jpg" alt="" width={2400} height={1600} />
        <div className="hero__scrim" />
      </div>

      <div className="hero__content animate-in">
        <h1 className="hero__brand">DateSpot</h1>
        <p className="hero__headline">אפליקציית הבילויים שלכם</p>
        <p className="hero__support">
          מסעדות, דייטים, שקיעות ובילויים – גלו את המקומות הכי מיוחדים סביבכם, שמרו
          מועדפים, ותכננו את היציאה הבאה במקום אחד.
        </p>
        <a className="btn-primary" href={siteUrl} target="_blank" rel="noopener noreferrer">
          האתר שלנו datespot.co.il
        </a>
      </div>
    </section>
  );
}

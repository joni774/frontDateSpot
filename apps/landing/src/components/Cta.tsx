import { siteUrl } from "../config";
import { StoreButtons } from "./StoreButtons";

export function Cta() {
  return (
    <section className="cta" aria-labelledby="cta-heading">
      <div className="cta__inner reveal">
        <h2 id="cta-heading">מוכנים ליציאה הבאה?</h2>
        <p>
          היכנסו לאתר, גלו בילויים סביבכם, והורידו את האפליקציה כשתהיה זמינה בחנויות.
        </p>
        <div className="cta__actions">
          <a className="btn-outline" href={siteUrl} target="_blank" rel="noopener noreferrer">
            datespot.co.il
          </a>
          <StoreButtons />
        </div>
      </div>
    </section>
  );
}

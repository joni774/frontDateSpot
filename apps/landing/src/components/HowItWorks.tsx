const steps = [
  {
    title: "פותחים את DateSpot",
    body: "בלי הרשמה מסובכת — נכנסים לאתר או לאפליקציה ומתחילים לגלוש מיד.",
  },
  {
    title: "מחפשים בילוי מתאים",
    body: "מסננים לפי מיקום, קטגוריה ומרחק — מסעדות, דייטים רומנטיים, שקיעות ועוד.",
  },
  {
    title: "שומרים מועדפים",
    body: "אוהבים מקום? שומרים אותו לרשימה האישית וחוזרים אליו מתי שרוצים.",
  },
  {
    title: "יוצאים לבלות",
    body: "כל התכנון במקום אחד — מגלים, בוחרים ויוצאים ליציאה הבאה.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="how" aria-labelledby="how-heading">
      <div className="how__intro reveal">
        <h2 id="how-heading">איך זה עובד</h2>
        <p>ארבעה צעדים פשוטים מהרעיון ליציאה בפועל.</p>
      </div>
      <ol className="how__list">
        {steps.map((step, index) => (
          <li key={step.title} className={`how__item reveal reveal--delay-${index + 1}`}>
            <span className="how__number" aria-hidden>
              {index + 1}
            </span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const features = [
  {
    title: "גילוי בילויים לידכם",
    body: "מסעדות, דייטים רומנטיים, סושי, שקיעות ועוד — לפי מיקום, קטגוריה ומרחק.",
    icon: "explore",
  },
  {
    title: "מפה והמלצות",
    body: "ראו על המפה מה קרוב אליכם, קבלו המלצות חכמות, ותמצאו בדיוק את האווירה שחיפשתם.",
    icon: "map",
  },
  {
    title: "שמירת מקומות",
    body: "שמרו את המקומות שאהבתם וחזרו אליהם מתי שתרצו — לדייט, לבילוי או ליציאה ספונטנית.",
    icon: "favorite",
  },
] as const;

function FeatureIcon({ name }: { name: (typeof features)[number]["icon"] }) {
  if (name === "explore") {
    return (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.5 6.5-2.8 6.6a1 1 0 0 1-.5.5l-6.6 2.8 2.8-6.6a1 1 0 0 1 .5-.5z" />
      </svg>
    );
  }
  if (name === "map") {
    return (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden>
        <path d="M20.5 3h-.2L15 5.1 9 3 3.4 4.9a.5.5 0 0 0-.4.5V20a.5.5 0 0 0 .6.5l5.3-1.8L15 21l5.6-1.9a.5.5 0 0 0 .4-.5V3.5a.5.5 0 0 0-.5-.5zM9 5.4l5 1.8v11.4l-5-1.8zm10 12.4-4 1.3V7.7l4-1.3z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1 4.22 2.44C11.09 5 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
    </svg>
  );
}

export function Features() {
  return (
    <section className="features" aria-labelledby="features-heading">
      <div className="features__intro reveal">
        <h2 id="features-heading">כל הבילוי — באפליקציה אחת</h2>
        <p>
          DateSpot נבנתה כדי להפוך את החיפוש אחרי יציאה לפשוט, יפה ומדויק יותר — במיוחד
          כשאתם רוצים מקום שמרגיש נכון.
        </p>
      </div>
      <ul className="features__list">
        {features.map((feature, index) => (
          <li key={feature.title} className={`features__item reveal reveal--delay-${index + 1}`}>
            <div className="features__icon">
              <FeatureIcon name={feature.icon} />
            </div>
            <h3>{feature.title}</h3>
            <div className="features__rule" aria-hidden />
            <p>{feature.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

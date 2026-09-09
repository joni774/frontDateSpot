import { contactEmail } from "../config";

const faqs = [
  {
    question: "האם DateSpot בחינם?",
    answer:
      "כן. הגלישה בבילויים והשימוש הבסיסי באפליקציה חינמיים לגמרי. יש גם מנוי VIP אופציונלי (₪19.90 לחודש) שמסיר את המגבלה היומית מצ'אט ה-AI.",
  },
  {
    question: "האם צריך להירשם כדי לגלוש?",
    answer:
      "לא — אפשר לגלוש ולחפש בילויים בלי הרשמה. הרשמה נדרשת רק כדי לשמור מקומות מועדפים ולהשתמש בצ'אט ה-AI.",
  },
  {
    question: "האם האפליקציה זמינה באייפון ובאנדרואיד?",
    answer: "כן, DateSpot תהיה זמינה בקרוב גם ב-App Store וגם ב-Google Play.",
  },
  {
    question: "איך יוצרים קשר עם התמיכה?",
    answer: `אפשר לפנות אלינו בכל שאלה במייל ${contactEmail}.`,
  },
] as const;

export function Faq() {
  return (
    <section className="faq" aria-labelledby="faq-heading">
      <div className="faq__intro reveal">
        <h2 id="faq-heading">שאלות נפוצות</h2>
      </div>
      <div className="faq__list">
        {faqs.map((item, index) => (
          <details key={item.question} className={`faq__item reveal reveal--delay-${index + 1}`}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

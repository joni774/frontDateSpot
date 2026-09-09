import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="page">
      <Header />
      <main className="legal">
        <div className="legal__inner">
          <h1>{title}</h1>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

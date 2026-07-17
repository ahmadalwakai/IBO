"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quoteEnabled, setQuoteEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/public/content")
      .then((res) => res.json())
      .then((data) => setQuoteEnabled(Boolean(data.settings?.quoteEnabled)))
      .catch(() => undefined);
  }, []);

  if (!quoteEnabled) {
    return (
      <div className="success-note">
        Online-Anfragen sind aktuell pausiert. Bitte rufen Sie uns direkt an.
      </div>
    );
  }

  return (
    <form
      className="contact-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            phone: form.get("phone"),
            email: form.get("email"),
            message: form.get("message"),
          }),
        });
        setLoading(false);
        if (response.ok) {
          event.currentTarget.reset();
          setSent(true);
        }
      }}
    >
      <div className="form-row">
        <div className="field">
          <input id="name" name="name" type="text" required autoComplete="name" />
          <label htmlFor="name">Name</label>
        </div>
        <div className="field">
          <input id="phone" name="phone" type="tel" required autoComplete="tel" />
          <label htmlFor="phone">Telefon</label>
        </div>
      </div>
      <div className="field">
        <input id="email" name="email" type="email" autoComplete="email" />
        <label htmlFor="email">E-Mail optional</label>
      </div>
      <div className="field">
        <textarea id="message" name="message" required />
        <label htmlFor="message">Projekt kurz beschreiben</label>
      </div>
      <button className="luxury-button primary" type="submit">
        <span>{loading ? "Wird gesendet..." : "Anfrage senden"}</span>
        <Send aria-hidden="true" />
      </button>
      {sent ? (
        <p className="success-note" role="status">
          Danke. Ihre Anfrage wurde gesendet. Wir melden uns zur Terminabstimmung.
        </p>
      ) : null}
    </form>
  );
}

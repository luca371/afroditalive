import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalScreen.css';

export default function ContactScreen() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function handleSubmit(e) {
    e.preventDefault();
    // Deschide clientul de email cu datele completate
    const body = encodeURIComponent(`Nume: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    const subject = encodeURIComponent(form.subject || 'Contact Afrodita');
    window.location.href = `mailto:afroditaenterprise@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <button className="legal-back" onClick={() => navigate('/')}>← Înapoi</button>
        <span className="legal-logo">Afrodita</span>
      </nav>
      <div className="legal-content">
        <div className="legal-label">Suntem aici</div>
        <h1 className="legal-title">Contact</h1>
        <p className="legal-meta">Răspundem în mai puțin de 24 de ore</p>

        <div className="legal-contact-grid">

          <div className="legal-contact-info">
            <div className="legal-contact-item">
              <div className="legal-contact-icon">✉</div>
              <div>
                <div className="legal-contact-label">Email</div>
                <a href="mailto:afroditaenterprise@gmail.com" className="legal-contact-value">
                  afroditaenterprise@gmail.com
                </a>
              </div>
            </div>
            <div className="legal-contact-item">
              <div className="legal-contact-icon">◎</div>
              <div>
                <div className="legal-contact-label">Program suport</div>
                <div className="legal-contact-value">Luni – Vineri, 09:00 – 18:00</div>
              </div>
            </div>
            <div className="legal-contact-item">
              <div className="legal-contact-icon">→</div>
              <div>
                <div className="legal-contact-label">Răspuns garantat</div>
                <div className="legal-contact-value">În mai puțin de 24 de ore</div>
              </div>
            </div>
          </div>

          <div className="legal-contact-form">
            {sent ? (
              <div className="legal-contact-success">
                <div className="legal-contact-success-icon">✓</div>
                <p>Mulțumim! Clientul tău de email s-a deschis cu mesajul completat. Trimite-l și te contactăm în curând.</p>
                <button className="legal-contact-reset" onClick={() => setSent(false)}>
                  Trimite alt mesaj
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="legal-field">
                  <label>Nume *</label>
                  <input
                    type="text" required
                    placeholder="Numele tău"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="legal-field">
                  <label>Email *</label>
                  <input
                    type="email" required
                    placeholder="email@exemplu.ro"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="legal-field">
                  <label>Subiect</label>
                  <input
                    type="text"
                    placeholder="ex. Întrebare despre planuri"
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  />
                </div>
                <div className="legal-field">
                  <label>Mesaj *</label>
                  <textarea
                    required rows={5}
                    placeholder="Cum te putem ajuta?"
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  />
                </div>
                <button type="submit" className="legal-submit">
                  Trimite mesajul →
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
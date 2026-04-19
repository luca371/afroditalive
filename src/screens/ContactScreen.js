import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './LegalScreen.css';

export default function ContactScreen() {
  const navigate = useNavigate();
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await addDoc(collection(db, 'feedback'), {
        name:      form.name.trim(),
        email:     form.email.trim(),
        subject:   form.subject.trim(),
        message:   form.message.trim(),
        createdAt: new Date().toISOString(),
        read:      false,
      });
      setSent(true);
    } catch {
      setError('A apărut o eroare. Încearcă din nou sau scrie direct la afroditaenterprise@gmail.com');
    } finally {
      setSending(false);
    }
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
                <p>Mesajul tău a fost trimis cu succes! Te contactăm în curând la <strong>{form.email}</strong>.</p>
                <button className="legal-contact-reset" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
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
                {error && <div className="legal-error">{error}</div>}
                <button type="submit" className="legal-submit" disabled={sending}>
                  {sending ? 'Se trimite...' : 'Trimite mesajul →'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
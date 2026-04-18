import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingScreen.css';

const SLOTS_RO = [
  { time: '10:00', name: 'Andreea', service: 'Vopsit + tratament', duration: '2h',    taken: false },
  { time: '11:30', name: 'Diana',   service: 'Tuns + coafat',       duration: '1h',    taken: false },
  { time: '13:00', name: 'Andreea', service: 'Manichiură gel',       duration: '1h',    taken: false },
  { time: '14:30', name: 'Diana',   service: 'Coafat ocazie',        duration: '1h30',  taken: false },
  { time: '16:00', name: 'Andreea', service: 'Tuns + tratament',     duration: '1h30',  taken: true  },
];
const SLOTS_EN = [
  { time: '10:00', name: 'Emma',  service: 'Color + treatment', duration: '2h',    taken: false },
  { time: '11:30', name: 'Diana', service: 'Haircut + blowdry', duration: '1h',    taken: false },
  { time: '13:00', name: 'Emma',  service: 'Gel manicure',      duration: '1h',    taken: false },
  { time: '14:30', name: 'Diana', service: 'Event styling',     duration: '1h30',  taken: false },
  { time: '16:00', name: 'Emma',  service: 'Haircut',           duration: '1h30',  taken: true  },
];

const BOOKINGS_RO = [
  { name: 'Maria P.',  service: 'Vopsit',     status: 'confirmed' },
  { name: 'Elena D.',  service: 'Tuns',        status: 'confirmed' },
  { name: 'Ioana C.',  service: 'Manichiură', status: 'pending'   },
  { name: 'Ana M.',    service: 'Tratament',   status: 'pending'   },
];
const BOOKINGS_EN = [
  { name: 'Sarah K.',  service: 'Color',     status: 'confirmed' },
  { name: 'Emma L.',   service: 'Haircut',   status: 'confirmed' },
  { name: 'Laura M.',  service: 'Manicure',  status: 'pending'   },
  { name: 'Anna P.',   service: 'Treatment', status: 'pending'   },
];

function InteractiveMockup({ lang = 'ro' }) {
  const SLOTS = lang === 'ro' ? SLOTS_RO : SLOTS_EN;
  const INITIAL_BOOKINGS = lang === 'ro' ? BOOKINGS_RO : BOOKINGS_EN;

  const L = lang === 'ro' ? {
    bookingPage:  'Pagina ta de booking',
    selectHour:   'Selectează o oră',
    dashboard:    'Dashboard salon · Azi',
    confirmed:    'Confirmat',
    pending:      'În așteptare',
    taken:        'Ocupat',
    confirmAppt:  'Confirmă programarea',
    yourName:     'Numele tău',
    phone:        'Telefon',
    namePh:       'ex. Ioana Popescu',
    phonePh:      '07xx xxx xxx',
    back:         '← Înapoi',
    confirmBtn:   'Confirmă',
    successTitle: 'Programare confirmată!',
    successNote:  'Vei primi un SMS de confirmare.',
    retry:        '{L.retry}',
    bookings:     'programări',
  } : {
    bookingPage:  'Your booking page',
    selectHour:   'Select a time',
    dashboard:    'Salon dashboard · Today',
    confirmed:    'Confirmed',
    pending:      'Pending',
    taken:        'Taken',
    confirmAppt:  'Confirm booking',
    yourName:     'Your name',
    phone:        'Phone',
    namePh:       'e.g. Sarah Johnson',
    phonePh:      '+44 7xx xxx xxx',
    back:         '← Back',
    confirmBtn:   'Confirm',
    successTitle: 'Booking confirmed!',
    successNote:  'You will receive a confirmation SMS.',
    retry:        '↺ Try again',
    bookings:     'bookings',
  };
  const [step, setStep]             = useState('slots');
  const [selected, setSelected]     = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookings, setBookings]     = useState(INITIAL_BOOKINGS);

  function handleSelectSlot(slot) {
    if (slot.taken) return;
    setSelected(slot);
    setStep('form');
  }

  function handleConfirm() {
    if (!clientName.trim() || !clientPhone.trim()) return;
    const parts = clientName.trim().split(' ');
    const displayName = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
    const booking = { name: displayName, service: selected.service, status: 'pending', isNew: true };
    setBookings(prev => [booking, ...prev]);
    setStep('success');
  }

  function handleReset() {
    setStep('slots');
    setSelected(null);
    setClientName('');
    setClientPhone('');
    setBookings(INITIAL_BOOKINGS);
  }

  return (
    <div className="l-mockup-wrap l-reveal">
      <div className="l-mockup-bar">
        <div className="l-dot l-dot-r" />
        <div className="l-dot l-dot-y" />
        <div className="l-dot l-dot-g" />
        <div className="l-mockup-url">
          {step === 'slots'   && 'afroditalive.ro/book/salon-lumiere'}
          {step === 'form'    && 'afroditalive.ro/book/salon-lumiere/confirmare'}
          {step === 'success' && 'afroditalive.ro/book/salon-lumiere/succes'}
        </div>
      </div>

      <div className="l-mockup-body">

        {/* ── STÂNGA: booking flow ── */}
        <div className="l-mock-card">
          {step === 'slots' && (
            <>
              <div className="l-mock-label">{L.bookingPage}</div>
              <div className="l-mock-title">{L.selectHour}</div>
              {SLOTS.map((slot, i) => (
                <div
                  key={i}
                  className={`l-mock-slot${slot.taken ? ' taken' : ''}`}
                  onClick={() => handleSelectSlot(slot)}
                  style={{ cursor: slot.taken ? 'default' : 'pointer' }}
                >
                  <span className="l-mock-slot-time">{slot.time}</span>
                  <span className="l-mock-slot-info">
                    <span className="l-mock-slot-svc">{slot.taken ? L.taken : slot.service}</span>
                    {!slot.taken && <span className="l-mock-slot-meta">{slot.name} · {slot.duration}</span>}
                  </span>
                  {!slot.taken && <span className="l-mock-slot-arrow">→</span>}
                </div>
              ))}
            </>
          )}

          {step === 'form' && (
            <>
              <div className="l-mock-label">{L.confirmAppt}</div>
              <div className="l-mock-confirm-slot">
                <span className="l-mock-confirm-time">{selected.time}</span>
                <span>
                  <strong>{selected.service}</strong>
                  <span className="l-mock-confirm-meta"> · {selected.name} · {selected.duration}</span>
                </span>
              </div>
              <div className="l-mock-form">
                <div className="l-mock-field">
                  <label>{L.yourName}</label>
                  <input
                    type="text"
                    placeholder={L.namePh}
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    maxLength={40}
                  />
                </div>
                <div className="l-mock-field">
                  <label>{L.phone}</label>
                  <input
                    type="tel"
                    placeholder={L.phonePh}
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    maxLength={15}
                  />
                </div>
                <div className="l-mock-form-actions">
                  <button className="l-mock-back" onClick={() => setStep('slots')}>{L.back}</button>
                  <button
                    className={`l-mock-submit${clientName && clientPhone ? ' ready' : ''}`}
                    onClick={handleConfirm}
                  >
                    {L.confirmBtn}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="l-mock-success">
              <div className="l-mock-success-icon">✓</div>
              <div className="l-mock-success-title">{L.successTitle}</div>
              <div className="l-mock-success-detail">{selected.time} · {selected.service}</div>
              <div className="l-mock-success-detail">{clientName} · {clientPhone}</div>
              <div className="l-mock-success-note">{L.successNote}</div>
              <button className="l-mock-back" onClick={handleReset} style={{ marginTop: 20 }}>
                {L.retry}
              </button>
            </div>
          )}
        </div>

        {/* ── DREAPTA: dashboard live ── */}
        <div className="l-mock-card">
          <div className="l-mock-label">{L.dashboard}</div>
          <div className="l-mock-title">{`${bookings.length} ${L.bookings}`}</div>
          {bookings.map((b, i) => (
            <div key={i} className={`l-mock-row${b.isNew ? ' l-mock-row-new' : ''}`}>
              <span className="l-mock-row-name">{b.name} · {b.service}</span>
              <span className={`l-mock-status ${b.status === 'confirmed' ? 'l-status-confirmed' : 'l-status-pending'}`}>
                {b.status === 'confirmed' ? labelConfirmed : labelPending}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const T = {
  ro: {
    navHow: 'Cum funcționează', navFeatures: 'Funcții', navPricing: 'Prețuri', navCta: 'Încearcă gratuit',
    badge: 'Programări inteligente pentru saloane',
    heroTitle1: 'Eleganța', heroTitle2: 'digitală', heroTitle3: 'a salonului tău',
    heroSub: 'Booking online. Dashboard complet. Zero complicații.',
    heroDesc: 'Afrodita transformă programările telefonice în rezervări online elegante — pentru clienții tăi și pentru tine.',
    heroBtn: 'Începe gratuit', heroGhost: 'Descoperă cum funcționează',
    howLabel: 'Cum funcționează', howTitle1: 'Simplu pentru tine.', howTitle2: 'Elegant', howTitle3: 'pentru clienți.',
    howSub: 'De la configurare la prima programare — în mai puțin de 30 de minute.',
    steps: [
      { name: 'Creezi contul', desc: 'Înregistrezi salonul, adaugi serviciile, angajații și programul de lucru.' },
      { name: 'Partajezi linkul', desc: 'Primești un link unic pe care îl pui pe Instagram, Google sau site-ul tău.' },
      { name: 'Clienții se programează', desc: 'Aleg serviciul, stilistul și ora disponibilă — fără să-și creeze cont.' },
      { name: 'Tu gestionezi din dashboard', desc: 'Vezi toate programările în timp real, confirmi sau anulezi, și primești SMS automat.' },
    ],
    featLabel: 'Funcționalități', featTitle1: 'Tot ce ai nevoie.', featTitle2: 'Nimic în plus.',
    featSub: 'Construit specific pentru saloane de înfrumusețare din România.',
    features: [
      { name: 'Calendar în timp real', desc: 'Sloturile disponibile se actualizează instant. Niciodată două programări în același timp.' },
      { name: 'Pagina ta de booking', desc: 'O pagină elegantă, personalizată cu numele și culorile salonului tău. Zero programare tehnică.' },
      { name: 'Fără cont pentru clienți', desc: 'Clienții se programează doar cu nume și telefon. Simplu, rapid, fără bariere.' },
      { name: 'Dashboard complet', desc: 'Programările de azi, calendarul săptămânal și statistici clare despre performanța salonului.' },
      { name: 'SMS reminder automat', desc: 'Clientul primește un SMS cu 24 de ore înainte. Reduci no-show-urile cu până la 60%.' },
      { name: 'Multi-angajat', desc: 'Fiecare stilist cu programul și serviciile lui. Clientul alege cu cine și când.' },
    ],
    pricingLabel: 'Prețuri', pricingTitle1: 'Transparent.', pricingTitle2: 'Fără surprize.',
    pricingSub: 'Alegi planul potrivit. Poți schimba oricând.',
    plans: [
      { name: 'Free', price: '0', period: 'Pentru totdeauna', features: ['1 angajat', 'Până la 30 programări/lună', 'Pagina publică de booking', 'Dashboard de bază'], cta: 'Începe gratuit' },
      { name: 'Starter', price: '15', period: 'Facturare lunară', features: ['3 angajați', 'Programări nelimitate', 'Calendar săptămânal', 'Confirmare/anulare din dashboard'], cta: 'Alege Starter' },
      { name: 'Pro', price: '45', period: 'Facturare lunară', features: ['10 angajați', 'Programări nelimitate', 'Email confirmări automate', 'Statistici avansate', 'Prioritate la suport'], cta: 'Alege Pro', badge: 'Cel mai ales', featured: true },
      { name: 'Business', price: '99', period: 'Facturare lunară', features: ['Angajați nelimitați', 'Mai multe locații', 'Email confirmări incluse', 'Onboarding dedicat', 'Integrare site propriu'], cta: 'Alege Business' },
    ],
    quote: '{t.quote}',
    quoteAuthor: '{t.quoteAuthor}',
    ctaTitle1: 'Pregătit să transformi', ctaTitle2: 'salonul tău?',
    ctaSub: 'Gratuit pentru totdeauna. Fără card bancar.',
    ctaBtn: '{t.ctaBtn}',
    ctaNote: '{t.ctaNote}',
    footerTerms: 'Termeni', footerPrivacy: 'Confidențialitate', footerContact: 'Contact',
    footerCopy: '{t.footerCopy}',
    currency: 'lei/lună',
  },
  en: {
    navHow: 'How it works', navFeatures: 'Features', navPricing: 'Pricing', navCta: 'Try for free',
    badge: 'Smart booking for beauty salons',
    heroTitle1: 'The digital', heroTitle2: 'elegance', heroTitle3: 'of your salon',
    heroSub: 'Online booking. Full dashboard. Zero hassle.',
    heroDesc: 'Afrodita turns phone bookings into elegant online reservations — for your clients and for you.',
    heroBtn: 'Get started free', heroGhost: 'Discover how it works',
    howLabel: 'How it works', howTitle1: 'Simple for you.', howTitle2: 'Elegant', howTitle3: 'for your clients.',
    howSub: 'From setup to first booking — in less than 30 minutes.',
    steps: [
      { name: 'Create your account', desc: 'Register your salon, add services, employees and working hours.' },
      { name: 'Share your link', desc: 'Get a unique link to put on Instagram, Google or your website.' },
      { name: 'Clients book online', desc: 'They choose service, stylist and time — no account needed.' },
      { name: 'Manage from dashboard', desc: 'See all bookings in real time, confirm or cancel, get automatic reminders.' },
    ],
    featLabel: 'Features', featTitle1: 'Everything you need.', featTitle2: 'Nothing more.',
    featSub: 'Built specifically for beauty salons.',
    features: [
      { name: 'Real-time calendar', desc: 'Available slots update instantly. Never double-book again.' },
      { name: 'Your booking page', desc: 'An elegant page, personalized with your salon name and colors. Zero coding required.' },
      { name: 'No account for clients', desc: 'Clients book with just name and phone. Simple, fast, no barriers.' },
      { name: 'Full dashboard', desc: "Today's bookings, weekly calendar and clear stats about your salon's performance." },
      { name: 'Automatic SMS reminder', desc: 'Client gets an SMS 24 hours before. Reduce no-shows by up to 60%.' },
      { name: 'Multi-staff', desc: 'Each stylist with their own schedule and services. Client chooses who and when.' },
    ],
    pricingLabel: 'Pricing', pricingTitle1: 'Transparent.', pricingTitle2: 'No surprises.',
    pricingSub: 'Choose the right plan. Change anytime.',
    plans: [
      { name: 'Free', price: '0', period: 'Forever', features: ['1 staff member', 'Up to 30 bookings/month', 'Public booking page', 'Basic dashboard'], cta: 'Get started free' },
      { name: 'Starter', price: '15', period: 'Monthly billing', features: ['3 staff members', 'Unlimited bookings', 'Weekly calendar', 'Confirm/cancel from dashboard'], cta: 'Choose Starter' },
      { name: 'Pro', price: '45', period: 'Monthly billing', features: ['10 staff members', 'Unlimited bookings', 'Automatic email confirmations', 'Advanced analytics', 'Priority support'], cta: 'Choose Pro', badge: 'Most popular', featured: true },
      { name: 'Business', price: '99', period: 'Monthly billing', features: ['Unlimited staff', 'Multiple locations', 'Email confirmations included', 'Dedicated onboarding', 'Website integration'], cta: 'Choose Business' },
    ],
    quote: '"Since I started using Afrodita, I no longer waste time on the phone. Clients book themselves, even on Sunday at midnight."',
    quoteAuthor: 'Andreea M. · Studio Lumière, Bucharest',
    ctaTitle1: 'Ready to transform', ctaTitle2: 'your salon?',
    ctaSub: 'Free forever. No credit card required.',
    ctaBtn: 'Create free account',
    ctaNote: 'Full setup in less than 30 minutes',
    footerTerms: 'Terms', footerPrivacy: 'Privacy', footerContact: 'Contact',
    footerCopy: '© 2025 Afroditalive. Built in Romania.',
    currency: 'RON/mo',
  },
};

export default function LandingScreen() {
  const navRef  = useRef(null);
  const navigate = useNavigate();
  const [lang, setLang] = useState('ro');
  const t = T[lang];

  // Nav scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 60);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const reveals = document.querySelectorAll('.l-reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing">

      {/* ─── NAV ─── */}
      <nav className="l-nav" ref={navRef}>
        <a href="/" className="l-logo">Afrodita</a>
        <ul className="l-nav-links">
          <li><a href="#how">{t.navHow}</a></li>
          <li><a href="#features">{t.navFeatures}</a></li>
          <li><a href="#pricing">{t.navPricing}</a></li>
          <li>
            <button
              className="l-lang-toggle"
              onClick={() => setLang(l => l === 'ro' ? 'en' : 'ro')}
            >
              {lang === 'ro' ? '🇬🇧 EN' : '🇷🇴 RO'}
            </button>
          </li>
          <li>
            <button className="l-nav-cta" onClick={() => navigate('/register')}>
              {t.navCta}
            </button>
          </li>
        </ul>
      </nav>

      {/* ─── HERO ─── */}
      <section className="l-hero">
        <div className="l-hero-lines" />

        <h1 className="l-hero-title">
          {lang === 'ro' ? (
            <>{t.heroTitle1}<br /><em>{t.heroTitle2}</em><br />{t.heroTitle3}</>
          ) : (
            <>{t.heroTitle1}<br /><em>{t.heroTitle2}</em><br />{t.heroTitle3}</>
          )}
        </h1>

        <p className="l-hero-subtitle">{t.heroSub}</p>
        <p className="l-hero-desc">{t.heroDesc}</p>

        <div className="l-hero-actions">
          <button className="l-btn-primary" onClick={() => navigate('/register')}>
            {t.heroBtn}
          </button>
          <a href="#how" className="l-btn-ghost">
            {t.heroGhost}
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="l-scroll-hint">
          <span>Scroll</span>
          <div className="l-scroll-line" />
        </div>
      </section>

      {/* ─── PREVIEW MOCKUP ─── */}
      <section className="l-preview">
        <div className="l-preview-inner">
          <InteractiveMockup lang={lang} />
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="l-how" id="how">
        <div className="l-section-label">{t.howLabel}</div>
        <h2 className="l-section-title l-reveal">
          {t.howTitle1}<br /><em>{t.howTitle2}</em> {t.howTitle3}
        </h2>
        <p className="l-section-sub l-reveal">{t.howSub}</p>
        <div className="l-line-divider l-reveal"><div className="l-line-divider-dot" /></div>
        <div className="l-steps">
          {t.steps.map((step, i) => (
            <div key={i} className={`l-step l-reveal l-reveal-d${i}`}>
              <div className="l-step-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  {i === 0 && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z"/>}
                  {i === 1 && <><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/><path d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1"/></>}
                  {i === 2 && <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}
                  {i === 3 && <><path d="M9 12l2 2 4-4"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></>}
                </svg>
              </div>
              <span className="l-step-num">0{i + 1}</span>
              <h3 className="l-step-name">{step.name}</h3>
              <p className="l-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="l-features" id="features">
        <div className="l-section-label">{t.featLabel}</div>
        <h2 className="l-section-title l-reveal">
          {t.featTitle1}<br /><em>{t.featTitle2}</em>
        </h2>
        <p className="l-section-sub l-reveal">{t.featSub}</p>

        <div className="l-features-grid">
          {t.features.map((f, i) => {
            const icons = [
              <><rect x="6" y="8" width="32" height="30" rx="4" /><path d="M14 4v8M30 4v8M6 20h32" /><circle cx="22" cy="30" r="3" /></>,
              <path d="M22 4l4.9 9.9L38 15.6l-8 7.8 1.9 11-9.9-5.2L12 34.4l1.9-11-8-7.8 11.1-1.7z" />,
              <><path d="M8 36l6-6m0 0l4-4m-4 4l-4-4m4 4l4 4" /><path d="M14 14c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z" /><path d="M36 36c0-5.5-4.5-10-10-10H18" /></>,
              <><path d="M8 8h28v4H8z" /><path d="M8 18h20M8 26h16M8 34h12" /><path d="M30 26l4 4 8-8" strokeWidth="1.8" /></>,
              <><path d="M8 32l4-4 6 6 8-16 6 8 4-4" /><path d="M4 38h36" /></>,
              <><path d="M22 8v28M8 22h28" /><circle cx="22" cy="22" r="16" /></>,
            ];
            return (
              <div key={i} className="l-feature l-reveal">
                <svg className="l-feature-icon" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 44 44">
                  {icons[i]}
                </svg>
                <h3 className="l-feature-name">{f.name}</h3>
                <p className="l-feature-desc">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="l-pricing" id="pricing">
        <div className="l-section-label">{t.pricingLabel}</div>
        <h2 className="l-section-title l-reveal">
          {t.pricingTitle1}<br /><em>{t.pricingTitle2}</em>
        </h2>
        <p className="l-section-sub l-reveal">{t.pricingSub}</p>

        <div className="l-plans">
          {t.plans.map((plan, i) => (
            <div key={i} className={`l-plan l-reveal l-reveal-d${i} ${plan.featured ? 'featured' : ''}`}>
              {plan.badge && <div className="l-plan-badge">{plan.badge}</div>}
              <div className="l-plan-name">{plan.name}</div>
              <div className="l-plan-price">
                {plan.price} <small>{t.currency}</small>
              </div>
              <div className="l-plan-period">{plan.period}</div>
              <div className="l-plan-divider" />
              <ul className="l-plan-features">
                {plan.features.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
              <button className="l-plan-btn" onClick={() => navigate('/register')}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── QUOTE ─── */}
      <section className="l-quote">
        <p className="l-quote-text l-reveal">
          {t.quote}
        </p>
        <p className="l-quote-author l-reveal">{t.quoteAuthor}</p>
      </section>

      {/* ─── CTA ─── */}
      <section className="l-cta">
        <h2 className="l-cta-title l-reveal">
          {t.ctaTitle1}<br /><em>{t.ctaTitle2}</em>
        </h2>
        <p className="l-cta-sub l-reveal">{t.ctaSub}</p>
        <div className="l-cta-actions l-reveal">
          <button className="l-btn-primary" onClick={() => navigate('/register')}>
            {t.ctaBtn}
          </button>
          <span className="l-cta-note">{t.ctaNote}</span>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="l-footer">
        <div className="l-footer-logo">Afrodita</div>
        <ul className="l-footer-links">
          <li><a href="/termeni">{t.footerTerms}</a></li>
          <li><a href="/confidentialitate">{t.footerPrivacy}</a></li>
          <li><a href="/contact">{t.footerContact}</a></li>
        </ul>
        <p className="l-footer-copy">{t.footerCopy}</p>
      </footer>

    </div>
  );
}
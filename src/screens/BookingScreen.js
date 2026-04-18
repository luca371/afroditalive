import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection, query, where, getDocs, addDoc
} from 'firebase/firestore';
import { canAddBooking } from '../utils/planLimits';
import { db } from '../firebase';
import './BookingScreen.css';

const STEPS = ['Serviciu', 'Stilist', 'Data & Ora', 'Confirmare'];

export default function BookingScreen() {
  const { salonSlug } = useParams();

  const [salon, setSalon]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep]             = useState(0);
  const [selectedService, setService]   = useState(null);
  const [selectedEmployee, setEmployee] = useState(null);
  const [selectedDate, setDate]         = useState(null);
  const [selectedSlot, setSlot]         = useState(null);
  const [availableSlots, setSlots]      = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [clientName, setClientName]   = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [error, setError]             = useState('');

  // Fetch salon by slug
  useEffect(() => {
    async function fetchSalon() {
      const q = query(collection(db, 'salons'), where('slug', '==', salonSlug));
      const snap = await getDocs(q);
      if (snap.empty) { setNotFound(true); setLoading(false); return; }
      setSalon({ id: snap.docs[0].id, ...snap.docs[0].data() });
      setLoading(false);
    }
    fetchSalon();
  }, [salonSlug]);

  // Compute available slots when date + employee + service selected
  const computeSlots = useCallback(async () => {
    if (!selectedDate || !selectedEmployee || !selectedService || !salon) return;
    setLoadingSlots(true);
    setSlot(null);

    const dateStr = toLocalDateString(selectedDate);
    const dayName = getDayName(selectedDate);
    const daySchedule = salon.schedule?.[dayName];

    if (!daySchedule?.open) { setSlots([]); setLoadingSlots(false); return; }

    const q = query(
      collection(db, 'bookings'),
      where('salonId',    '==', salon.id),
      where('employeeId', '==', selectedEmployee.name),
      where('date',       '==', dateStr)
    );
    const snap = await getDocs(q);
    const existing = snap.docs
      .map(d => d.data())
      .filter(b => b.status !== 'cancelled');

    const slots = generateSlots(
      daySchedule.from,
      daySchedule.to,
      selectedService.duration,
      existing
    );

    setSlots(slots);
    setLoadingSlots(false);
  }, [selectedDate, selectedEmployee, selectedService, salon]);

  useEffect(() => {
    computeSlots();
  }, [computeSlots]);

  async function handleConfirm() {
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Completează numele și telefonul.'); return;
    }
    setSubmitting(true); setError('');
    try {
      // Verifică limita de programări/lună pentru planul Free
      const plan = salon.plan || 'free';
      if (plan === 'free') {
        const now = new Date();
        const firstOfMonth = toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
        const lastOfMonth  = toLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        const q = query(
          collection(db, 'bookings'),
          where('salonId', '==', salon.id)
        );
        const snap = await getDocs(q);
        const countThisMonth = snap.docs
          .map(d => d.data())
          .filter(b => b.status !== 'cancelled' && b.date >= firstOfMonth && b.date <= lastOfMonth)
          .length;
        if (!canAddBooking(plan, countThisMonth)) {
          setError('Salonul a atins limita de 30 programări/lună pentru planul Free. Revino luna viitoare sau contactează salonul direct.');
          setSubmitting(false);
          return;
        }
      }

      await addDoc(collection(db, 'bookings'), {
        salonId:      salon.id,
        clientName:   clientName.trim(),
        clientPhone:  clientPhone.trim(),
        clientEmail:  clientEmail.trim(),
        serviceId:    selectedService.name,
        serviceName:  selectedService.name,
        employeeId:   selectedEmployee.name,
        employeeName: selectedEmployee.name,
        date:         toLocalDateString(selectedDate),
        timeSlot:     selectedSlot,
        duration:     selectedService.duration,
        status:       'pending',
        createdAt:    new Date().toISOString(),
      });

      setBookingDone(true);
    } catch {
      setError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() { setStep(s => s + 1); }
  function goBack() { setStep(s => s - 1); setError(''); }

  // ── Loading / Not found ──
  if (loading) return <div className="bk-page"><div className="bk-loading">Se încarcă...</div></div>;
  if (notFound) return (
    <div className="bk-page">
      <div className="bk-notfound">
        <div className="bk-logo">Afrodita</div>
        <h1>Salon negăsit</h1>
        <p>Linkul de booking nu este valid.</p>
      </div>
    </div>
  );

  // ── Success ──
  if (bookingDone) return (
    <div className="bk-page">
      <div className="bk-success-wrap">
        <div className="bk-logo">{salon.name}</div>
        <div className="bk-success-card">
          <div className="bk-success-icon">✓</div>
          <h2>Cerere trimisă!</h2>
          <p className="bk-success-subtitle">
            Programarea ta a fost înregistrată și urmează să fie confirmată de salon.
            {clientEmail.trim() && <> Vei primi un email de confirmare la <strong>{clientEmail.trim()}</strong>.</>}
          </p>
          <div className="bk-success-details">
            <div className="bk-success-row">
              <span>Serviciu</span><span>{selectedService.name}</span>
            </div>
            <div className="bk-success-row">
              <span>Stilist</span><span>{selectedEmployee.name}</span>
            </div>
            <div className="bk-success-row">
              <span>Data</span><span>{formatDateRo(selectedDate)}</span>
            </div>
            <div className="bk-success-row">
              <span>Ora</span><span>{selectedSlot}</span>
            </div>
            <div className="bk-success-row">
              <span>Nume</span><span>{clientName}</span>
            </div>
          </div>
          <p className="bk-success-note">
            Te așteptăm la {salon.name}!
            {salon.address && <><br />{salon.address}, {salon.city}</>}
            {salon.phone && <><br />📞 {salon.phone}</>}
          </p>
          {salon.phone && (
            <p className="bk-success-cancel">
              Dacă dorești să anulezi, sună la <strong>{salon.phone}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bk-page">

      {/* Header */}
      <header className="bk-header">
        <div className="bk-header-salon">
          <h1 className="bk-salon-name">{salon.name}</h1>
          {salon.city && <span className="bk-salon-city">{salon.city}</span>}
        </div>
        <div className="bk-powered">
          powered by <span>Afrodita</span>
        </div>
      </header>

      {/* Progress */}
      <div className="bk-progress">
        {STEPS.map((label, i) => (
          <div key={i} className={`bk-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <div className="bk-step-dot">{i < step ? '✓' : i + 1}</div>
            <span className="bk-step-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bk-card">

        {/* ── PASUL 1: Serviciu ── */}
        {step === 0 && (
          <>
            <h2 className="bk-card-title">Alege serviciul</h2>
            {!salon.services?.length ? (
              <p className="bk-empty">Niciun serviciu configurat.</p>
            ) : (
              <div className="bk-service-grid">
                {salon.services.map((svc, i) => (
                  <button
                    key={i}
                    className={`bk-service-card ${selectedService?.name === svc.name ? 'selected' : ''}`}
                    onClick={() => { setService(svc); setEmployee(null); setSlot(null); }}
                  >
                    <span className="bk-svc-name">{svc.name}</span>
                    <span className="bk-svc-meta">
                      {svc.duration} min
                      {svc.price ? ` · ${svc.price} lei` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="bk-actions">
              <div />
              <button
                className="bk-btn-next"
                disabled={!selectedService}
                onClick={goNext}
              >
                Continuă →
              </button>
            </div>
          </>
        )}

        {/* ── PASUL 2: Stilist ── */}
        {step === 1 && (
          <>
            <h2 className="bk-card-title">Alege stilistul</h2>
            <div className="bk-employee-grid">
              {(salon.employees || [])
                .filter(emp =>
                  !emp.services?.length || emp.services.includes(selectedService.name)
                )
                .map((emp, i) => (
                <button
                  key={i}
                  className={`bk-employee-card ${selectedEmployee?.name === emp.name ? 'selected' : ''}`}
                  onClick={() => { setEmployee(emp); setSlot(null); }}
                >
                  <div className="bk-emp-avatar">{emp.name[0]}</div>
                  <span className="bk-emp-name">{emp.name}</span>
                  {emp.role && <span className="bk-emp-role">{emp.role}</span>}
                </button>
                ))}
            </div>
            <div className="bk-actions">
              <button className="bk-btn-back" onClick={goBack}>← Înapoi</button>
              <button className="bk-btn-next" disabled={!selectedEmployee} onClick={goNext}>
                Continuă →
              </button>
            </div>
          </>
        )}

        {/* ── PASUL 3: Data & Ora ── */}
        {step === 2 && (
          <>
            <h2 className="bk-card-title">Alege data și ora</h2>

            {/* Calendar */}
            <MiniCalendar
              salon={salon}
              selected={selectedDate}
              onSelect={(d) => { setDate(d); setSlot(null); }}
            />

            {/* Sloturi */}
            {selectedDate && (
              <div className="bk-slots-section">
                <div className="bk-slots-label">
                  Ore disponibile — {formatDateRo(selectedDate)}
                </div>
                {loadingSlots ? (
                  <div className="bk-slots-loading">Se verifică disponibilitatea...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="bk-slots-empty">
                    Nicio oră disponibilă în această zi.
                  </div>
                ) : (
                  <div className="bk-slots-grid">
                    {availableSlots.map((slot, i) => (
                      <button
                        key={i}
                        className={`bk-slot ${slot.available ? '' : 'taken'} ${selectedSlot === slot.time ? 'selected' : ''}`}
                        disabled={!slot.available}
                        onClick={() => setSlot(slot.time)}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bk-actions">
              <button className="bk-btn-back" onClick={goBack}>← Înapoi</button>
              <button
                className="bk-btn-next"
                disabled={!selectedSlot}
                onClick={goNext}
              >
                Continuă →
              </button>
            </div>
          </>
        )}

        {/* ── PASUL 4: Confirmare ── */}
        {step === 3 && (
          <>
            <h2 className="bk-card-title">Confirmă programarea</h2>

            {/* Summary */}
            <div className="bk-summary">
              <div className="bk-summary-row">
                <span>Serviciu</span><span>{selectedService.name}</span>
              </div>
              <div className="bk-summary-row">
                <span>Stilist</span><span>{selectedEmployee.name}</span>
              </div>
              <div className="bk-summary-row">
                <span>Data</span><span>{formatDateRo(selectedDate)}</span>
              </div>
              <div className="bk-summary-row">
                <span>Ora</span><span>{selectedSlot}</span>
              </div>
              <div className="bk-summary-row">
                <span>Durată</span><span>{selectedService.duration} min</span>
              </div>
              {selectedService.price && (
                <div className="bk-summary-row">
                  <span>Preț</span><span>{selectedService.price} lei</span>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="bk-form">
              <div className="bk-field">
                <label>Numele tău *</label>
                <input
                  type="text"
                  placeholder="ex. Ioana Popescu"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
              </div>
              <div className="bk-field">
                <label>Telefon *</label>
                <input
                  type="tel"
                  placeholder="07xx xxx xxx"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  maxLength={15}
                />
              </div>
              <div className="bk-field">
                <label>Email (pentru confirmare)</label>
                <input
                  type="email"
                  placeholder="ioana@email.ro"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>

            {error && <div className="bk-error">{error}</div>}

            <div className="bk-actions">
              <button className="bk-btn-back" onClick={goBack}>← Înapoi</button>
              <button
                className="bk-btn-confirm"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? 'Se trimite...' : 'Confirmă programarea ✓'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bk-footer">
        Programări online cu <a href="/" target="_blank" rel="noreferrer">Afrodita</a>
      </div>
    </div>
  );
}

// ── Mini Calendar Component ──
function MiniCalendar({ salon, selected, onSelect }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year  = month.getFullYear();
  const mon   = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const offset   = firstDay === 0 ? 6 : firstDay - 1; // Monday first
  const daysInMonth = new Date(year, mon + 1, 0).getDate();

  function isDayOff(date) {
    const name = getDayName(date);
    return !salon?.schedule?.[name]?.open;
  }

  function isPast(date) {
    return date < today;
  }

  const MONTH_NAMES = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
                       'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
  const DAY_NAMES_SHORT = ['Lu','Ma','Mi','Jo','Vi','Sâ','Du'];

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, mon, d));

  return (
    <div className="bk-calendar">
      <div className="bk-cal-nav">
        <button onClick={() => setMonth(new Date(year, mon - 1, 1))}>‹</button>
        <span>{MONTH_NAMES[mon]} {year}</span>
        <button onClick={() => setMonth(new Date(year, mon + 1, 1))}>›</button>
      </div>
      <div className="bk-cal-grid">
        {DAY_NAMES_SHORT.map(d => (
          <div key={d} className="bk-cal-dow">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const past   = isPast(date);
          const dayOff = isDayOff(date);
          const isSelected = selected?.toDateString() === date.toDateString();
          const isToday    = today.toDateString()    === date.toDateString();
          const disabled   = past || dayOff;
          return (
            <button
              key={i}
              className={`bk-cal-day ${disabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ──
function getDayName(date) {
  const DAYS = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  return DAYS[date.getDay()];
}

function generateSlots(from, to, durationMin, existingBookings) {
  const slots = [];
  const [fH, fM] = from.split(':').map(Number);
  const [tH, tM] = to.split(':').map(Number);
  const start = fH * 60 + fM;
  const end   = tH * 60 + tM;

  for (let t = start; t + durationMin <= end; t += 30) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    const time = `${h}:${m}`;

    // Verificăm dacă slotul se suprapune cu o programare existentă
    const overlaps = existingBookings.some(b => {
      const [bH, bM] = b.timeSlot.split(':').map(Number);
      const bStart = bH * 60 + bM;
      const bEnd   = bStart + (b.duration || 60);
      const sEnd   = t + durationMin;
      return t < bEnd && sEnd > bStart;
    });

    slots.push({ time, available: !overlaps });
  }
  return slots;
}

function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateRo(date) {
  return date.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
}
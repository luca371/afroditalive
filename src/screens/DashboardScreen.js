import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc
} from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { canAddEmployee, getPlanLimits } from '../utils/planLimits';
import UpgradeModal from '../components/UpgradeModal';
import './DashboardScreen.css';

const VIEWS = ['Azi', 'Programări', 'Săptămână', 'Statistici', 'Setări'];

export default function DashboardScreen() {
  const { user, salon, setSalon, logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView]           = useState('Azi');
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dragInfo, setDragInfo]   = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [editMode, setEditMode]   = useState(false);
  const [pendingMoves, setPendingMoves] = useState({}); // { bookingId: { newDate, newHour, oldDate, oldTimeSlot } }
  const [saving, setSaving]       = useState(false);

  // Fetch bookings in real-time
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'bookings'),
      where('salonId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.timeSlot || '').localeCompare(b.timeSlot || '');
        });
      setBookings(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  async function handleStatus(bookingId, status) {
    await updateDoc(doc(db, 'bookings', bookingId), { status });

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking?.clientEmail) return;

    const serviceId  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const publicKey  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) return;

    const messages = {
      confirmed: 'Programarea ta a fost confirmată de salon. Te așteptăm!',
      cancelled: 'Din păcate, programarea ta a fost anulată de salon. Te rugăm să contactezi salonul pentru a reprograma.',
    };

    const statuses = {
      confirmed: 'Confirmat',
      cancelled: 'Anulat',
    };

    if (!messages[status]) return;

    try {
      await emailjs.send(serviceId, templateId, {
        name:          booking.clientName,
        email:         booking.clientEmail,
        time:          booking.timeSlot,
        message:       messages[status],
        status:        statuses[status],
        messagecancel: status === 'confirmed' ? 'Dacă dorești să anulezi programarea, apasă aici:' : '',
        client_name:   booking.clientName,
        client_email:  booking.clientEmail,
        salon_name:    salon?.name || '',
        service_name:  booking.serviceName,
        employee_name: booking.employeeName,
        date:          formatDateFromStr(booking.date),
        time_slot:     booking.timeSlot,
        duration:      booking.duration,
        price:         booking.price || '',
        address:       salon?.address ? `${salon.address}, ${salon.city}` : '',
        cancel_url:    `${window.location.origin}/cancel/${bookingId}`,
      }, publicKey);
    } catch {
      console.warn('Email nu a putut fi trimis.');
    }

    // Trimite SMS doar pentru planuri plătite
    const plan = salon?.plan || 'free';
    if (booking.clientPhone && plan !== 'free') {
      try {
        const cancelUrl = `${window.location.origin}/cancel/${bookingId}`;
        const dateFormatted = formatDateFromStr(booking.date);
        await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone:        booking.clientPhone,
            clientName:   booking.clientName,
            serviceName:  booking.serviceName,
            employeeName: booking.employeeName,
            date:         dateFormatted,
            timeSlot:     booking.timeSlot,
            status,
            cancelUrl,
            salonName:    salon?.name || '',
          }),
        });
      } catch {
        console.warn('SMS nu a putut fi trimis.');
      }
    }
  }

  function handleDrop(booking, newDate, newHour) {
    if (!booking || !newDate || !newHour) return;
    if (booking.date === newDate && booking.timeSlot === newHour) return;

    // Salvează mutarea ca pending — nu în Firestore încă
    setPendingMoves(prev => ({
      ...prev,
      [booking.id]: {
        newDate,
        newHour,
        oldDate:     booking.date,
        oldTimeSlot: booking.timeSlot,
        booking,
      },
    }));
  }

  async function handleSaveMoves() {
    if (Object.keys(pendingMoves).length === 0) return;
    setSaving(true);

    for (const [bookingId, move] of Object.entries(pendingMoves)) {
      const { newDate, newHour, oldDate, oldTimeSlot, booking } = move;
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          date:     newDate,
          timeSlot: newHour,
          movedAt:  new Date().toISOString(),
          movedBy:  'admin',
        });

        const oldDateFormatted = formatDateFromStr(oldDate);
        const newDateFormatted = formatDateFromStr(newDate);

        // Email
        const serviceId  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
        const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
        const publicKey  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey && booking.clientEmail) {
          const cancelUrl = `${window.location.origin}/cancel/${bookingId}`;
          try {
            await emailjs.send(serviceId, templateId, {
              name:          booking.clientName,
              email:         booking.clientEmail,
              time:          newHour,
              message:       `Programarea ta a fost reprogramată. Noua dată: ${newDateFormatted} la ${newHour} (anterior: ${oldDateFormatted} la ${oldTimeSlot}).`,
              status:        'Reprogramat',
              messagecancel: 'Dacă dorești să anulezi programarea, apasă aici:',
              client_name:   booking.clientName,
              client_email:  booking.clientEmail,
              salon_name:    salon?.name || '',
              service_name:  booking.serviceName,
              employee_name: booking.employeeName,
              date:          newDateFormatted,
              time_slot:     newHour,
              duration:      booking.duration,
              price:         booking.price || '',
              address:       salon?.address ? `${salon.address}, ${salon.city}` : '',
              phone:         salon?.phone || '',
              cancel_url:    cancelUrl,
            }, publicKey);
          } catch { console.warn('Email reprogramare eșuat.'); }
        }

        // SMS doar pentru planuri plătite
        if (booking.clientPhone && (salon?.plan || 'free') !== 'free') {
          try {
            await fetch('/api/send-sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone:        booking.clientPhone,
                serviceName:  booking.serviceName,
                employeeName: booking.employeeName,
                date:         formatDateFromStr(newDate),
                timeSlot:     newHour,
                status:       'rescheduled',
                cancelUrl:    `${window.location.origin}/cancel/${bookingId}`,
                salonName:    salon?.name || '',
              }),
            });
          } catch { console.warn('SMS reprogramare eșuat.'); }
        }

      } catch (err) {
        console.error('Eroare salvare mutare:', err);
      }
    }

    setPendingMoves({});
    setEditMode(false);
    setSaving(false);
  }

  function handleCancelEdit() {
    setPendingMoves({});
    setEditMode(false);
    setDragInfo(null);
    setDropTarget(null);
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  // ── Helpers ──
  const today = new Date().toISOString().split('T')[0];

  const todayBookings = bookings.filter(b => b.date === today);

  const [weekOffset, setWeekOffset] = useState(0);

  // Săptămâna curentă + offset
  function getWeekDays(offset = 0) {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }
  const weekDays = getWeekDays(weekOffset);
  const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

  const HOURS = (() => {
    const schedule = salon?.schedule;
    if (!schedule) return Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

    // Găsim cel mai devreme start și cel mai târziu end din zilele deschise
    const openDays = Object.values(schedule).filter(d => d.open);
    if (!openDays.length) return Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

    const minHour = Math.min(...openDays.map(d => parseInt(d.from)));
    const maxHour = Math.max(...openDays.map(d => parseInt(d.to)));

    return Array.from(
      { length: maxHour - minHour },
      (_, i) => `${String(minHour + i).padStart(2, '0')}:00`
    );
  })();

  function bookingsForDay(date) {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr);
  }

  const statusLabel = { confirmed: 'Confirmat', pending: 'În așteptare', cancelled: 'Anulat' };
  const statusClass = { confirmed: 'db-status-confirmed', pending: 'db-status-pending', cancelled: 'db-status-cancelled' };

  return (
    <div className="db-page">

      {/* ── SIDEBAR ── */}
      <aside className={`db-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="db-sidebar-logo">Afrodita</div>

        <nav className="db-nav">
          {VIEWS.map(v => (
            <button
              key={v}
              className={`db-nav-item ${view === v ? 'active' : ''}`}
              onClick={() => { setView(v); setMenuOpen(false); }}
            >
              {v === 'Azi'        && <IconToday />}
              {v === 'Programări' && <IconList />}
              {v === 'Săptămână'  && <IconCalendar />}
              {v === 'Statistici' && <IconStats />}
              {v === 'Setări'     && <IconSettings />}
              {v}
            </button>
          ))}
        </nav>

        <div className="db-sidebar-bottom">
          <div className="db-salon-info">
            <div className="db-salon-name">{salon?.name || 'Salonul meu'}</div>
            <div className="db-salon-plan">{salon?.plan || 'free'}</div>
          </div>
          <button className="db-logout" onClick={handleLogout}>
            <IconLogout /> Deconectare
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="db-main">

        {/* Header */}
        <header className="db-header">
          <button className="db-menu-btn" onClick={() => setMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
          <div className="db-header-title">
            {view === 'Azi'        && (
              <>
                <h1>Programările de azi</h1>
                <span>{formatDate(new Date())}</span>
              </>
            )}
            {view === 'Programări' && <h1>Toate programările</h1>}
            {view === 'Săptămână'  && <h1>Calendar săptămânal</h1>}
            {view === 'Statistici' && <h1>Statistici</h1>}
            {view === 'Setări'     && <h1>Setări salon</h1>}
          </div>
          <CopyLinkButton slug={salon?.slug} />
        </header>

        {/* Banner upgrade success */}
        {window.location.search.includes('upgrade=success') && <UpgradeBanner />}

        {/* ── VIEW: AZI ── */}
        {view === 'Azi' && (
          <div className="db-content">
            {/* Stats */}
            <div className="db-stats">
              <div className="db-stat">
                <span className="db-stat-num">{todayBookings.length}</span>
                <span className="db-stat-label">Total azi</span>
              </div>
              <div className="db-stat">
                <span className="db-stat-num">{todayBookings.filter(b => b.status === 'confirmed').length}</span>
                <span className="db-stat-label">Confirmate</span>
              </div>
              <div className="db-stat">
                <span className="db-stat-num">{todayBookings.filter(b => b.status === 'pending').length}</span>
                <span className="db-stat-label">În așteptare</span>
              </div>
              <div className="db-stat">
                <span className="db-stat-num">{bookings.filter(b => b.date >= today).length}</span>
                <span className="db-stat-label">Viitoare total</span>
              </div>
            </div>

            {/* Bookings list */}
            {loading ? (
              <div className="db-empty">Se încarcă...</div>
            ) : todayBookings.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-icon">◎</div>
                <p>Nicio programare pentru azi.</p>
                <a href={`/book/${salon?.slug || ''}`} target="_blank" rel="noreferrer" className="db-empty-link">
                  Partajează linkul de booking →
                </a>
              </div>
            ) : (
              <div className="db-bookings-list">
                {todayBookings.map(b => (
                  <div key={b.id} className={`db-booking-card ${b.status === 'cancelled' ? 'cancelled' : ''}`}>
                    <div className="db-booking-time">{b.timeSlot}</div>
                    <div className="db-booking-info">
                      <div className="db-booking-name">{b.clientName}</div>
                      <div className="db-booking-meta">
                        {b.serviceName} · {b.employeeName}
                        {b.clientPhone && <> · {b.clientPhone}</>}
                      </div>
                    </div>
                    <div className="db-booking-right">
                      <span className={`db-status ${statusClass[b.status]}`}>
                        {statusLabel[b.status]}
                      </span>
                      {b.status !== 'cancelled' && (
                        <div className="db-booking-actions">
                          {b.status !== 'confirmed' && (
                            <button
                              className="db-btn-confirm"
                              onClick={() => handleStatus(b.id, 'confirmed')}
                            >
                              Confirmă
                            </button>
                          )}
                          <button
                            className="db-btn-cancel"
                            onClick={() => handleStatus(b.id, 'cancelled')}
                          >
                            Anulează
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: TOATE PROGRAMĂRILE ── */}
        {view === 'Programări' && (
          <AllBookingsView bookings={bookings} onStatus={handleStatus} />
        )}

        {/* ── VIEW: SĂPTĂMÂNĂ ── */}
        {view === 'Săptămână' && (
          <div className="db-content db-content-calendar">
            <div className="db-calendar">
              {/* Navigare săptămână */}
              <div className="db-cal-nav">
                <button onClick={() => setWeekOffset(o => o - 1)}>‹ Anterior</button>
                <span>
                  {weekDays[0].toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {weekDays[6].toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {weekOffset === 0 && <span className="db-cal-nav-today"> · Săptămâna curentă</span>}
                </span>
                <button onClick={() => setWeekOffset(o => o + 1)}>Următor ›</button>
              </div>

              {/* Edit mode toolbar */}
              {!editMode ? (
                <div className="db-cal-edit-bar">
                  <button className="db-cal-edit-btn" onClick={() => setEditMode(true)}>
                    ✎ Editează calendar
                  </button>
                </div>
              ) : (
                <div className="db-cal-edit-bar db-cal-edit-bar-active">
                  <span className="db-cal-edit-hint">
                    {Object.keys(pendingMoves).length === 0
                      ? 'Trage programările pe noile ore'
                      : `${Object.keys(pendingMoves).length} modificare${Object.keys(pendingMoves).length > 1 ? 'i' : ''} nesalvată${Object.keys(pendingMoves).length > 1 ? 'te' : ''}`}
                  </span>
                  <div className="db-cal-edit-actions">
                    <button className="db-cal-discard-btn" onClick={handleCancelEdit}>
                      Renunță
                    </button>
                    <button
                      className="db-cal-save-btn"
                      onClick={handleSaveMoves}
                      disabled={Object.keys(pendingMoves).length === 0 || saving}
                    >
                      {saving ? 'Se salvează...' : `Salvează${Object.keys(pendingMoves).length > 0 ? ` (${Object.keys(pendingMoves).length})` : ''}`}
                    </button>
                  </div>
                </div>
              )}

              {dragInfo && (
                <div className="db-cal-drag-hint">
                  Muți programarea lui <strong>{dragInfo.clientName}</strong> — trage pe noua oră
                </div>
              )}

              {/* Header zile */}
              <div className="db-cal-header">
                <div className="db-cal-time-col" />
                {weekDays.map((d, i) => {
                  const isToday = d.toISOString().split('T')[0] === today;
                  return (
                    <div key={i} className={`db-cal-day-header ${isToday ? 'today' : ''}`}>
                      <span className="db-cal-day-name">{DAY_NAMES[i]}</span>
                      <span className="db-cal-day-num">{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Grid ore */}
              <div className="db-cal-body">
                {HOURS.map(hour => (
                  <div key={hour} className="db-cal-row">
                    <div className="db-cal-time">{hour}</div>
                    {weekDays.map((d, i) => {
                      const dateStr = d.toISOString().split('T')[0];
                      // Aplică pending moves pentru preview
                      const effectiveBookings = bookingsForDay(d).map(b => {
                        const move = pendingMoves[b.id];
                        if (move) return { ...b, date: move.newDate, timeSlot: move.newHour, isPending: true };
                        return b;
                      });
                      const dayBookings = effectiveBookings.filter(b =>
                        b.timeSlot && b.timeSlot.startsWith(hour.substring(0, 2)) && b.date === dateStr
                      );
                      const isDropTarget = dragInfo && dropTarget?.date === dateStr && dropTarget?.hour === hour;
                      return (
                        <div
                          key={i}
                          className={`db-cal-cell ${isDropTarget ? 'db-cal-drop-target' : ''}`}
                          onDragOver={e => {
                            if (!editMode) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDropTarget({ date: dateStr, hour });
                          }}
                          onDragEnter={e => {
                            if (!editMode) return;
                            e.preventDefault();
                            setDropTarget({ date: dateStr, hour });
                          }}
                          onDragLeave={() => setDropTarget(null)}
                          onDrop={e => {
                            if (!editMode) return;
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragInfo) handleDrop(dragInfo, dateStr, hour);
                            setDropTarget(null);
                            setDragInfo(null);
                          }}
                        >
                          {dayBookings.map(b => (
                            <div
                              key={b.id}
                              className={`db-cal-event ${statusClass[b.status]} ${editMode && b.status !== 'cancelled' ? 'db-cal-event-draggable' : ''} ${dragInfo?.id === b.id ? 'db-cal-event-dragging' : ''} ${b.isPending ? 'db-cal-event-pending' : ''}`}
                              title={editMode && b.status !== 'cancelled' ? 'Trage pentru a reprograma' : `${b.clientName} · ${b.serviceName}`}
                              draggable={editMode && b.status !== 'cancelled'}
                              onDragStart={e => {
                                if (!editMode || b.status === 'cancelled') { e.preventDefault(); return; }
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', b.id);
                                // Găsim booking-ul original pentru a păstra oldDate/oldTimeSlot
                                const original = bookings.find(ob => ob.id === b.id);
                                setTimeout(() => setDragInfo(original || b), 0);
                              }}
                              onDragEnd={() => {
                                setDragInfo(null);
                                setDropTarget(null);
                              }}
                            >
                              <span className="db-cal-event-time">{b.timeSlot}</span>
                              <span className="db-cal-event-name">{b.clientName}</span>
                              {b.isPending && <span className="db-cal-event-pending-dot">●</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW: STATISTICI ── */}
        {view === 'Statistici' && (
          <StatsView bookings={bookings} salon={salon} onUpgrade={() => setShowUpgrade(true)} />
        )}

        {/* ── VIEW: SETĂRI ── */}
        {view === 'Setări' && (
          <SettingsView user={user} salon={salon} setSalon={setSalon} navigate={navigate} onUpgrade={() => setShowUpgrade(true)} />
        )}
      </main>

      {/* Overlay mobile */}
      {menuOpen && <div className="db-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Upgrade modal */}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

function UpgradeBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="db-upgrade-success">
      Planul tău a fost actualizat cu succes. Mulțumim.
    </div>
  );
}

// ── Stats View ──
const PIE_COLORS = ['#C9A87C', '#5de07a', '#f07a7a', '#7a9cf0', '#c07af0'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(26,14,9,0.95)',
      border: '1px solid rgba(201,168,124,0.3)',
      borderRadius: 6,
      padding: '10px 14px',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 13,
      color: '#FAF7F2',
    }}>
      {label && <div style={{ color: 'rgba(250,247,242,0.5)', marginBottom: 4, fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#C9A87C' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function StatsView({ bookings, salon, onUpgrade }) {
  const [period, setPeriod]       = useState(30);
  const [selectedEmp, setSelectedEmp] = useState(null);

  const now    = new Date();
  const today  = now.toISOString().split('T')[0];

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - period);
  const startStr = startDate.toISOString().split('T')[0];

  // Filtrare per perioadă + angajat selectat
  const filtered  = bookings
    .filter(b => b.date >= startStr && b.date <= today)
    .filter(b => !selectedEmp || b.employeeName === selectedEmp);

  const confirmed = filtered.filter(b => b.status === 'confirmed');
  const cancelled = filtered.filter(b => b.status === 'cancelled');
  const pending   = filtered.filter(b => b.status === 'pending');
  const revenue   = confirmed.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  const confirmRate = filtered.length > 0
    ? Math.round((confirmed.length / filtered.length) * 100) : 0;

  // Lista angajați pentru filter chips
  const allEmps = [...new Set(
    bookings
      .filter(b => b.date >= startStr && b.date <= today)
      .map(b => b.employeeName).filter(Boolean)
  )];

  // ── Trend data (bar + line) ──
  const chartDays = Math.min(period, 30);
  const trendData = Array.from({ length: chartDays }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (chartDays - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayBookings = bookings.filter(b => b.date === dateStr);
    return {
      label:     d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }),
      total:     dayBookings.filter(b => b.status !== 'cancelled').length,
      confirmate: dayBookings.filter(b => b.status === 'confirmed').length,
      anulate:   dayBookings.filter(b => b.status === 'cancelled').length,
    };
  });

  // ── Pie data (status) ──
  const pieData = [
    confirmed.length > 0 && { name: 'Confirmate', value: confirmed.length },
    pending.length   > 0 && { name: 'În așteptare', value: pending.length },
    cancelled.length > 0 && { name: 'Anulate',     value: cancelled.length },
  ].filter(Boolean);

  // ── Bar data (servicii) ──
  const svcCount = {};
  filtered.forEach(b => { if (b.serviceName) svcCount[b.serviceName] = (svcCount[b.serviceName] || 0) + 1; });
  const svcData = Object.entries(svcCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, value }));

  // ── Insights ──
  const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const dayCount = {};
  filtered.forEach(b => {
    if (b.date) {
      const day = dayNames[new Date(b.date + 'T12:00:00').getDay()];
      dayCount[day] = (dayCount[day] || 0) + 1;
    }
  });
  const topDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

  const hourCount = {};
  filtered.forEach(b => {
    if (b.timeSlot) {
      const h = b.timeSlot.split(':')[0] + ':00';
      hourCount[h] = (hourCount[h] || 0) + 1;
    }
  });
  const topHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];

  const empCount = {};
  filtered.forEach(b => { if (b.employeeName) empCount[b.employeeName] = (empCount[b.employeeName] || 0) + 1; });
  const topEmp = Object.entries(empCount).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="db-content db-stats-view">

      {/* Period */}
      <div className="db-stats-toolbar">
        {[7, 30, 90].map(p => (
          <button key={p} className={`db-stats-period ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p === 7 ? 'Ultima săptămână' : p === 30 ? 'Ultima lună' : 'Ultimele 3 luni'}
          </button>
        ))}
      </div>

      {/* Employee filter */}
      {allEmps.length > 1 && (
        <div className="db-emp-filter">
          <span className="db-emp-filter-label">Filtrează:</span>
          <button
            className={`db-emp-chip ${!selectedEmp ? 'active' : ''}`}
            onClick={() => setSelectedEmp(null)}
          >
            Toți angajații
          </button>
          {allEmps.map(emp => (
            <button
              key={emp}
              className={`db-emp-chip ${selectedEmp === emp ? 'active' : ''}`}
              onClick={() => setSelectedEmp(selectedEmp === emp ? null : emp)}
            >
              {emp}
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="db-kpi-grid">
        {[
          { num: filtered.length,   label: 'Total programări', color: '' },
          { num: confirmed.length,  label: 'Confirmate',       color: 'db-kpi-green' },
          { num: cancelled.length,  label: 'Anulate',          color: 'db-kpi-red' },
          { num: pending.length,    label: 'În așteptare',     color: '' },
          { num: `${confirmRate}%`, label: 'Rată confirmare',  color: 'db-kpi-green' },
          ...(revenue > 0 ? [{ num: `${revenue} lei`, label: 'Venit estimat', color: 'db-kpi-green' }] : []),
        ].map((k, i) => (
          <div key={i} className="db-kpi">
            <span className={`db-kpi-num ${k.color}`}>{k.num}</span>
            <span className="db-kpi-label">{k.label}</span>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="db-charts-row">

        {/* Trend Bar Chart */}
        <div className="db-chart-card db-chart-card-wide">
          <div className="db-chart-card-title">Programări pe zile</div>
          {filtered.length === 0 ? (
            <div className="db-stats-empty">Fără date în perioada selectată.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barSize={chartDays > 20 ? 6 : 12} margin={{ top: 16, right: 8, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(250,247,242,0.3)', fontSize: 10 }}
                  tickLine={false} axisLine={false}
                  interval={chartDays > 20 ? Math.floor(chartDays / 6) : 0}
                />
                <YAxis tick={{ fill: 'rgba(250,247,242,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,124,0.08)' }} />
                <Bar dataKey="confirmate" name="Confirmate" fill="#5de07a" radius={[2,2,0,0]} />
                <Bar dataKey="anulate"    name="Anulate"    fill="#f07a7a" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="db-chart-card">
          <div className="db-chart-card-title">Distribuție status</div>
          {pieData.length === 0 ? (
            <div className="db-stats-empty">Fără date.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={v => <span style={{ color: 'rgba(250,247,242,0.6)', fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="db-charts-row">

        {/* Line trend */}
        <div className="db-chart-card db-chart-card-wide">
          <div className="db-chart-card-title">Trend total programări</div>
          {filtered.length === 0 ? (
            <div className="db-stats-empty">Fără date.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData} margin={{ top: 16, right: 8, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(250,247,242,0.3)', fontSize: 10 }}
                  tickLine={false} axisLine={false}
                  interval={chartDays > 20 ? Math.floor(chartDays / 6) : 0}
                />
                <YAxis tick={{ fill: 'rgba(250,247,242,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="total" name="Total"
                  stroke="#C9A87C" strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: '#C9A87C' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar servicii */}
        <div className="db-chart-card">
          <div className="db-chart-card-title">Top servicii</div>
          {svcData.length === 0 ? (
            <div className="db-stats-empty">Fără date.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={svcData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
                <XAxis type="number" tick={{ fill: 'rgba(250,247,242,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(250,247,242,0.6)', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,124,0.08)' }} />
                <Bar dataKey="value" name="Programări" fill="#C9A87C" radius={[0,2,2,0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="db-insights-row">
        {[
          topDay  && { label: 'Ziua cea mai aglomerată', val: topDay[0],  sub: `${topDay[1]} programări` },
          topHour && { label: 'Ora cea mai cerută',       val: topHour[0], sub: `${topHour[1]} programări` },
          topEmp  && { label: 'Angajatul top',            val: topEmp[0],  sub: `${topEmp[1]} programări` },
          filtered.length > 0 && { label: 'Medie zilnică', val: `${(filtered.length / period).toFixed(1)}/zi`, sub: `în ${period} zile` },
        ].filter(Boolean).map((ins, i) => (
          <div key={i} className="db-insight-card">
            <div className="db-insight-card-val">{ins.val}</div>
            <div className="db-insight-card-label">{ins.label}</div>
            <div className="db-insight-card-sub">{ins.sub}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
function IconStats() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  );
}

// ── Settings View ──
const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

function SettingsView({ user, salon, setSalon, navigate, onUpgrade }) {
  const [tab, setTab]       = useState('info');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  const [info, setInfo] = useState({
    name:    salon?.name    || '',
    phone:   salon?.phone   || '',
    address: salon?.address || '',
    city:    salon?.city    || '',
  });

  const [services, setServices] = useState(
    salon?.services?.length ? salon.services : [{ name: '', duration: 60, price: '' }]
  );

  const [employees, setEmployees] = useState(
    salon?.employees?.length ? salon.employees : [{ name: '', role: '' }]
  );

  const [schedule, setSchedule] = useState(
    salon?.schedule || DAYS.reduce((acc, d) => ({
      ...acc, [d]: { open: d !== 'Duminică', from: '09:00', to: '19:00' }
    }), {})
  );

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload = tab === 'info'     ? { ...info }
                    : tab === 'servicii' ? { services }
                    : tab === 'angajati' ? { employees }
                    :                      { schedule };
      await updateDoc(doc(db, 'salons', user.uid), { ...payload, updatedAt: new Date().toISOString() });
      setSalon(prev => ({ ...prev, ...payload }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Eroare la salvare. Încearcă din nou.');
    } finally {
      setSaving(false);
    }
  }

  const updateSvc  = (i, f, v) => setServices(p  => p.map((s, idx) => idx === i ? { ...s, [f]: v } : s));
  const addSvc     = ()        => setServices(p  => [...p, { name: '', duration: 60, price: '' }]);
  const removeSvc  = (i)       => setServices(p  => p.filter((_, idx) => idx !== i));
  const updateEmp  = (i, f, v) => setEmployees(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));
  const addEmp     = () => {
    const plan = salon?.plan || 'free';
    if (!canAddEmployee(plan, employees.length)) {
      const limits = getPlanLimits(plan);
      setError(`Planul ${plan} permite maxim ${limits.maxEmployees} angajat${limits.maxEmployees > 1 ? 'i' : ''}. Upgrade pentru mai mulți.`);
      return;
    }
    setEmployees(p => [...p, { name: '', role: '' }]);
  };
  const removeEmp  = (i)       => setEmployees(p => p.filter((_, idx) => idx !== i));
  const toggleDay  = (d)       => setSchedule(p  => ({ ...p, [d]: { ...p[d], open: !p[d].open } }));
  const updateHour = (d, f, v) => setSchedule(p  => ({ ...p, [d]: { ...p[d], [f]: v } }));

  const TABS = [
    { id: 'info',     label: 'Informații' },
    { id: 'servicii', label: 'Servicii'   },
    { id: 'angajati', label: 'Angajați'   },
    { id: 'program',  label: 'Program'    },
  ];

  return (
    <div className="db-content">
      <div className="db-settings">

        {/* Plan banner */}
        <div className="db-plan-banner">
          <div className="db-plan-banner-left">
            <span className="db-plan-badge">{salon?.plan || 'Free'}</span>
            <span className="db-plan-desc">Link booking: </span>
            <a href={`/book/${salon?.slug}`} target="_blank" rel="noreferrer" className="db-plan-link">
              /book/{salon?.slug}
            </a>
          </div>
          <button className="db-upgrade-btn" onClick={onUpgrade}>
            Upgrade →
          </button>
        </div>

        {/* Tabs */}
        <div className="db-settings-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`db-settings-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => { setTab(t.id); setError(''); setSaved(false); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="db-settings-section">

          {/* INFO */}
          {tab === 'info' && (
            <div className="db-set-fields">
              {[
                { label: 'Numele salonului', key: 'name',    ph: 'Studio Lumière'  },
                { label: 'Telefon',          key: 'phone',   ph: '07xx xxx xxx'    },
                { label: 'Adresă',           key: 'address', ph: 'Str. Florilor 12'},
                { label: 'Oraș',             key: 'city',    ph: 'București'       },
              ].map(f => (
                <div key={f.key} className="db-set-field">
                  <label>{f.label}</label>
                  <input
                    value={info[f.key]}
                    onChange={e => setInfo(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.ph}
                  />
                </div>
              ))}
              <div className="db-set-field db-set-field-readonly">
                <label>Email cont</label>
                <input value={salon?.email || ''} readOnly />
              </div>
            </div>
          )}

          {/* SERVICII */}
          {tab === 'servicii' && (
            <>
              <div className="db-set-list">
                {services.map((s, i) => (
                  <div key={i} className="db-set-list-item">
                    <div className="db-set-list-fields">
                      <div className="db-set-field db-set-field-grow">
                        <label>Serviciu</label>
                        <input value={s.name} onChange={e => updateSvc(i, 'name', e.target.value)} placeholder="ex. Tuns + coafat" />
                      </div>
                      <div className="db-set-field db-set-field-sm">
                        <label>Durată (min)</label>
                        <input type="number" min="15" step="15" value={s.duration} onChange={e => updateSvc(i, 'duration', Number(e.target.value))} />
                      </div>
                      <div className="db-set-field db-set-field-sm">
                        <label>Preț (lei)</label>
                        <input type="number" min="0" value={s.price} onChange={e => updateSvc(i, 'price', e.target.value)} placeholder="150" />
                      </div>
                    </div>
                    {services.length > 1 && (
                      <button className="db-set-remove" onClick={() => removeSvc(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button className="db-set-add" onClick={addSvc}>+ Adaugă serviciu</button>
            </>
          )}

          {/* ANGAJAȚI */}
          {tab === 'angajati' && (
            <>
              {/* Banner limită plan */}
              {(() => {
                const plan = salon?.plan || 'free';
                const limits = getPlanLimits(plan);
                const atLimit = employees.length >= limits.maxEmployees;
                if (!atLimit) return null;
                return (
                  <div className="db-plan-limit-banner">
                    <span>
                      Ai atins limita de <strong>{limits.maxEmployees} angajat{limits.maxEmployees > 1 ? 'i' : ''}</strong> pentru planul <strong>{plan}</strong>.
                    </span>
                    <button className="db-upgrade-btn" onClick={onUpgrade}>
                      Upgrade →
                    </button>
                  </div>
                );
              })()}
              <div className="db-set-list">
                {employees.map((e, i) => (
                  <div key={i} className="db-set-list-item db-set-list-item-col">
                    <div className="db-set-list-fields">
                      <div className="db-set-field db-set-field-grow">
                        <label>Nume</label>
                        <input value={e.name} onChange={ev => updateEmp(i, 'name', ev.target.value)} placeholder="ex. Andreea" />
                      </div>
                      <div className="db-set-field db-set-field-grow">
                        <label>Rol</label>
                        <input value={e.role} onChange={ev => updateEmp(i, 'role', ev.target.value)} placeholder="ex. Stilist" />
                      </div>
                    </div>

                    {/* Servicii asignate */}
                    {services.filter(s => s.name.trim()).length > 0 && (
                      <div className="db-set-svc-assign">
                        <div className="db-set-svc-label">Servicii oferite</div>
                        <div className="db-set-svc-grid">
                          {services.filter(s => s.name.trim()).map((svc, j) => {
                            const checked = e.services?.includes(svc.name) || false;
                            return (
                              <button
                                key={j}
                                type="button"
                                className={`db-set-svc-chip ${checked ? 'selected' : ''}`}
                                onClick={() => {
                                  const current = e.services || [];
                                  const updated = checked
                                    ? current.filter(s => s !== svc.name)
                                    : [...current, svc.name];
                                  updateEmp(i, 'services', updated);
                                }}
                              >
                                {checked ? '✓ ' : ''}{svc.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {employees.length > 1 && (
                      <button className="db-set-remove db-set-remove-text" onClick={() => removeEmp(i)}>✕ Șterge angajat</button>
                    )}
                  </div>
                ))}
              </div>
              <button className="db-set-add" onClick={addEmp}>+ Adaugă angajat</button>
            </>
          )}

          {/* PROGRAM */}
          {tab === 'program' && (
            <div className="db-set-schedule">
              {DAYS.map(day => (
                <div key={day} className={`db-set-schedule-row ${!schedule[day]?.open ? 'closed' : ''}`}>
                  <button
                    className={`db-set-day-toggle ${schedule[day]?.open ? 'on' : 'off'}`}
                    onClick={() => toggleDay(day)}
                  >
                    <span className="db-set-toggle-track">
                      <span className="db-set-toggle-thumb" />
                    </span>
                    <span className="db-set-day-name">{day}</span>
                  </button>
                  {schedule[day]?.open ? (
                    <div className="db-set-hours">
                      <input type="time" value={schedule[day].from} onChange={e => updateHour(day, 'from', e.target.value)} />
                      <span>—</span>
                      <input type="time" value={schedule[day].to}   onChange={e => updateHour(day, 'to',   e.target.value)} />
                    </div>
                  ) : (
                    <span className="db-set-closed">Închis</span>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Save bar */}
        <div className="db-save-bar">
          {error && <span className="db-save-error">{error}</span>}
          {saved && <span className="db-save-ok">✓ Salvat cu succes</span>}
          <button className="db-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Se salvează...' : 'Salvează modificările'}
          </button>
        </div>

      </div>
    </div>
  );
}

function AllBookingsView({ bookings, onStatus }) {
  const [filter, setFilter]   = useState('toate');
  const [search, setSearch]   = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const statusLabel = { confirmed: 'Confirmat', pending: 'În așteptare', cancelled: 'Anulat' };
  const statusClass = { confirmed: 'db-status-confirmed', pending: 'db-status-pending', cancelled: 'db-status-cancelled' };

  const filtered = bookings
    .filter(b => {
      if (filter === 'confirmed') return b.status === 'confirmed';
      if (filter === 'pending')   return b.status === 'pending';
      if (filter === 'cancelled') return b.status === 'cancelled';
      return true;
    })
    .filter(b => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        b.clientName?.toLowerCase().includes(s) ||
        b.serviceName?.toLowerCase().includes(s) ||
        b.employeeName?.toLowerCase().includes(s) ||
        b.clientPhone?.includes(s) ||
        b.clientEmail?.toLowerCase().includes(s) ||
        b.date?.includes(s)
      );
    })
    .sort((a, b) => {
      const cmp = a.date !== b.date
        ? a.date.localeCompare(b.date)
        : (a.timeSlot || '').localeCompare(b.timeSlot || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="db-content">
      {/* Toolbar */}
      <div className="db-all-toolbar">
        <div className="db-all-filters">
          {[
            { id: 'toate',     label: `Toate (${bookings.length})` },
            { id: 'pending',   label: `În așteptare (${bookings.filter(b => b.status === 'pending').length})` },
            { id: 'confirmed', label: `Confirmate (${bookings.filter(b => b.status === 'confirmed').length})` },
            { id: 'cancelled', label: `Anulate (${bookings.filter(b => b.status === 'cancelled').length})` },
          ].map(f => (
            <button
              key={f.id}
              className={`db-all-filter ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="db-all-right">
          <input
            className="db-all-search"
            type="text"
            placeholder="Caută client, serviciu, telefon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="db-all-sort"
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          >
            {sortDir === 'desc' ? '↓ Cele mai noi' : '↑ Cele mai vechi'}
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="db-empty">
          <div className="db-empty-icon">◎</div>
          <p>Nicio programare găsită.</p>
        </div>
      ) : (
        <div className="db-all-table">
          <div className="db-all-thead">
            <span>Data & Ora</span>
            <span>Client</span>
            <span>Serviciu</span>
            <span>Stilist</span>
            <span>Contact</span>
            <span>Status</span>
            <span>Acțiuni</span>
          </div>
          {filtered.map(b => (
            <div key={b.id} className={`db-all-row ${b.status === 'cancelled' ? 'cancelled' : ''}`}>
              <div className="db-all-cell db-all-date">
                <span className="db-all-date-day">{formatDateShort(b.date)}</span>
                <span className="db-all-date-time">{b.timeSlot}</span>
              </div>
              <div className="db-all-cell">
                <span className="db-all-primary">{b.clientName}</span>
              </div>
              <div className="db-all-cell">
                <span className="db-all-primary">{b.serviceName}</span>
                <span className="db-all-secondary">{b.duration} min{b.price ? ` · ${b.price} lei` : ''}</span>
              </div>
              <div className="db-all-cell">
                <span className="db-all-primary">{b.employeeName}</span>
              </div>
              <div className="db-all-cell">
                {b.clientPhone && <span className="db-all-secondary">{b.clientPhone}</span>}
                {b.clientEmail && <span className="db-all-secondary">{b.clientEmail}</span>}
              </div>
              <div className="db-all-cell">
                <span className={`db-status ${statusClass[b.status]}`}>
                  {statusLabel[b.status]}
                </span>
              </div>
              <div className="db-all-cell db-all-actions">
                {b.status === 'pending' && (
                  <button className="db-btn-confirm" onClick={() => onStatus(b.id, 'confirmed')}>
                    Confirmă
                  </button>
                )}
                {b.status !== 'cancelled' && (
                  <button className="db-btn-cancel" onClick={() => onStatus(b.id, 'cancelled')}>
                    Anulează
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Copy Link Button ──
function CopyLinkButton({ slug }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button className={`db-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? '✓ Copiat!' : 'Copiază link booking'}
    </button>
  );
}


function formatDateFromStr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatDate(d) {
  return d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Icons ──
function IconList() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
    </svg>
  );
}
function IconToday() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  );
}
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { db } from '../firebase';
import './CancelBookingScreen.css';

export default function CancelBookingScreen() {
  const { bookingId } = useParams();

  const [booking, setBooking]   = useState(null);
  const [salon, setSalon]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [status, setStatus]     = useState('idle'); // idle | confirm | done | error | already

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'bookings', bookingId));
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() };
        setBooking(data);

        if (data.status === 'cancelled') {
          setStatus('already');
          setLoading(false);
          return;
        }

        // Load salon info
        const salonSnap = await getDoc(doc(db, 'salons', data.salonId));
        if (salonSnap.exists()) setSalon({ id: salonSnap.id, ...salonSnap.data() });

        setStatus('confirm');
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [bookingId]);

  async function handleCancel() {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status:      'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'client',
      });

      // Trimite email de confirmare anulare
      if (booking?.clientEmail) {
        const serviceId  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
        const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
        const publicKey  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
        if (serviceId && templateId && publicKey) {
          try {
            await emailjs.send(serviceId, templateId, {
              name:          booking.clientName,
              email:         booking.clientEmail,
              time:          booking.timeSlot,
              message:       'Programarea ta a fost anulată cu succes la cererea ta.',
              status:        'Anulat',
              messagecancel: '',
              client_name:   booking.clientName,
              client_email:  booking.clientEmail,
              salon_name:    salon?.name || '',
              service_name:  booking.serviceName,
              employee_name: booking.employeeName,
              date:          booking.date,
              time_slot:     booking.timeSlot,
              duration:      booking.duration,
              price:         booking.price || '',
              address:       salon?.address ? `${salon.address}, ${salon.city}` : '',
              phone:         salon?.phone || '',
              cancel_url:    '',
            }, publicKey);
          } catch {
            console.warn('Email anulare nu a putut fi trimis.');
          }
        }
      }

      setStatus('done');
    } catch {
      setStatus('error');
    }
    setLoading(false);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  if (loading) return (
    <div className="cb-page">
      <div className="cb-loading">Se încarcă...</div>
    </div>
  );

  if (notFound) return (
    <div className="cb-page">
      <div className="cb-card">
        <div className="cb-icon cb-icon-error">✕</div>
        <h2>Programare negăsită</h2>
        <p>Linkul de anulare nu este valid sau a expirat.</p>
      </div>
    </div>
  );

  return (
    <div className="cb-page">
      <div className="cb-logo">{salon?.name || 'Afrodita'}</div>

      <div className="cb-card">

        {status === 'confirm' && (
          <>
            <div className="cb-icon cb-icon-warn">!</div>
            <h2>Anulezi programarea?</h2>
            <p className="cb-sub">Această acțiune nu poate fi anulată.</p>

            <div className="cb-details">
              <div className="cb-detail-row">
                <span>Serviciu</span><span>{booking.serviceName}</span>
              </div>
              <div className="cb-detail-row">
                <span>Stilist</span><span>{booking.employeeName}</span>
              </div>
              <div className="cb-detail-row">
                <span>Data</span><span>{formatDate(booking.date)}</span>
              </div>
              <div className="cb-detail-row">
                <span>Ora</span><span>{booking.timeSlot}</span>
              </div>
            </div>

            <div className="cb-actions">
              <Link to={`/book/${salon?.slug}`} className="cb-btn-back">
                Păstrează programarea
              </Link>
              <button className="cb-btn-cancel" onClick={handleCancel}>
                Da, anulează
              </button>
            </div>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="cb-icon cb-icon-ok">✓</div>
            <h2>Programare anulată</h2>
            <p className="cb-sub">
              Programarea ta a fost anulată cu succes.
              {salon && <> Poți face o nouă programare oricând la <Link to={`/book/${salon.slug}`}>{salon.name}</Link>.</>}
            </p>
          </>
        )}

        {status === 'already' && (
          <>
            <div className="cb-icon cb-icon-warn">!</div>
            <h2>Deja anulată</h2>
            <p className="cb-sub">Această programare a fost deja anulată.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="cb-icon cb-icon-error">✕</div>
            <h2>A apărut o eroare</h2>
            <p className="cb-sub">Încearcă din nou sau contactează salonul direct.</p>
            {salon?.phone && <p className="cb-phone">{salon.phone}</p>}
          </>
        )}

      </div>

      <div className="cb-footer">
        Programări online cu <Link to="/">Afrodita</Link>
      </div>
    </div>
  );
}
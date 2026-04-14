import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { canAddEmployee, getPlanLimits } from '../utils/planLimits';
import './OnboardingScreen.css';

const STEPS = ['Salon', 'Servicii', 'Angajați', 'Program'];

const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

const DEFAULT_SCHEDULE = DAYS.reduce((acc, day) => ({
  ...acc,
  [day]: { open: day !== 'Duminică', from: '09:00', to: '19:00' }
}), {});

export default function OnboardingScreen() {
  const { user, salon, setSalon } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Step 1 — Info salon
  const [salonInfo, setSalonInfo] = useState({
    name: '', phone: '', address: '', city: '',
  });

  // Step 2 — Servicii
  const [services, setServices] = useState([
    { name: '', duration: 60, price: '' },
  ]);

  // Step 3 — Angajați
  const [employees, setEmployees] = useState([
    { name: '', role: '' },
  ]);

  // Step 4 — Program
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  // ── Navigare ──
  function goNext() {
    setError('');
    if (step === 0 && !salonInfo.name.trim()) {
      setError('Introdu numele salonului.'); return;
    }
    if (step === 1 && services.some(s => !s.name.trim())) {
      setError('Completează numele fiecărui serviciu.'); return;
    }
    if (step === 2 && employees.some(e => !e.name.trim())) {
      setError('Completează numele fiecărui angajat.'); return;
    }
    if (step < 3) { setStep(s => s + 1); return; }
    handleFinish();
  }

  function goBack() { setError(''); setStep(s => s - 1); }

  // ── Salvare finală ──
  async function handleFinish() {
    setSaving(true);
    setError('');
    try {
      const data = {
        ...salonInfo,
        services,
        employees,
        schedule,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'salons', user.uid), data);
      setSalon(prev => ({ ...prev, ...data }));
      navigate('/dashboard');
    } catch (err) {
      setError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setSaving(false);
    }
  }

  // ── Servicii helpers ──
  function updateService(i, field, val) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }
  function addService() {
    setServices(prev => [...prev, { name: '', duration: 60, price: '' }]);
  }
  function removeService(i) {
    if (services.length === 1) return;
    setServices(prev => prev.filter((_, idx) => idx !== i));
  }

  // ── Angajați helpers ──
  function updateEmployee(i, field, val) {
    setEmployees(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  }
  function addEmployee() {
    const plan = salon?.plan || 'free';
    if (!canAddEmployee(plan, employees.length)) {
      const limits = getPlanLimits(plan);
      setError(`Planul ${plan} permite maxim ${limits.maxEmployees} angajat${limits.maxEmployees > 1 ? 'i' : ''}. Upgrade pentru mai mulți.`);
      return;
    }
    setEmployees(prev => [...prev, { name: '', role: '' }]);
  }
  function removeEmployee(i) {
    if (employees.length === 1) return;
    setEmployees(prev => prev.filter((_, idx) => idx !== i));
  }

  // ── Program helpers ──
  function toggleDay(day) {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open }
    }));
  }
  function updateHour(day, field, val) {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: val }
    }));
  }

  return (
    <div className="ob-page">
      <div className="ob-glow" />

      {/* Logo */}
      <div className="ob-logo">Afrodita</div>

      {/* Progress */}
      <div className="ob-progress">
        {STEPS.map((label, i) => (
          <div key={i} className={`ob-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <div className="ob-step-dot">
              {i < step ? '✓' : i + 1}
            </div>
            <span className="ob-step-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="ob-card">

        {/* ── PASUL 1: Info salon ── */}
        {step === 0 && (
          <>
            <div className="ob-card-label">Pasul 1 din 4</div>
            <h2 className="ob-card-title">Despre salonul tău</h2>
            <div className="ob-fields">
              <div className="ob-field">
                <label>Numele salonului *</label>
                <input
                  type="text"
                  placeholder="ex. Studio Lumière"
                  value={salonInfo.name}
                  onChange={e => setSalonInfo(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="ob-field">
                <label>Telefon</label>
                <input
                  type="tel"
                  placeholder="07xx xxx xxx"
                  value={salonInfo.phone}
                  onChange={e => setSalonInfo(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="ob-field">
                <label>Adresă</label>
                <input
                  type="text"
                  placeholder="Str. Florilor 12"
                  value={salonInfo.address}
                  onChange={e => setSalonInfo(p => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="ob-field">
                <label>Oraș</label>
                <input
                  type="text"
                  placeholder="București"
                  value={salonInfo.city}
                  onChange={e => setSalonInfo(p => ({ ...p, city: e.target.value }))}
                />
              </div>
            </div>
          </>
        )}

        {/* ── PASUL 2: Servicii ── */}
        {step === 1 && (
          <>
            <div className="ob-card-label">Pasul 2 din 4</div>
            <h2 className="ob-card-title">Serviciile tale</h2>
            <div className="ob-list">
              {services.map((svc, i) => (
                <div key={i} className="ob-list-item">
                  <div className="ob-list-item-fields">
                    <div className="ob-field ob-field-grow">
                      <label>Serviciu *</label>
                      <input
                        type="text"
                        placeholder="ex. Tuns + coafat"
                        value={svc.name}
                        onChange={e => updateService(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className="ob-field ob-field-sm">
                      <label>Durată (min)</label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        value={svc.duration}
                        onChange={e => updateService(i, 'duration', Number(e.target.value))}
                      />
                    </div>
                    <div className="ob-field ob-field-sm">
                      <label>Preț (lei)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="150"
                        value={svc.price}
                        onChange={e => updateService(i, 'price', e.target.value)}
                      />
                    </div>
                  </div>
                  {services.length > 1 && (
                    <button className="ob-remove" onClick={() => removeService(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button className="ob-add" onClick={addService}>+ Adaugă serviciu</button>
          </>
        )}

        {/* ── PASUL 3: Angajați ── */}
        {step === 2 && (
          <>
            <div className="ob-card-label">Pasul 3 din 4</div>
            <h2 className="ob-card-title">Echipa ta</h2>
            <div className="ob-list">
              {employees.map((emp, i) => (
                <div key={i} className="ob-list-item ob-list-item-col">
                  <div className="ob-list-item-fields">
                    <div className="ob-field ob-field-grow">
                      <label>Nume *</label>
                      <input
                        type="text"
                        placeholder="ex. Andreea"
                        value={emp.name}
                        onChange={e => updateEmployee(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className="ob-field ob-field-grow">
                      <label>Rol</label>
                      <input
                        type="text"
                        placeholder="ex. Stilist, Manichiuristă"
                        value={emp.role}
                        onChange={e => updateEmployee(i, 'role', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Servicii asignate */}
                  {services.filter(s => s.name.trim()).length > 0 && (
                    <div className="ob-services-assign">
                      <div className="ob-services-assign-label">Servicii oferite</div>
                      <div className="ob-services-assign-grid">
                        {services.filter(s => s.name.trim()).map((svc, j) => {
                          const checked = emp.services?.includes(svc.name) || false;
                          return (
                            <button
                              key={j}
                              type="button"
                              className={`ob-svc-chip ${checked ? 'selected' : ''}`}
                              onClick={() => {
                                const current = emp.services || [];
                                const updated = checked
                                  ? current.filter(s => s !== svc.name)
                                  : [...current, svc.name];
                                updateEmployee(i, 'services', updated);
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
                    <button className="ob-remove ob-remove-standalone" onClick={() => removeEmployee(i)}>✕ Șterge</button>
                  )}
                </div>
              ))}
            </div>
            <button className="ob-add" onClick={addEmployee}>+ Adaugă angajat</button>
          </>
        )}

        {/* ── PASUL 4: Program ── */}
        {step === 3 && (
          <>
            <div className="ob-card-label">Pasul 4 din 4</div>
            <h2 className="ob-card-title">Programul de lucru</h2>
            <div className="ob-schedule">
              {DAYS.map(day => (
                <div key={day} className={`ob-schedule-row ${!schedule[day].open ? 'closed' : ''}`}>
                  <button
                    className={`ob-day-toggle ${schedule[day].open ? 'on' : 'off'}`}
                    onClick={() => toggleDay(day)}
                  >
                    <span className="ob-toggle-track">
                      <span className="ob-toggle-thumb" />
                    </span>
                    <span className="ob-day-name">{day}</span>
                  </button>
                  {schedule[day].open ? (
                    <div className="ob-hours">
                      <input
                        type="time"
                        value={schedule[day].from}
                        onChange={e => updateHour(day, 'from', e.target.value)}
                      />
                      <span className="ob-hours-sep">—</span>
                      <input
                        type="time"
                        value={schedule[day].to}
                        onChange={e => updateHour(day, 'to', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="ob-closed-label">Închis</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Error */}
        {error && <div className="ob-error">{error}</div>}

        {/* Actions */}
        <div className="ob-actions">
          {step > 0 && (
            <button className="ob-btn-back" onClick={goBack}>← Înapoi</button>
          )}
          <button className="ob-btn-next" onClick={goNext} disabled={saving}>
            {saving ? 'Se salvează...' : step === 3 ? 'Finalizează ✓' : 'Continuă →'}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useNavigate } from 'react-router-dom';
import './LegalScreen.css';

export default function TermeniScreen() {
  const navigate = useNavigate();
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <button className="legal-back" onClick={() => navigate('/')}>← Înapoi</button>
        <span className="legal-logo">Afrodita</span>
      </nav>
      <div className="legal-content">
        <div className="legal-label">Document legal</div>
        <h1 className="legal-title">Termeni și Condiții</h1>
        <p className="legal-meta">Ultima actualizare: Aprilie 2026</p>

        <div className="legal-body">

          <h2>1. Acceptarea termenilor</h2>
          <p>Prin accesarea și utilizarea platformei Afrodita (<strong>afroditalive.ro</strong>), ești de acord cu acești termeni și condiții. Dacă nu ești de acord, te rugăm să nu utilizezi platforma.</p>

          <h2>2. Descrierea serviciului</h2>
          <p>Afrodita este o platformă SaaS de gestionare a programărilor pentru saloane de înfrumusețare. Oferim instrumente pentru:</p>
          <ul>
            <li>Booking online pentru clienți</li>
            <li>Dashboard de management pentru saloane</li>
            <li>Notificări automate prin email și SMS</li>
            <li>Statistici și rapoarte</li>
          </ul>

          <h2>3. Conturi și înregistrare</h2>
          <p>Pentru a utiliza platforma, trebuie să creezi un cont cu informații corecte și complete. Ești responsabil pentru securitatea contului tău și pentru toate activitățile care au loc în cadrul acestuia.</p>

          <h2>4. Planuri și plăți</h2>
          <p>Afrodita oferă planuri gratuite și cu plată. Plățile pentru planurile premium sunt procesate prin Stripe și sunt nerambursabile, cu excepția cazurilor prevăzute de lege. Poți anula abonamentul oricând, iar accesul rămâne activ până la sfârșitul perioadei plătite.</p>

          <h2>5. Utilizare acceptabilă</h2>
          <p>Ești de acord să nu folosești platforma pentru activități ilegale, să nu interferezi cu funcționarea serviciului și să nu transmiți conținut dăunător sau ofensator.</p>

          <h2>6. Date și confidențialitate</h2>
          <p>Colectăm și procesăm datele conform <a href="/confidentialitate">Politicii de Confidențialitate</a>. Datele clienților tăi sunt stocate în siguranță și nu sunt partajate cu terți fără consimțământul tău.</p>

          <h2>7. Disponibilitate și întreruperi</h2>
          <p>Ne străduim să menținem platforma disponibilă 24/7, dar nu garantăm o disponibilitate neîntreruptă. Ne rezervăm dreptul de a întrerupe temporar serviciul pentru mentenanță.</p>

          <h2>8. Limitarea răspunderii</h2>
          <p>Afrodita nu este responsabilă pentru pierderi indirecte, incidentale sau consecvente rezultate din utilizarea platformei. Răspunderea noastră totală nu va depăși suma plătită de tine în ultimele 3 luni.</p>

          <h2>9. Modificări</h2>
          <p>Ne rezervăm dreptul de a modifica acești termeni. Te vom notifica prin email cu cel puțin 30 de zile înainte de intrarea în vigoare a modificărilor semnificative.</p>

          <h2>10. Contact</h2>
          <p>Pentru întrebări legate de acești termeni, ne poți contacta la <a href="mailto:afroditaenterprise@gmail.com">afroditaenterprise@gmail.com</a>.</p>

        </div>
      </div>
    </div>
  );
}
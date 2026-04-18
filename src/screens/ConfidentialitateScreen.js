import { useNavigate } from 'react-router-dom';
import './LegalScreen.css';

export default function ConfidentialitateScreen() {
  const navigate = useNavigate();
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <button className="legal-back" onClick={() => navigate('/')}>← Înapoi</button>
        <span className="legal-logo">Afrodita</span>
      </nav>
      <div className="legal-content">
        <div className="legal-label">Document legal</div>
        <h1 className="legal-title">Politica de Confidențialitate</h1>
        <p className="legal-meta">Ultima actualizare: Aprilie 2026</p>

        <div className="legal-body">

          <h2>1. Cine suntem</h2>
          <p>Afrodita (<strong>afroditalive.ro</strong>) este o platformă de booking online pentru saloane de înfrumusețare. Suntem operatorul datelor cu caracter personal colectate prin intermediul platformei noastre.</p>

          <h2>2. Ce date colectăm</h2>
          <p><strong>Pentru saloane (utilizatori înregistrați):</strong></p>
          <ul>
            <li>Nume, email, număr de telefon</li>
            <li>Informații despre salon (adresă, oraș, servicii, angajați)</li>
            <li>Date de plată (procesate și stocate de Stripe — noi nu stocăm datele cardului)</li>
          </ul>
          <p><strong>Pentru clienții salonului (la programare):</strong></p>
          <ul>
            <li>Nume, număr de telefon, adresă de email (opțional)</li>
            <li>Detalii programare (serviciu, dată, oră)</li>
          </ul>

          <h2>3. Cum folosim datele</h2>
          <ul>
            <li>Furnizarea și îmbunătățirea serviciilor platformei</li>
            <li>Trimiterea confirmărilor și reminderelor de programare</li>
            <li>Procesarea plăților pentru abonamente</li>
            <li>Comunicări legate de cont și servicii</li>
          </ul>

          <h2>4. Temeiul legal al prelucrării</h2>
          <p>Prelucrăm datele în baza:</p>
          <ul>
            <li>Executării contractului (furnizarea serviciului)</li>
            <li>Consimțământului (notificări marketing)</li>
            <li>Interesului legitim (securitate, prevenirea fraudei)</li>
          </ul>

          <h2>5. Partajarea datelor</h2>
          <p>Nu vindem datele tale. Le partajăm doar cu:</p>
          <ul>
            <li><strong>Stripe</strong> — procesare plăți</li>
            <li><strong>Firebase / Google</strong> — stocare date și autentificare</li>
            <li><strong>Twilio</strong> — trimitere SMS</li>
            <li><strong>EmailJS</strong> — trimitere emailuri</li>
          </ul>
          <p>Toți furnizorii noștri respectă GDPR.</p>

          <h2>6. Stocare și securitate</h2>
          <p>Datele sunt stocate pe servere securizate în Europa (Firebase EU). Folosim conexiuni criptate (HTTPS) și autentificare securizată pentru toate operațiunile.</p>

          <h2>7. Retenția datelor</h2>
          <p>Păstrăm datele cât timp contul este activ. La ștergerea contului, datele sunt eliminate în maxim 30 de zile, cu excepția celor necesare obligațiilor legale.</p>

          <h2>8. Drepturile tale (GDPR)</h2>
          <p>Ai dreptul la:</p>
          <ul>
            <li>Acces la datele tale</li>
            <li>Rectificarea datelor incorecte</li>
            <li>Ștergerea datelor ("dreptul de a fi uitat")</li>
            <li>Portabilitatea datelor</li>
            <li>Opoziția față de prelucrare</li>
          </ul>
          <p>Pentru exercitarea acestor drepturi, contactează-ne la <a href="mailto:contact@afroditalive.ro">contact@afroditalive.ro</a>.</p>

          <h2>9. Cookie-uri</h2>
          <p>Folosim cookie-uri esențiale pentru funcționarea platformei (autentificare, sesiune). Nu folosim cookie-uri de tracking sau publicitate.</p>

          <h2>10. Contact</h2>
          <p>Responsabil cu protecția datelor: <a href="mailto:contact@afroditalive.ro">contact@afroditalive.ro</a></p>
          <p>Ai dreptul să depui o plângere la <strong>ANSPDCP</strong> (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal) dacă consideri că datele tale sunt prelucrate incorect.</p>

        </div>
      </div>
    </div>
  );
}
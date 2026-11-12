<script lang="ts">
    import vscht from '$lib/images/logoVSCHT.svg';
    import lf1 from '$lib/images/logo1LF.svg';
    import lf1Dark from '$lib/images/logo1LF_dark.svg';
    import PrusaSlicerPluginNote from '$lib/components/PrusaSlicerPluginNote.svelte';
</script>

<style>
  section.about {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    line-height: 1.6;
    color: #333;
  }
  .about h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  .about h2 {
    font-size: 1.75rem;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }
  .about p {
    margin-bottom: 1rem;
  }
  .highlight {
    color: #0070f3;
    font-weight: bold;
  }
  .tech-list {
    list-style: none;
    padding: 0;
  }
  .tech-list li {
    margin-bottom: 0.5rem;
  }

  /* --- NEW STYLES FOR LOGOS --- */
  .logos-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3rem;
    margin-top: 1.5rem;
    padding: 1rem 0;
  }

  .logo {
    height: 75px;
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: grayscale(60%);
    opacity: 0.9;
  }

  .logo:hover {
    transform: scale(1.05);
    filter: grayscale(0%);
    opacity: 1;
  }
  /* -------------------------- */

  /* Dark mode: VŠCHT logo is a plain monochrome mark → invert it.
     1. LF logo must NOT be inverted (pelican stays light per the LF1 logo manual) → swap to dedicated dark variant. */
  .logo-dark {
    display: none;
  }
  :global(html.dark) .logo-light {
    display: none;
  }
  :global(html.dark) .logo-dark {
    display: inline;
  }
  :global(html.dark) .logo-vscht {
    filter: grayscale(60%) invert(1);
  }
  :global(html.dark) .logo-vscht:hover {
    filter: invert(1);
  }
</style>

<section class="about">
  <h1>Über das Projekt</h1>

  <h2>Wer wir sind</h2>
  <p>
    Das Projekt ist das Ergebnis einer <strong>Zusammenarbeit von akademischen Einrichtungen und Studierenden</strong>.
    Diese Partnerschaft von Fachleuten aus <em>Medizin</em>, <em>Biochemie</em>, <em>Informatik</em> und
    <em>Didaktik</em> sorgt dafür, dass das Werkzeug <strong>methodisch wie technisch ausgewogen</strong> ist.
  </p>
  <p>
    Das Projekt ist eine gemeinsame Arbeit von:
    <br>
    • <strong>Lehrstuhl für Didaktik der Chemie und Geisteswissenschaften, Universität für Chemie und Technologie Prag (UCT Prag)</strong>
    <br>
    • <strong>Erste Medizinische Fakultät, Karls-Universität</strong>
  </p>

  <div class="logos-container">
    <a href="https://kuhv.vscht.cz" target="_blank" rel="noopener noreferrer" title="Lehrstuhl für Didaktik der Chemie und Geisteswissenschaften, UCT Prag">
      <img src={vscht} alt="Logo des Lehrstuhls für Didaktik der Chemie und Geisteswissenschaften, UCT Prag" height="75" class="logo logo-vscht">
    </a>
    <a href="https://www.lf1.cuni.cz" target="_blank" rel="noopener noreferrer" title="Erste Medizinische Fakultät, Karls-Universität">
      <img src={lf1} alt="Logo der Ersten Medizinischen Fakultät, Karls-Universität" height="75" class="logo logo-light">
      <img src={lf1Dark} alt="Logo der Ersten Medizinischen Fakultät, Karls-Universität" height="75" class="logo logo-dark">
    </a>
  </div>

  <h2>Warum es entstanden ist</h2>
  <p>
    Wir sind überzeugt: Um <strong>die Gestalt von Molekülen</strong>, <strong>räumliche Wechselwirkungen</strong>
    und <strong>die Eigenschaften bioorganischer Moleküle</strong> wirklich zu verstehen, braucht es
    <em>intuitiv verständliche 3D-Modelle</em>. Digitale Visualisierung ist hilfreich, aber oft begrenzt –
    sie erfordert spezielle Software und eignet sich nur bedingt für den <em>Unterricht</em> oder die <em>Vorführung am realen Objekt</em>.
    Molekülmodelle aus Baukästen zusammenzusetzen ist <strong>zeitaufwendig und technisch anspruchsvoll</strong>,
    und die Vorbereitung druckbarer Modelle kann kompliziert sein. Deshalb ist unser Projekt entstanden –
    um den <strong>3D-Druck von Molekülen</strong> <em>zugänglicher, schneller und benutzerfreundlicher</em> zu machen.
  </p>

  <h2>Geschichte und Entwicklung</h2>
  <p>
    Der erste Prototyp der Anwendung entstand 2023 als Terminal-Skript für die Anwendung <em>PyMOL</em> und entwickelte sich über mehrere Iterationen in <em>Python</em> schrittweise zum Konzept einer Webanwendung. Das Projekt wurde sogar an der Ersten Medizinischen Fakultät der Karls-Universität gewürdigt und auf der <a href="https://www.lf1.cuni.cz/25-rocnik-svk-a-vpz-uz-znaji-sve-viteze" target="_blank" rel="noopener noreferrer">25. Studentischen Wissenschaftskonferenz (SVK)</a> ausgezeichnet.
  </p>

  <h2>Was es kann</h2>
  <p>
    Mit unserer Anwendung können Sie:
  </p>
  <ul class="tech-list">
    <li><strong>Moleküldaten automatisch importieren</strong> aus Diensten wie <em>PubChem</em></li>
    <li><strong>Eigene Dateien hochladen</strong> (<code>.sdf</code>)</li>
    <li><strong>3D-Modelle erzeugen</strong> in verschiedenen Darstellungen</li>
    <li><strong>Atome farblich kennzeichnen</strong> und die <em>Modellqualität</em> wählen</li>
    <li><strong>Modelle für den Druck optimieren</strong> und für Slicer exportieren (z. B. <em>PrusaSlicer</em>)</li>
    <li><strong>Mehrfarbigen 3D-Druck</strong> von Molekülmodellen nutzen</li>
  </ul>
  <p>
    Dank der Anwendung verkürzt sich der Weg von den Moleküldaten zum druckbaren Modell auf
    <strong>wenige Minuten</strong> – deutlich effizienter als bei
    <em>manueller Bearbeitung</em>.
  </p>

  <PrusaSlicerPluginNote />

  <h2>Technische Grundlagen</h2>
  <ul class="tech-list">
    <li>Sprache: <span class="highlight">TypeScript</span></li>
    <li>GUI: <em>SvelteKit</em>, <em>Bootstrap</em></li>
    <li>Datenintegration: Anbindung an öffentliche Datenbanken (<em>PubChem</em>, <em>COD</em>)</li>
    <li>Darstellungen: <em>Van-der-Waals</em> (Kalottenmodell, <em>Spheres</em>), <em>Ball-and-Stick</em>, <em>Stick</em></li>
    <li>Optimierung: Steuerung des Detailgrads, Ergänzen von Wasserstoffatomen, Nachbearbeitung des Modells und mehr …</li>
    <li>Exportformate: druckfertige Formate für Slicer</li>
  </ul>

  <p style="margin-top: 2rem; text-align: center;">
    Unser Ziel ist es, den <strong>3D-Druck von Molekülen</strong> möglichst vielen Menschen zugänglich zu machen –
    <em>Studierenden, Forschenden und Lehrkräften</em> gleichermaßen.
  </p>
</section>

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
  <h1>À propos du projet</h1>

  <h2>Qui sommes-nous ?</h2>
  <p>
    Le projet est le fruit d’une <strong>collaboration entre des établissements universitaires et des étudiants</strong>.
    Ce partenariat d’experts en <em>médecine</em>, en <em>biochimie</em>, en <em>informatique</em> et en
    <em>pédagogie</em> garantit un outil <strong>équilibré sur les plans méthodologique et technique</strong>.
  </p>
  <p>
    Le projet est mené conjointement par :
    <br>
    • <strong>le Département de didactique de la chimie et de sciences humaines, Université de chimie et de technologie de Prague (UCT Prague)</strong>
    <br>
    • <strong>la Première faculté de médecine, Université Charles</strong>
  </p>

  <div class="logos-container">
    <a href="https://kuhv.vscht.cz" target="_blank" rel="noopener noreferrer" title="Département de didactique de la chimie et de sciences humaines, UCT Prague">
      <img src={vscht} alt="Logo du Département de didactique de la chimie et de sciences humaines, UCT Prague" height="75" class="logo logo-vscht">
    </a>
    <a href="https://www.lf1.cuni.cz" target="_blank" rel="noopener noreferrer" title="Première faculté de médecine, Université Charles">
      <img src={lf1} alt="Logo de la Première faculté de médecine, Université Charles" height="75" class="logo logo-light">
      <img src={lf1Dark} alt="Logo de la Première faculté de médecine, Université Charles" height="75" class="logo logo-dark">
    </a>
  </div>

  <h2>Pourquoi ce projet ?</h2>
  <p>
    Nous sommes convaincus que, pour vraiment <strong>comprendre la forme des molécules</strong>, les <strong>interactions spatiales</strong>
    et <strong>les propriétés des molécules bioorganiques</strong>, il est essentiel de travailler avec des
    <em>modèles 3D faciles à appréhender</em>. La visualisation numérique est utile, mais souvent limitée :
    elle nécessite des logiciels spécialisés et n’est pas idéale pour l’<em>enseignement</em> ni pour la <em>démonstration physique</em>.
    Construire des modèles moléculaires avec des boîtes de modèles est <strong>long et techniquement exigeant</strong>,
    et préparer des modèles imprimables peut s’avérer compliqué. C’est pourquoi notre projet est né :
    rendre l’<strong>impression 3D de molécules</strong> plus <em>accessible, plus rapide et plus simple</em>.
  </p>

  <h2>Historique et développement</h2>
  <p>
    Le premier prototype de l’application a vu le jour en 2023 sous la forme d’un script en ligne de commande pour le logiciel <em>PyMOL</em>, puis, au fil de plusieurs itérations en <em>Python</em>, il a évolué vers le concept d’une application web. Le projet a même été distingué à la Première faculté de médecine de l’Université Charles, où il a reçu un prix lors de la <a href="https://www.lf1.cuni.cz/25-rocnik-svk-a-vpz-uz-znaji-sve-viteze" target="_blank" rel="noopener noreferrer">25<sup>e</sup> Conférence scientifique étudiante (SVK)</a>.
  </p>

  <h2>Ce que permet l’application</h2>
  <p>
    Notre application vous permet de :
  </p>
  <ul class="tech-list">
    <li><strong>importer automatiquement</strong> des données moléculaires depuis des services comme <em>PubChem</em> ;</li>
    <li><strong>importer vos propres fichiers</strong> (<code>.sdf</code>) ;</li>
    <li><strong>générer des modèles 3D</strong> selon différentes représentations ;</li>
    <li><strong>colorer les atomes</strong> et choisir la <em>qualité du modèle</em> ;</li>
    <li><strong>optimiser les modèles pour l’impression</strong> et les exporter vers des trancheurs (p. ex. <em>PrusaSlicer</em>) ;</li>
    <li><strong>imprimer en 3D et en plusieurs couleurs</strong> des modèles moléculaires.</li>
  </ul>
  <p>
    Grâce à l’application, le temps nécessaire pour passer des données moléculaires à un modèle imprimable
    se réduit à <strong>quelques minutes</strong> — bien plus efficace qu’un
    <em>traitement manuel</em>.
  </p>

  <PrusaSlicerPluginNote />

  <h2>Bases techniques</h2>
  <ul class="tech-list">
    <li>Langage : <span class="highlight">TypeScript</span></li>
    <li>Interface : <em>SvelteKit</em>, <em>Bootstrap</em></li>
    <li>Intégration des données : connexion aux bases de données publiques (<em>PubChem</em>, <em>COD</em>)</li>
    <li>Représentations : <em>van der Waals</em> (modèle compact, <em>Spheres</em>), <em>Ball-and-Stick</em> (boules et bâtonnets), <em>Stick</em> (bâtonnets)</li>
    <li>Optimisation : contrôle du niveau de détail, ajout des hydrogènes, finition du modèle, et plus encore…</li>
    <li>Sorties d’export : formats prêts à imprimer pour les trancheurs</li>
  </ul>

  <p style="margin-top: 2rem; text-align: center;">
    Notre objectif : rendre l’<strong>impression 3D moléculaire</strong> accessible au plus grand nombre —
    <em>étudiants, chercheurs et enseignants</em>.
  </p>
</section>

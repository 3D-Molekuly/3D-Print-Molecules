<script lang="ts">
    import vscht from '$lib/images/logoVSCHT.svg';
    import lf1 from '$lib/images/logo1LF.svg';
    import lf1Dark from '$lib/images/logo1LF_dark.svg';
    import PrusaSlicerPluginNote from '$lib/components/PrusaSlicerPluginNote.svelte';
</script>

<style>
  section {
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

  /* --- NOVÉ STYLY PRO LOGA --- */
  .logos-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3rem; /* Mezera mezi logy */
    margin-top: 1.5rem;
    padding: 1rem 0;
  }

  .logo {
    height: 75px; /* Upravte výšku podle potřeby */
    transition: transform 0.3s ease, filter 0.3s ease;
    /* Efekt pro sjednocení barevnosti, při najetí myší bude barevné */
    filter: grayscale(60%);
    opacity: 0.9;
  }

  .logo:hover {
    transform: scale(1.05); /* Mírné zvětšení při najetí myší */
    filter: grayscale(0%); /* Plná barva při najetí */
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
  <h1>O projektu</h1>

  <h2>Kdo jsme</h2>
  <p>
    Projekt je dílem <strong>spolupráce mezi akademickými pracovišti a studenty</strong>.
    Toto spojení odborníků z <em>medicíny</em>, <em>biochemie</em>, <em>výpočetní techniky</em> a
    <em>vzdělávání</em> zaručuje, že nástroj je <strong>metodologicky i technicky vyvážený</strong>.
  </p>
  <p>
    Projekt je dílem <strong>spolupráce mezi akademickými pracovišti a studenty</strong>:
    <br>
    • <strong>Ústav učitelství chemie a humanitních věd VŠCHT Praha</strong>
    <br>
    • <strong>1. lékařská fakulta Univerzity Karlovy</strong>
  </p>
    <div class="logos-container">
        <a href="https://kuhv.vscht.cz" target="_blank" rel="noopener noreferrer" title="Ústav učitelství chemie a humanitních věd VŠCHT Praha">
            <img src={vscht} alt="Logo Ústavu učitelství chemie a humanitních věd VŠCHT Praha" height="75" class="logo logo-vscht">
        </a>
        <a href="https://www.lf1.cuni.cz" target="_blank" rel="noopener noreferrer" title="1. lékařská fakulta Univerzity Karlovy">
            <img src={lf1} alt="Logo 1. lékařské fakulty Univerzity Karlovy" height="75" class="logo logo-light">
            <img src={lf1Dark} alt="Logo 1. lékařské fakulty Univerzity Karlovy" height="75" class="logo logo-dark">
        </a>
    </div>

  <h2>Proč vznikl</h2>
  <p>
    Věříme, že pro <strong>porozumění tvaru</strong>, <strong>prostorovým interakcím</strong>
    a <strong>vlastnostem bioorganických molekul</strong> je klíčové mít možnost
    pracovat s <em>jednoduše srozumitelnými 3D modely</em>. Digitální vizualizace
    je užitečná, ale často omezená – vyžaduje specializovaný software
    a není ideální pro <em>výuku</em> či <em>fyzickou demonstraci</em>. Tvorba fyzických
    modelů molekul pomocí stavebnic je <strong>časově i technicky náročná</strong>,
    a příprava tisknutelných modelů bývá složitá. Proto vznikl náš projekt:
    udělat <strong>3D tisk molekul</strong> <em>dostupnějším, rychlejším a přívětivým</em>.
  </p>

  <h2>Historie a vývoj</h2>
  <p>
    První prototyp aplikace vznikl v roce 2023 jakožto skript v terminálu pro aplikaci <em>PyMOL</em> a postupně se přes pár iterací v <em>Pythonu</em> přesunul do konceptu webové aplikace. Projekt byl navíc oceněn na půdě 1. LF UK v rámci <a href="https://www.lf1.cuni.cz/25-rocnik-svk-a-vpz-uz-znaji-sve-viteze" target="_blank" rel="noopener noreferrer">25. ročníku Studentské vědecké konference (SVK)</a>.
  </p>

  <h2>Co umí</h2>
  <p>
    Naše aplikace umožňuje:
  </p>
  <ul class="tech-list">
    <li><strong>Automatický import</strong> molekulárních dat ze služeb jako <em>PubChem</em></li>
    <li><strong>Nahrání vlastních souborů</strong> (<code>.sdf</code>)</li>
    <li><strong>Generování 3D modelu</strong> ve různých reprezentacích</li>
    <li><strong>Barevné rozlišení atomů</strong> a možnost volby <em>kvality modelu</em></li>
    <li><strong>Optimalizaci modelu pro tisk</strong> a export pro slicery (např. <em>PrusaSlicer</em>)</li>
    <li><strong>Podpora vícebarevného 3D tisku</strong> modelů molekul</li>
  </ul>
  <p>
    Díky aplikaci lze zkrátit dobu přípravy tiskového modelu z
    molekulárních dat na <strong>jednotky minut</strong> – výrazně efektivněji než
    při <em>manuálním zpracování</em>.
  </p>

  <PrusaSlicerPluginNote />

  <h2>Technické základy</h2>
  <ul class="tech-list">
    <li>Jazyk: <span class="highlight">TypeScript</span></li>
    <li>GUI: <em>SvelteKit</em>, <em>Bootstrap</em></li>
    <li>Datová integrace: propojení s veřejnými databázemi (<em>PubChem</em>, <em>COD</em>)</li>
    <li>Reprezentace: <em>van der Waals</em> (space-filling, <em>Speheres</em>), <em>Ball-and-Stick</em>, <em>Stick</em></li>
    <li>Optimalizace: nastavení detailu, přidání atomů vodíku, jemnost modelu a další...</li>
    <li>Export výstupů: tiskové formáty připravené pro slicery</li>
  </ul>

  <p style="margin-top: 2rem; text-align: center;">
    Cílem je zpřístupnit <strong>3D tisk molekul</strong> co největšímu publiku — <em>studentům, výzkumníkům i pedagogům</em>.
  </p>
</section>
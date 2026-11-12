<script lang="ts">
    import { onMount } from 'svelte';
    import PrusaSlicerPluginNote from '$lib/components/PrusaSlicerPluginNote.svelte';

    // --- MAIN STEP IMAGES ---
    import step1Img from '$lib/images/step1.png';
    import step2Img from '$lib/images/step2.png';
    import step3Img from '$lib/images/step3.png';
    import step4Img from '$lib/images/step4.png';
    import step5Img from '$lib/images/step5.png'; 
    import drawImg from '$lib/images/draw-2d-3d-en.png';

    // --- INTERACTIVE GALLERY IMAGES (from settings folder) ---
    import co2BasImg from '$lib/images/settings/co2-bas.png';
    import co2MultImg from '$lib/images/settings/co2-mult.png';
    import waterBasImg from '$lib/images/settings/water-bas.png';
    import waterUniformImg from '$lib/images/settings/water-uniform.png';
    import waterGroupImg from '$lib/images/settings/water-group.png';
    import waterMultImg from '$lib/images/settings/water-mult.png';
    import waterBondDiaImg from '$lib/images/settings/water-bond-dia.png';
    import sphereQ50Img from '$lib/images/settings/sphere-q50.png';
    import sphereQ5Img from '$lib/images/settings/sphere-q5.png';
    import sphereHoffImg from '$lib/images/settings/sphere-h-off.png';

    // --- INTERACTIVE GALLERY DATA ---
    const settingsOptions = [
        {
            name: "Standard-Netzqualität (Qualität: 50)",
            img: sphereQ50Img,
            desc: "Standardeinstellung für ein schönes, glattes Kugelmodell."
        },
        {
            name: "Niedrige Qualität (Qualität: 5)",
            img: sphereQ5Img,
            desc: "Reduziert die Anzahl der Polygone deutlich. Geeignet für einen bewussten „Low-Poly“-Look oder eine schnellere Darstellung sehr großer Moleküle."
        },
        {
            name: "Wasserstoffatome ausblenden",
            img: sphereHoffImg,
            desc: "Schaltet die Anzeige der Wasserstoffatome aus, was komplexe organische Moleküle stark vereinfachen kann."
        },
        {
            name: "Standard-Kugel-Stab-Modell",
            img: waterBasImg,
            desc: "Grunddarstellung eines Wassermoleküls im Kugel-Stab-Modus (Ball-and-Stick)."
        },
        {
            name: "Mehrfachbindungen anzeigen",
            img: co2MultImg,
            desc: "Stellt beim Kohlenstoffdioxid (CO2) die Doppelbindungen zwischen Kohlenstoff und Sauerstoff dar (statt der standardmäßigen Einfachbindung)."
        },
        {
            name: "Einheitlicher Atomdurchmesser",
            img: waterUniformImg,
            desc: "Vereinheitlicht die Größe aller Atome im Modell unabhängig von ihrem tatsächlichen Van-der-Waals-Radius."
        },
        {
            name: "Bindungen separat gruppieren",
            img: waterGroupImg,
            desc: "Trennt die Bindungen beim Export in eigene Teile, was das Einfärben und die Vorbereitung für den mehrfarbigen 3D-Druck erleichtert."
        },
        {
            name: "Größerer Maßstab (Skalierungsfaktor: 1,5)",
            img: waterMultImg,
            desc: "Vergrößert das Gesamtvolumen und die Durchmesser der Elemente des Modells für ein massiveres physisches Ergebnis."
        },
        {
            name: "Bindungsstärke (Bindungsdurchmesser: 0,6)",
            img: waterBondDiaImg,
            desc: "Verdickt die Verbindungsstäbe zwischen den Atomen, damit das gedruckte Modell mechanisch stabiler wird."
        }
    ];

    // Default selected option in the gallery
    let activeOption = settingsOptions[0];

    // --- TABLE OF CONTENTS (IDs match the sections below) ---
    const tocItems = [
        { id: 'step-1', label: 'Schritt 1: Molekül auswählen' },
        { id: 'advanced-search', label: 'Erweiterte Suche' },
        { id: 'step-2', label: 'Schritt 2: Benutzeroberfläche' },
        { id: 'step-3', label: 'Schritt 3: Darstellungsart' },
        { id: 'step-4', label: 'Schritt 4: Parameter und Export' },
        { id: 'step-5', label: 'Schritt 5: Änderungen übernehmen (Neu laden)' },
        { id: 'sharing', label: 'Teilen per URL' },
        { id: 'offline-pwa', label: 'Offline und Installation (PWA)' },
        { id: 'slicer-import', label: 'Import in den Slicer' },
        { id: 'ready-models', label: 'Druckfertige Modelle' }
    ];

    // Expanded on desktop (landscape), collapsed on phones (portrait)
    const TOC_EXPANDED_QUERY = '(min-width: 992px) and (orientation: landscape)';
    let tocOpen = false;

    // Which tutorial blocks are expanded (core steps open by default)
    const OPEN_BY_DEFAULT = new Set(['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'slicer-import', 'ready-models']);
    let sectionOpen: Record<string, boolean> = Object.fromEntries(
        tocItems.map((item) => [item.id, OPEN_BY_DEFAULT.has(item.id)])
    );
    $: allSectionsOpen = tocItems.every((item) => sectionOpen[item.id]);

    function toggleAllSections() {
        const next = !allSectionsOpen;
        sectionOpen = Object.fromEntries(tocItems.map((item) => [item.id, next]));
    }

    onMount(() => {
        const mq = window.matchMedia(TOC_EXPANDED_QUERY);
        tocOpen = mq.matches;
        // A direct link to a collapsed block (#offline-pwa) opens it
        const hashId = decodeURIComponent(window.location.hash.slice(1));
        if (hashId in sectionOpen) sectionOpen[hashId] = true;
        const onChange = (e: MediaQueryListEvent) => (tocOpen = e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    });
</script>

<style>
  section {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    line-height: 1.6;
    /* color: #333; Removed to support dark mode for text outside of boxes */
  }
  .tutorial h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  /* --- FLOW SCHEMA STYLES --- */
  .flow-schema {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }
  .flow-step-badge {
    background-color: #0070f3;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 30px;
    font-weight: bold;
    font-size: 1.1rem;
    box-shadow: 0 4px 6px rgba(0, 112, 243, 0.2);
    text-align: center;
  }
  .flow-arrow {
    color: #0070f3;
    font-weight: bold;
    font-size: 1.5rem;
  }

  .step-container {
    margin-bottom: 1.5rem;
    background: #f9f9f9;
    color: #333; /* Forcing dark text for light box background in dark mode */
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .step-container h2 {
    font-size: 1.5rem;
    margin-top: 0;
    color: #0070f3;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }
  .legend-list {
    list-style: none;
    padding: 0;
    margin-top: 1rem;
  }
  .legend-list li {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: flex-start;
  }
  .legend-icon {
    margin-right: 0;
    font-size: 16px;
    line-height: 1;
  }
  .legend-number {
    background-color: #0070f3;
    color: white;
    font-weight: bold;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    flex-shrink: 0;
    font-size: 0.9rem;
  }
  .tutorial-img {
    width: 100%;
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 1rem 0;
    border: 1px solid #ddd;
  }
  .image-caption {
    text-align: center;
    font-size: 0.9rem;
    color: #666;
    margin-top: -0.5rem;
    margin-bottom: 1.5rem;
    font-style: italic;
  }
  .easter-egg {
    color: #28a745;
    font-weight: bold;
  }

  /* --- INTERACTIVE GALLERY STYLES --- */
  .gallery-container {
    display: flex;
    gap: 2rem;
    margin-top: 2rem;
    background: #fff;
    color: #333; /* Forcing dark text for gallery in dark mode */
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #eee;
  }
  .gallery-menu {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .gallery-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  .gallery-item:hover, .gallery-item.active {
    background-color: #f0f7ff;
  }
  .gallery-dot {
    width: 10px;
    height: 10px;
    background-color: #0070f3;
    border-radius: 50%;
    margin-right: 10px;
    opacity: 0.3;
    transition: opacity 0.2s, transform 0.2s;
  }
  .gallery-item:hover .gallery-dot, .gallery-item.active .gallery-dot {
    opacity: 1;
    transform: scale(1.2);
  }
  .gallery-item.active {
    font-weight: bold;
    color: #0070f3;
  }
  .gallery-preview {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: #fafafa;
    border-radius: 8px;
    padding: 1rem;
    min-height: 300px;
  }
  .gallery-preview img {
    max-height: 200px;
    width: auto;
    object-fit: contain;
    margin-bottom: 1rem;
  }
  .gallery-preview h3 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  .gallery-preview p {
    font-size: 0.9rem;
    color: #555;
    margin: 0;
  }
  
  @media (max-width: 600px) {
    .gallery-container {
      flex-direction: column;
    }
    .flow-schema {
      flex-direction: column;
      gap: 0.5rem;
    }
    .flow-arrow {
      transform: rotate(90deg);
    }
  }

  /* --- ADVANCED SEARCH STYLES --- */
  .adv-search-mockup {
    background: #ffffff;
    border: 1px solid #dce6f2;
    border-radius: 10px;
    padding: 1.25rem;
    margin: 1.25rem 0 1rem 0;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  .adv-search-bar-mockup {
    display: flex;
    align-items: center;
    border: 2px solid #0070f3;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 112, 243, 0.12);
    gap: 0.5rem;
  }
  .adv-search-input-text {
    flex: 1;
    font-family: monospace;
    font-size: 0.95rem;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .adv-search-prefix-highlight {
    background: #e0f2fe;
    color: #0369a1;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    margin-right: 0.25rem;
  }
  .adv-gear-btn-mockup {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #0070f3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    transition: all 0.2s;
  }
  .adv-gear-btn-mockup:hover {
    background: #e0f2fe;
    transform: rotate(30deg);
  }
  .adv-tabs-mockup {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    flex-wrap: wrap;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0.5rem;
  }
  .adv-tab-pill {
    padding: 0.35rem 0.85rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .adv-tab-pill.active {
    background: #0070f3;
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(0, 112, 243, 0.25);
  }
  .adv-sources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1.25rem;
  }
  .adv-source-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .adv-source-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  }
  .adv-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .adv-card-title {
    font-weight: 700;
    font-size: 1rem;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .adv-prefix-badge {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    background: #f1f5f9;
    color: #0070f3;
    border: 1px solid #cbd5e1;
  }
  .adv-card-desc {
    font-size: 0.88rem;
    color: #475569;
    margin: 0 0 0.5rem 0;
    line-height: 1.45;
  }
  .adv-card-example {
    font-size: 0.82rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.45rem 0.65rem;
    color: #334155;
  }
  .adv-card-example code {
    font-weight: 600;
    color: #0369a1;
  }

  /* --- STYLES FOR SHARING TILE --- */
  .share-tutorial-mockup {
    background: #ffffff;
    border: 1px solid #dce6f2;
    border-radius: 10px;
    padding: 1.25rem 1.25rem 1rem 1.25rem;
    margin: 1.25rem 0 1rem 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.65rem;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  .share-mockup-popover {
    width: 100%;
    max-width: 440px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.65rem 0.75rem;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
    position: relative;
  }
  .share-mockup-popover::after {
    content: '';
    position: absolute;
    bottom: -7px;
    right: 17px;
    width: 12px;
    height: 12px;
    background: #ffffff;
    border-right: 1px solid #cbd5e1;
    border-bottom: 1px solid #cbd5e1;
    transform: rotate(45deg);
  }
  .share-mockup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: #334155;
    margin-bottom: 0.4rem;
  }
  .share-mockup-close {
    color: #94a3b8;
    font-size: 0.95rem;
    line-height: 1;
  }
  .share-mockup-input-row {
    display: flex;
    align-items: stretch;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    background: #f8fafc;
  }
  .share-mockup-url {
    flex: 1;
    padding: 0.35rem 0.55rem;
    font-family: monospace;
    font-size: 0.76rem;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .share-mockup-copy {
    background: #e8f5e9;
    color: #198754;
    border-left: 1px solid #cbd5e1;
    padding: 0.35rem 0.65rem;
    font-size: 0.78rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
  }
  .share-mockup-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    width: 100%;
    flex-wrap: wrap;
  }
  .share-mockup-download {
    background: #198754;
    color: #ffffff;
    border-radius: 7px;
    padding: 0.55rem 1rem;
    font-weight: 600;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex: 1;
    min-width: 160px;
    justify-content: center;
  }
  .share-mockup-slice {
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    padding: 0.55rem 0.85rem;
    font-weight: 600;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .share-mockup-square-btn {
    width: 42px;
    height: 42px;
    border-radius: 7px;
    background: #198754;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(25, 135, 84, 0.3);
    flex-shrink: 0;
  }
  .share-mockup-square-btn .material-symbols-outlined,
  .share-mockup-download .material-symbols-outlined,
  .share-mockup-copy .material-symbols-outlined {
    font-size: 1.15rem;
    line-height: 1;
  }

  /* --- STYLES FOR PRINTABLES SECTION --- */
  .printables-container {
    background: #fff8f5;
    border: 1px solid #ffd8c7;
    color: #333;
    text-align: center;
  }
  .printables-container h2 {
    color: #fa6831;
    border-bottom: 2px solid #ffe4d6;
  }
  .printables-desc {
    font-size: 1.05rem;
    max-width: 620px;
    margin: 0 auto 1.5rem auto;
    color: #444;
  }
  .printables-btn-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .printables-btn,
  .makerworld-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.2rem;
    font-weight: 700;
    padding: 0.75rem 1.75rem;
    border-radius: 8px;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  .printables-btn {
    background-color: #fa6831;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(250, 104, 49, 0.25);
  }
  .printables-btn:hover {
    background-color: #e0531c;
    color: #ffffff !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(250, 104, 49, 0.35);
  }
  .makerworld-btn {
    background-color: #ffffff;
    color: #111111 !important;
    border: 1px solid #dcdcdc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .makerworld-btn:hover {
    background-color: #f5f5f5;
    color: #111111 !important;
    border-color: #c8c8c8;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
  }
  .printables-logo {
    display: inline-block;
    flex-shrink: 0;
  }
  .printables-btn .external-arrow,
  .makerworld-btn .external-arrow {
    font-size: 1.1rem;
    line-height: 1;
    transition: transform 0.2s ease;
  }
  .printables-btn:hover .external-arrow,
  .makerworld-btn:hover .external-arrow {
    transform: translate(2px, -2px);
  }
  /* --- OBSAH (TOC) --- */
  .tutorial-toc {
    max-width: 800px;
    margin: 1.5rem auto 0;
    padding: 0 1rem;
  }
  .toc-box {
    background: #f9f9f9;
    color: #333;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .toc-box summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-weight: bold;
    color: #0070f3;
    cursor: pointer;
    list-style: none;
    user-select: none;
  }
  .toc-box summary::-webkit-details-marker {
    display: none;
  }
  .toc-box summary .material-symbols-outlined {
    margin-right: 0;
  }
  .toc-chevron {
    margin-left: auto;
    transition: transform 0.2s ease;
  }
  .toc-box[open] .toc-chevron {
    transform: rotate(180deg);
  }
  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0.5rem 0.5rem 0.75rem;
    border-top: 2px solid #eee;
  }
  .toc-list a {
    display: block;
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
    color: #333;
    text-decoration: none;
    font-size: 0.95rem;
    line-height: 1.35;
  }
  .toc-list a:hover,
  .toc-list a:focus-visible {
    background: #e8f1ff;
    color: #0070f3;
  }
  .step-container {
    scroll-margin-top: 1rem;
  }
  .step-container:not([open]) {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  .step-container > summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    list-style: none;
  }
  .step-container > summary::-webkit-details-marker {
    display: none;
  }
  .step-container > summary h2 {
    flex: 1;
  }
  .step-container:not([open]) > summary h2 {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom-color: transparent;
  }
  .step-chevron {
    margin-right: 0;
    color: #0070f3;
    transition: transform 0.2s ease;
  }
  .step-container[open] .step-chevron {
    transform: rotate(180deg);
  }
  .printables-container .step-chevron {
    color: #fa6831;
  }
  .toc-toggle-all {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    width: calc(100% - 1rem);
    margin: 0.5rem 0.5rem 0;
    padding: 0.35rem 0.5rem;
    border: 1px solid #cce0ff;
    border-radius: 6px;
    background: #fff;
    color: #0070f3;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .toc-toggle-all:hover,
  .toc-toggle-all:focus-visible {
    background: #e8f1ff;
  }
  .toc-toggle-all .material-symbols-outlined {
    margin-right: 0;
    font-size: 1.15rem;
  }
  .toc-list {
    margin-top: 0.5rem;
  }
  .adv-source-card--wide {
    grid-column: 1 / -1;
  }
  .draw-img {
    display: block;
    max-width: 480px;
    margin: 0.75rem auto 0.25rem;
  }
  @media (min-width: 992px) and (orientation: landscape) {
    .tutorial-layout {
      display: grid;
      grid-template-columns: 260px minmax(0, 800px);
      justify-content: center;
      align-items: start;
      gap: 1.5rem;
      padding: 0 1rem;
    }
    .tutorial-toc {
      position: sticky;
      top: 1rem;
      margin: 2rem 0 0;
      padding: 0;
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
    }
    .tutorial-layout section {
      margin: 0;
    }
  }
</style>

<div class="tutorial-layout">
<aside class="tutorial-toc">
  <details class="toc-box" bind:open={tocOpen}>
    <summary>
      <span class="material-symbols-outlined" aria-hidden="true">toc</span>
      Inhalt
      <span class="material-symbols-outlined toc-chevron" aria-hidden="true">expand_more</span>
    </summary>
    <button type="button" class="toc-toggle-all" on:click={toggleAllSections}>
      <span class="material-symbols-outlined" aria-hidden="true">{allSectionsOpen ? 'unfold_less' : 'unfold_more'}</span>
      {allSectionsOpen ? 'Alle einklappen' : 'Alle ausklappen'}
    </button>
    <nav aria-label="Inhalt der Anleitung">
      <ol class="toc-list">
        {#each tocItems as item (item.id)}
          <li><a href="#{item.id}" on:click={() => (sectionOpen[item.id] = true)}>{item.label}</a></li>
        {/each}
      </ol>
    </nav>
  </details>
</aside>

<section class="tutorial">
  <h1>So verwenden Sie 3D-Druck von Molekülen</h1>
  <p style="text-align: center; margin-bottom: 1.5rem;">
    Ein Molekülmodell für den 3D-Druck vorzubereiten war noch nie so einfach. Der gesamte Ablauf lässt sich in drei schnellen Schritten zusammenfassen:
  </p>

  <!-- FLOW SCHEMA -->
  <div class="flow-schema">
    <div class="flow-step-badge">Name eingeben</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Modell erzeugen</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Herunterladen</div>
  </div>

  <!-- Step 1 -->
  <details id="step-1" class="step-container" bind:open={sectionOpen['step-1']}>
    <summary><h2>Schritt 1: Molekül auswählen</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Teilen Sie dem Programm zunächst mit, welchen Stoff Sie modellieren möchten. Sie können den automatischen Import nutzen oder eigene Daten hochladen.</p>
    <img src={step1Img} alt="Screenshot der Oberfläche mit der Suche" class="tutorial-img">
    <p class="image-caption">Abb. 1: Suchoberfläche für PubChem</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>Suche:</strong> Geben Sie den englischen Namen des Stoffes in das Feld „In PubChem suchen“ ein und drücken Sie die Eingabetaste. Die Daten werden automatisch aus der öffentlichen Datenbank geladen. Neben Namen können Sie auch eine CAS-Nummer, eine PubChem-CID, eine <strong>Summenformel</strong> (<code>H2O</code>, <code>CO2</code>, <code>H2SO4</code> – Groß- und Kleinschreibung spielt keine Rolle, auch <code>h2so4</code> oder <code>H₂O</code> funktionieren) oder einen <strong>SMILES</strong>-Code (z. B. <code>CC(=O)OC1=CC=CC=C1C(=O)O</code>) eingeben. Eine Summenformel lädt die relevanteste Verbindung; haben mehrere Verbindungen dieselbe Formel (Isomere), wählen Sie die gewünschte in der Erweiterten Suche aus.</div></li>
      <li><span class="legend-number">2</span><div><strong>Eigene Daten:</strong> Laden Sie eine Datei im Format <code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code> oder ChemDraw (<code>.cdx</code>, <code>.cdxml</code>) über die Schaltfläche <em>Datei hochladen</em> hoch, ziehen Sie sie ins Fenster oder fügen Sie sie mit <kbd>Strg</kbd>+<kbd>V</kbd> ein. Das Modell wird sofort geladen. 2D-Strukturen (typischerweise aus ChemDraw oder Marvin exportiert, ohne Wasserstoffatome) werden automatisch in 3D umgewandelt und um Wasserstoffatome ergänzt.</div></li>
    </ul>
  </details>

  <!-- ADVANCED SEARCH -->
  <details id="advanced-search" class="step-container" bind:open={sectionOpen['advanced-search']}>
    <summary><h2>Erweiterte Suche und spezielle Eingaben</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      Sie möchten eine Verbindung aus einem SMILES-Code, ein Makromolekül aus der Protein Data Bank, ein Kristallgitter oder einen Cofaktor mit gebundenem Metall modellieren? Die App unterstützt eine erweiterte Suche über mehrere Datenbanken.
    </p>

    <div class="adv-search-mockup" aria-label="Schematische Darstellung der Suchleiste und der Erweiterten Suche">
      <!-- Search bar mockup -->
      <div class="adv-search-bar-mockup">
        <span class="material-symbols-outlined" style="color: #64748b; font-size: 1.25rem;" aria-hidden="true">search</span>
        <div class="adv-search-input-text">
          <span class="adv-search-prefix-highlight">smiles:</span>CC(=O)Oc1ccccc1C(=O)O
        </div>
        <div class="adv-gear-btn-mockup" title="Erweiterte Suche">
          <span class="material-symbols-outlined" style="font-size: 1.25rem;" aria-hidden="true">settings</span>
        </div>
      </div>

      <!-- Modal tabs mockup -->
      <div class="adv-tabs-mockup">
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">database</span>
          PubChem
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">biotech</span>
          PDB / Liganden
        </span>
        <span class="adv-tab-pill active">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">science</span>
          SMILES → 3D
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">grain</span>
          COD (Kristalle)
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">draw</span>
          Zeichnen
        </span>
      </div>
    </div>
    <p class="image-caption">Beispiel: Suchleiste mit Präfix und Registerkarten im Dialog „Erweiterte Suche“</p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">A</span>
        <div>
          <strong>Zahnradsymbol (Sucheinstellungen):</strong>
          Klicken Sie auf das Zahnrad <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">settings</span> rechts in der Hauptsuchleiste, um das Fenster <em>Erweiterte Suche</em> zu öffnen. Dort können Sie über Registerkarten zwischen Datenbanken wechseln, interaktive Filter nutzen (etwa die Kettenauswahl bei PDB) oder vorbereitete Beispielmoleküle ausprobieren.
        </div>
      </li>
      <li>
        <span class="legend-number">B</span>
        <div>
          <strong>Präfixe direkt im Suchfeld:</strong>
          Sie müssen das Fenster nicht einmal öffnen – geben Sie einfach ein Präfix mit Doppelpunkt direkt in das Hauptsuchfeld ein. Die Anwendung erkennt die Art der Anfrage automatisch und leitet sie an den passenden Dienst weiter. Summenformeln und SMILES werden auch ohne Präfix erkannt.
        </div>
      </li>
    </ul>

    <!-- Input source cards -->
    <div class="adv-sources-grid">
      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">database</span>
            PubChem: Summenformeln, Isomere und 3D-Konformere
          </div>
          <span class="adv-prefix-badge">formula: / conformer:</span>
        </div>
        <p class="adv-card-desc">
          Geben Sie auf der Registerkarte <em>PubChem</em> eine Summenformel ein, um alle Verbindungen mit dieser Formel nach Relevanz sortiert aufzulisten – für <code>C2H6O</code> etwa Ethanol und Dimethylether – und wählen Sie die richtige aus. Ist <em>3D-Konformer auswählen</em> aktiviert, bietet die App statt der Standardstruktur bis zu 10 räumliche Konformationen an, die PubChem für die Verbindung berechnet hat. Zu jeder wird die MMFF94-Energie angezeigt und in Klammern die Differenz zur stabilsten. Das eignet sich, um die Flexibilität von Molekülen zu zeigen oder mehrere Konformationen nebeneinander zu drucken. Der Konformer bleibt im Suchverlauf und in geteilten Links erhalten.
        </p>
        <div class="adv-card-example">
          Beispiele: <code>H2SO4</code>, <code>C2H6O</code> (Isomere), Aspirin + <em>3D-Konformer auswählen</em>. Salze und Metallkomplexe haben oft keine 3D-Konformere – die App bietet dann eine Umwandlung 2D → 3D an.
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">upload_file</span>
            ChemDraw- und .mol-Dateien
          </div>
          <span class="adv-prefix-badge">Hochladen / Drag &amp; Drop / Strg+V</span>
        </div>
        <p class="adv-card-desc">
          Es gibt drei Wege, eine Struktur aus ChemDraw zu übernehmen: als <code>.cdx</code> oder <code>.cdxml</code> speichern und die Datei hochladen; über <em>Edit → Copy As → MOL Text</em> bzw. <em>CDXML Text</em> kopieren und mit <kbd>Strg</kbd>+<kbd>V</kbd> an beliebiger Stelle in der App einfügen (außerhalb anderer Textfelder); oder über <em>Copy As → SMILES</em> kopieren und in das Suchfeld einfügen. Eine <code>.mol</code>-Datei aus ChemDraw, Marvin, ChemSketch oder einem anderen Editor funktioniert genauso. Gezeichnete (2D-)Strukturen haben weder räumliche Koordinaten noch Wasserstoffatome und werden daher automatisch in 3D umgewandelt – online über NIH CACTUS, offline lokal (OpenBabel). Gruppenabkürzungen (Ph, OMe…) werden aufgelöst, Ladungen und die Stereochemie aus Keilbindungen bleiben erhalten.
        </p>
        <div class="adv-card-example">
          Dateien, die bereits 3D-Koordinaten enthalten (z. B. aus Avogadro exportiert oder ein 3D-SDF aus PubChem), werden unverändert geladen.
        </div>
      </div>
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">science</span>
            SMILES und InChI
          </div>
          <span class="adv-prefix-badge">smiles: / cactus:</span>
        </div>
        <p class="adv-card-desc">
          Wandelt lineare chemische Notation über NIH CACTUS CIR direkt in 3D-Koordinaten um (mit PubChem 3D als Ausweichlösung). Ideal für eigene, synthetische oder exotische Verbindungen außerhalb der Standardkataloge. SMILES mit Verzweigungen, Ringen oder Mehrfachbindungen (z. B. die Ausgabe von ChemDraw <em>Copy As → SMILES</em>) werden auch ohne Präfix erkannt.
        </p>
        <div class="adv-card-example">
          Beispiele: <code>smiles: CC(=O)Oc1ccccc1C(=O)O</code> (Aspirin), <code>smiles: C1CCCCC1</code> (Cyclohexan), <code>smiles: C12C3C4C1C5C2C3C45</code> (Cuban)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">biotech</span>
            PDB-Makromoleküle
          </div>
          <span class="adv-prefix-badge">pdb:</span>
        </div>
        <p class="adv-card-desc">
          Ruft makromolekulare Strukturen aus der Protein Data Bank ab (Proteine, Enzyme, DNA, RNA). Im Dialog „Erweiterte Suche“ können Sie außerdem eine einzelne Kette angeben und Kristallwassermoleküle ein- oder ausblenden.
        </p>
        <div class="adv-card-example">
          Beispiele: <code>pdb: 1CRN</code> (Crambin), <code>pdb: 1BNA</code> (B-DNA), <code>pdb: 1CRN:A</code> (Kette A)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">category</span>
            CCD-Liganden und Cofaktoren
          </div>
          <span class="adv-prefix-badge">ccd:</span>
        </div>
        <p class="adv-card-desc">
          Lädt Liganden und Cofaktoren aus dem PDB Chemical Component Dictionary herunter. Ideal für den 3D-Druck von Cofaktoren mit Metallzentrum, Farbstoffen und an Makromoleküle gebundenen Wirkstoffen.
        </p>
        <div class="adv-card-example">
          Beispiele: <code>ccd: HEM</code> (Häm), <code>ccd: ATP</code>, <code>ccd: CLA</code> (Chlorophyll a)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">grain</span>
            COD-Kristalle und Minerale
          </div>
          <span class="adv-prefix-badge">cod:</span>
        </div>
        <p class="adv-card-desc">
          Durchsucht die Crystallography Open Database. Damit laden Sie anorganische Kristallgitter, Salze und Minerale per Volltextname, Summenformel oder numerischer COD-ID.
        </p>
        <div class="adv-card-example">
          Beispiele: <code>cod: 1506182</code>, <code>cod: CaCO3</code> (Calcit), <code>cod: quartz</code>, <code>cod: NaCl</code>
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">draw</span>
            Zeichnen 2D → 3D
          </div>
          <span class="adv-prefix-badge">Registerkarte Zeichnen</span>
        </div>
        <p class="adv-card-desc">
          Skizzieren Sie eine Strukturformel direkt auf der Zeichenfläche: Wählen Sie eine Bindung (Einfach-, Doppel-, Dreifachbindung oder Keil-/schraffierte Bindung für die Stereochemie), ein Element (C, H, O, N, P, S, F, Cl, Br, I, B, Si, Se oder ein beliebiges weiteres aus dem Menü <em>Weitere</em>) oder einen Ring (Benzol, Cyclohexan, Cyclopentan; weitere Cycloalkane und Heterocyclen wie Pyridin oder Furan unter <em>Weitere Ringe</em>) und klicken oder ziehen Sie. Mit den Werkzeugen <em>+</em>/<em>−</em> setzen Sie Atomladungen; Summenformel und SMILES der Zeichnung werden live unter der Zeichenfläche angezeigt. Ein Klick mit einem Element auf ein vorhandenes Atom ändert dieses, ein Klick auf eine freie Stelle fügt ein neues Atom hinzu. Die Schaltfläche <em>3D-Modell erzeugen</em> berechnet anschließend die 3D-Koordinaten einschließlich der Wasserstoffatome.
        </p>
        <img src={drawImg} alt="Registerkarte Zeichnen in der Erweiterten Suche mit skizzierter Salicylsäure auf der Zeichenfläche" loading="lazy" class="tutorial-img draw-img">
        <p class="image-caption">Beispiel: in der Registerkarte Zeichnen skizzierte Salicylsäure</p>
        <div class="adv-card-example">
          Online stammt die 3D-Struktur von NIH CACTUS; ohne Internet wird sie lokal in Ihrem Browser berechnet (OpenBabel, Kraftfeld MMFF94). Tipp: Öffnen Sie die Registerkarte einmal online, damit die Offline-Engine in Ihrem Browser gespeichert wird (die installierte App erledigt das automatisch).
        </div>
      </div>
    </div>
  </details>

  <!-- Step 2 -->
  <details id="step-2" class="step-container" bind:open={sectionOpen['step-2']}>
    <summary><h2>Schritt 2: Benutzeroberfläche</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Nach dem Laden der Daten stehen die Modelleinstellungen zur Verfügung. Der erste Schritt ist die Wahl der Moleküldarstellung.</p>
    <img src={step2Img} alt="Screenshot der Oberfläche mit aufgeklapptem Menü" loading="lazy" class="tutorial-img">
    <p class="image-caption">Abb. 2: Oberfläche mit dem Dropdown-Menü der Darstellungen</p>
  </details>

  <!-- Step 3 -->
  <details id="step-3" class="step-container" bind:open={sectionOpen['step-3']}>
    <summary><h2>Schritt 3: Darstellungsart wählen</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Wählen Sie das Aussehen, das am besten zu Ihrem Einsatz im Unterricht oder beim 3D-Druck passt.</p>
    <img src={step3Img} alt="Auswahl der Moleküldarstellung" loading="lazy" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">Abb. 3: Optionen im Dropdown-Menü</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>Modelltyp auswählen:</strong> Wählen Sie das gewünschte Aussehen (Spheres, Ball-and-Stick, Sticks oder unseren geheimen <span class="easter-egg">Minecraft</span>-Modus).</div></li>
    </ul>
  </details>

  <!-- Step 4 and Interactive Gallery -->
  <details id="step-4" class="step-container" bind:open={sectionOpen['step-4']}>
    <summary><h2>Schritt 4: Parametereinstellungen und Export</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Passen Sie Details und Proportionen des Modells für einen optimalen Druck an. Fahren Sie mit der Maus über die einzelnen Optionen unten, um zu sehen, wie die Parameter das Ergebnis optisch verändern.</p>

    <!-- INTERACTIVE GALLERY -->
    <div class="gallery-container">
      <div class="gallery-menu">
        <!-- eslint-disable-next-line a11y-no-static-element-interactions -->
        {#each settingsOptions as option}
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <div
            class="gallery-item {activeOption.name === option.name ? 'active' : ''}"
            on:mouseenter={() => activeOption = option}
          >
            <span class="gallery-dot"></span>
            {option.name}
          </div>
        {/each}
      </div>

      <div class="gallery-preview">
        <img src={activeOption.img} alt={activeOption.name} loading="lazy" />
        <h3>{activeOption.name}</h3>
        <p>{activeOption.desc}</p>
      </div>
    </div>
    <!-- END OF GALLERY -->

    <img src={step4Img} alt="Beispiel für die Parameter des Kugel-Stab-Modells" loading="lazy" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">Abb. 4: Modellparameter und Exportoptionen</p>

    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>Modelleinstellungen:</strong> Hier passen Sie Qualität, Modellgröße, Bindungsdurchmesser oder die Anzeige der Wasserstoffatome an.</div></li>
      <li><span class="legend-number">5</span><div><strong>Exportoptionen:</strong> Die Schaltfläche <em>Vorlage herunterladen</em> lädt die Rohdaten des Moleküls als <code>.sdf</code> herunter. Die blaue Schaltfläche <em>Eine STL-Datei</em> exportiert ein zusammengeführtes einfarbiges Modell.</div></li>
      <li><span class="legend-number">6</span><div><strong>Endgültiger Mehrfarbexport:</strong> Mit der grünen Schaltfläche <em>Modell herunterladen</em> erhalten Sie ein <code>.zip</code>-Archiv mit nach Atomen getrennten Modellen, damit Sie die Farben im Slicer leichter zuweisen können.</div></li>
    </ul>
  </details>

  <!-- Step 5 -->
  <details id="step-5" class="step-container" bind:open={sectionOpen['step-5']}>
    <summary><h2>Schritt 5: Änderungen übernehmen (Neu laden)</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Das Bild zeigt ein komplexeres Modell (ATP). Beachten Sie, dass sich die Vorschau nach einer Änderung im Bereich <em>Modelleinstellungen</em> nicht automatisch aktualisiert.</p>
    <img src={step5Img} alt="Aktualisieren des Modells mit der Schaltfläche Neu laden" loading="lazy" class="tutorial-img">
    <p class="image-caption">Abb. 5: ATP-Modell und die gelbe Schaltfläche „Neu laden“</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>Schaltfläche „Neu laden“:</strong> Klicken Sie nach jeder Änderung der Einstellungen zuerst auf diese gelbe Schaltfläche. Damit werden die Änderungen in die 3D-Vorschau übernommen.</div></li>
    </ul>
  </details>

  <!-- SHARING MODEL AND SETTINGS -->
  <details id="sharing" class="step-container" bind:open={sectionOpen['sharing']}>
    <summary><h2>Modelle und Einstellungen per URL teilen</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Über einen teilbaren URL-Link können Sie Ihr vorbereitetes Molekül samt den genauen Parametereinstellungen ganz einfach mit Kolleginnen und Kollegen oder Studierenden teilen oder es als Lesezeichen speichern.</p>

    <div class="share-tutorial-mockup" aria-label="Darstellung der Schaltfläche Teilen und des schwebenden Fensters mit der URL">
      <div class="share-mockup-popover">
        <div class="share-mockup-header">
          <span>Link zum Teilen</span>
          <span class="share-mockup-close" aria-hidden="true">✕</span>
        </div>
        <div class="share-mockup-input-row">
          <div class="share-mockup-url">https://3dmolekuly.vscht.cz/?source=pubchem&amp;mol=caffeine&amp;style=ball-and-stick&amp;q=50</div>
          <div class="share-mockup-copy">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            Kopiert!
          </div>
        </div>
      </div>

      <div class="share-mockup-actions">
        <div class="share-mockup-download">
          <span class="material-symbols-outlined" aria-hidden="true">deployed_code_update</span>
          Modell herunterladen (.3mf)
        </div>
        <div class="share-mockup-slice">
          Slicen ▾
        </div>
        <div class="share-mockup-square-btn" title="Teilen">
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
        </div>
      </div>
    </div>
    <p class="image-caption">Abb. 6: Quadratische Schaltfläche „Teilen“ und schwebendes Fenster mit dem URL-Link</p>

    <ul class="legend-list">
      <li><span class="legend-number">8</span><div><strong>Schaltfläche „Teilen“:</strong> Klicken Sie auf die quadratische Teilen-Schaltfläche (neben der Schaltfläche <em>Slicen</em>). Die URL wird in die Zwischenablage kopiert, die Schaltfläche färbt sich grün und direkt darüber erscheint ein Fenster mit dem vollständigen Link. Die URL enthält die Datenquelle (<code>pubchem</code>, <code>pdb</code>, <code>cod</code>), den Namen oder Code des Moleküls, die gewählte Darstellungsart und alle eingestellten Parameter – beim Öffnen des Links werden also alle Einstellungen automatisch übernommen und das Modell wird dargestellt. Ein aus PubChem gewählter 3D-Konformer bleibt ebenfalls im Link erhalten (<code>conformer:…</code>). Arbeiten Sie mit einer hochgeladenen lokalen Datei (<code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code>, ChemDraw), teilt der Link nur die Darstellungsart und die eingestellten Werte (<code>source=file</code>) – so ist alles für jeden vorkonfiguriert, der seine eigene Datei hochlädt.</div></li>
    </ul>
  </details>

  <!-- OFFLINE USAGE AND PWA INSTALLATION -->
  <details id="offline-pwa" class="step-container" bind:open={sectionOpen['offline-pwa']}>
    <summary><h2>Offline-Nutzung und Installation als PWA</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      Sie können 3D-Druck von Molekülen als App auf Ihrem Computer oder Smartphone installieren. Nach dem ersten Besuch mit Internetverbindung wird die App in Ihrem Browser gespeichert und funktioniert auch <strong>ohne Internetverbindung</strong> – im Klassenzimmer, im Labor oder unterwegs.
    </p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">computer</span>
        </span>
        <div>
          <strong>Installation auf dem Computer (Chrome, Edge):</strong>
          Klicken Sie in der Adressleiste (direkt neben der URL) auf das Symbol <em>App installieren</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">install_desktop</span> und bestätigen Sie mit <em>Installieren</em>. Die App öffnet sich dann in einem eigenen Fenster und erscheint im Startmenü bzw. im Launchpad.
        </div>
      </li>
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">phone_iphone</span>
        </span>
        <div>
          <strong>Installation auf dem Smartphone:</strong>
          Tippen Sie in <em>Safari</em> (iPhone, iPad) auf <em>Teilen</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">ios_share</span> → <em>Zum Home-Bildschirm</em>. Öffnen Sie in <em>Chrome</em> (Android) das Menü ⋮ → <em>App installieren</em> (bzw. <em>Zum Startbildschirm hinzufügen</em>).
        </div>
      </li>
    </ul>

    <div class="adv-sources-grid">
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #2e7d32;" aria-hidden="true">offline_pin</span>
            Funktioniert offline
          </div>
        </div>
        <p class="adv-card-desc">
          Hochladen eigener Dateien von der Festplatte (<code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code>, ChemDraw <code>.cdx</code>/<code>.cdxml</code>; 2D-Strukturen werden durch eine lokale Berechnung in 3D umgewandelt), die 3D-Vorschau und alle Darstellungsarten, das Bearbeiten der Modellparameter, bewegliche Gelenke, die Prüfung auf Wasserdichtheit (Manifold) sowie der Export als <code>.3mf</code> / <code>.stl</code> über die Schaltfläche <em>Modell herunterladen</em>. Auch <em>Molekül zeichnen</em> in der Erweiterten Suche funktioniert – das 3D-Modell wird lokal berechnet (OpenBabel). Voraussetzung ist, dass das Berechnungsmodul (~8 MB) bereits auf Ihrem Gerät gespeichert ist: Öffnen Sie im Browser die Registerkarte Zeichnen mindestens einmal online; die installierte App (PWA) lädt es beim Start mit Internetverbindung automatisch herunter.
        </p>
        <div class="adv-card-example">
          Alle Berechnungen (3D-Geometrie, Manifold, ZIP-Paketierung) laufen direkt in Ihrem Browser – nichts wird an einen Server gesendet.
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #e53935;" aria-hidden="true">cloud_off</span>
            Erfordert eine Verbindung
          </div>
        </div>
        <p class="adv-card-desc">
          Suchen und Herunterladen von Strukturen aus Online-Katalogen – <strong>PubChem</strong>, <strong>PDB</strong> (einschließlich CCD-Liganden), <strong>COD</strong> sowie die SMILES-Umwandlung über NIH CACTUS. Auch die Schaltfläche <em>Slicen</em>, die das Modell direkt im Slicer öffnet, benötigt Internet.
        </p>
        <div class="adv-card-example">
          Tipp: Laden Sie das Modell offline über <em>Modell herunterladen</em> als <code>.3mf</code> herunter und öffnen Sie es manuell in Ihrem Slicer.
        </div>
      </div>
    </div>
  </details>

  <!-- SLICER IMPORT INFO -->
  <details id="slicer-import" class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;" bind:open={sectionOpen['slicer-import']}>
    <summary><h2>Wie importiere ich das Modell in den Slicer?</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p style="font-size: 1.1rem; text-align: center;">
      Für den <strong>mehrfarbigen</strong> Druck eines Moleküls achten Sie darauf, dass der Slicer die Meldung <br>
      <em>„Multi-part object detected“ (mehrteiliges Objekt erkannt)</em> anzeigt, <br>
      und bestätigen Sie mit <strong>„YES“ (Ja)</strong>.
    </p>
    <img src="/assets/multipartobject.svg" alt="Importdialog des Slicers" loading="lazy" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
    <PrusaSlicerPluginNote />
  </details>

  <!-- PRINTABLES AND MAKERWORLD SECTION -->
  <details id="ready-models" class="step-container printables-container" bind:open={sectionOpen['ready-models']}>
    <summary><h2>Druckfertige Modelle auf Printables und MakerWorld ausprobieren</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p class="printables-desc">
      Sie suchen Inspiration oder möchten beliebte Moleküle direkt drucken, ohne Einstellungen anzupassen? Entdecken Sie unsere Sammlung geprüfter, druckfertiger 3D-Molekülmodelle direkt auf Printables und MakerWorld.
    </p>
    <div class="printables-btn-wrapper">
      <a
        href="https://www.printables.com/@3DPMol_5381976/models"
        target="_blank"
        rel="noopener noreferrer"
        class="printables-btn"
      >
        <svg class="printables-logo" viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
          <title>Printables</title>
          <path d="M3.678 4.8 12 9.6v9.6l8.322-4.8V4.8L12 0ZM12 19.2l-8.322-4.8V24Z"/>
        </svg>
        <span>Printables</span>
        <span class="external-arrow">↗</span>
      </a>
      <a
        href="https://makerworld.com/en/@3DPMol"
        target="_blank"
        rel="noopener noreferrer"
        class="makerworld-btn"
      >
        <svg class="printables-logo" viewBox="19 10 168 167" fill="currentColor" width="28" height="28" aria-hidden="true">
          <title>MakerWorld</title>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M23 31 L66 14 L103 28 L140 14 L183 31 L183 156 L140 173 L103 159 L66 173 L23 156 Z M67 21 L102 36 L102 86 L67 71 Z M140 21 L176 36 L176 86 L140 71 Z M31 94 L66 79 L101 94 L66 109 Z M105 94 L140 79 L175 94 L140 109 Z M30 102 L66 117 L66 167 L30 152 Z M104 102 L140 117 L140 167 L104 152 Z"/>
        </svg>
        <span>MakerWorld</span>
        <span class="external-arrow">↗</span>
      </a>
    </div>
  </details>
</section>
</div>

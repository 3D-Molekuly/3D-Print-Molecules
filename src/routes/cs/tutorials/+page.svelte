<script lang="ts">
    import { onMount } from 'svelte';

    // --- HLAVNÍ OBRÁZKY KROKŮ ---
    import step1Img from '$lib/images/step1.png';
    import step2Img from '$lib/images/step2.png';
    import step3Img from '$lib/images/step3.png';
    import step4Img from '$lib/images/step4.png';
    import step5Img from '$lib/images/step5.png'; 
    import drawImg from '$lib/images/draw-2d-3d-cs.png';

    // --- OBRÁZKY PRO INTERAKTIVNÍ GALERII (ze složky settings) ---
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

    // --- DATA PRO INTERAKTIVNÍ GALERII ---
    const settingsOptions = [
        { 
            name: "Výchozí kvalita sítě (Quality: 50)", 
            img: sphereQ50Img, 
            desc: "Standardní nastavení pro hezký a hladký sférický model." 
        },
        { 
            name: "Nízká kvalita (Quality: 5)", 
            img: sphereQ5Img, 
            desc: "Výrazně snižuje počet polygonů. Hodí se pro specifický 'low-poly' vzhled nebo rychlejší renderování obrovských molekul." 
        },
        { 
            name: "Skrytí vodíků (Hydrogens)", 
            img: sphereHoffImg, 
            desc: "Vypne zobrazování atomů vodíku, což může výrazně zpřehlednit složité organické molekuly." 
        },
        { 
            name: "Výchozí Ball-and-Stick", 
            img: waterBasImg, 
            desc: "Základní zobrazení molekuly vody v režimu kuliček a tyčinek." 
        },
        { 
            name: "Zobrazení násobných vazeb", 
            img: co2MultImg, 
            desc: "U oxidu uhličitého (CO2) vizualizuje dvojné vazby mezi uhlíkem a kyslíkem (oproti výchozí jednoduché vazbě)." 
        },
        { 
            name: "Jednotný průměr (Uniform Atom Diameter)", 
            img: waterUniformImg, 
            desc: "Sjednotí velikost všech atomů v modelu bez ohledu na jejich skutečný van der Waalsův poloměr." 
        },
        { 
            name: "Oddělené vazby (Group Bonds Separately)", 
            img: waterGroupImg, 
            desc: "Při exportu rozdělí vazby do samostatných celků, což usnadňuje barvení a přípravu pro vícebarevný 3D tisk." 
        },
        { 
            name: "Větší měřítko (Multiplication Factor: 1.5)", 
            img: waterMultImg, 
            desc: "Zvětší celkový objem a průměry prvků modelu pro masivnější fyzický výsledek." 
        },
        { 
            name: "Tloušťka vazeb (Bond Diameter: 0.6)", 
            img: waterBondDiaImg, 
            desc: "Zesílí spojovací tyčinky mezi atomy, aby byl tištěný model mechanicky odolnější." 
        }
    ];

    // Výchozí zobrazená volba v galerii
    let activeOption = settingsOptions[0];

    // --- OBSAH NÁVODU (ID odpovídají sekcím níže) ---
    const tocItems = [
        { id: 'step-1', label: 'Krok 1: Výběr molekuly' },
        { id: 'advanced-search', label: 'Pokročilé vyhledávání' },
        { id: 'step-2', label: 'Krok 2: Rozhraní pro zobrazení' },
        { id: 'step-3', label: 'Krok 3: Typ zobrazení' },
        { id: 'step-4', label: 'Krok 4: Parametry a export' },
        { id: 'step-5', label: 'Krok 5: Aplikace změn (Reload)' },
        { id: 'sharing', label: 'Sdílení přes URL' },
        { id: 'offline-pwa', label: 'Offline a instalace (PWA)' },
        { id: 'slicer-import', label: 'Import do sliceru' },
        { id: 'ready-models', label: 'Hotové modely ke stažení' }
    ];

    // Obsah je na počítači (na šířku) rozbalený, na telefonu (na výšku) sbalený
    const TOC_EXPANDED_QUERY = '(min-width: 992px) and (orientation: landscape)';
    let tocOpen = false;

    // Které bloky návodu jsou rozbalené (základní kroky výchozí otevřené)
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
        // Odkaz přímo na sbalený blok (#offline-pwa) ho rovnou otevře
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
    /* color: #333; odstraněno pro podporu tmavého režimu u textů mimo boxy */
  }
  .tutorial h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  /* --- STYLY PRO ÚVODNÍ SCHÉMA --- */
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
    color: #333; /* Vynucení tmavého textu pro světlé pozadí boxu v tmavém režimu */
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

  /* --- STYLY PRO INTERAKTIVNÍ GALERII --- */
  .gallery-container {
    display: flex;
    gap: 2rem;
    margin-top: 2rem;
    background: #fff;
    color: #333; /* Vynucení tmavého textu pro galerii v tmavém režimu */
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

  /* --- STYLY PRO ADVANCED SEARCH SEKCI --- */
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

  /* --- STYLY PRO DLAŽDICI SDÍLENÍ --- */
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

  /* --- STYLY PRO PRINTABLES SEKCI --- */
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
      Obsah
      <span class="material-symbols-outlined toc-chevron" aria-hidden="true">expand_more</span>
    </summary>
    <button type="button" class="toc-toggle-all" on:click={toggleAllSections}>
      <span class="material-symbols-outlined" aria-hidden="true">{allSectionsOpen ? 'unfold_less' : 'unfold_more'}</span>
      {allSectionsOpen ? 'Sbalit vše' : 'Rozbalit vše'}
    </button>
    <nav aria-label="Obsah návodu">
      <ol class="toc-list">
        {#each tocItems as item (item.id)}
          <li><a href="#{item.id}" on:click={() => (sectionOpen[item.id] = true)}>{item.label}</a></li>
        {/each}
      </ol>
    </nav>
  </details>
</aside>

<section class="tutorial">
  <h1>Jak používat 3D Printing Molecules</h1>
  <p style="text-align: center; margin-bottom: 1.5rem;">
    Připravit model molekuly pro 3D tisk nebylo nikdy jednodušší. Celý proces lze shrnout do tří rychlých kroků:
  </p>

  <!-- ÚVODNÍ SCHÉMA -->
  <div class="flow-schema">
    <div class="flow-step-badge">Zadej název</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Vygeneruj model</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Stáhni</div>
  </div>

  <!-- Krok 1 -->
  <details id="step-1" class="step-container" bind:open={sectionOpen['step-1']}>
    <summary><h2>Krok 1: Výběr molekuly</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Nejprve programu řekni, jakou látku chceš modelovat. Můžeš využít automatický import nebo nahrát vlastní data.</p>
    <img src={step1Img} alt="UI ukázka screenshot" class="tutorial-img">
    <p class="image-caption">Obr. 1: Zobrazení vyhledávání z PubChemu</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>Vyhledávání:</strong> Zadej anglický název látky do pole "Search on PubChem" a stiskni Enter. Data se automaticky stáhnou z veřejné databáze.</div></li>
      <li><span class="legend-number">2</span><div><strong>Vlastní data:</strong> Pokud máš vlastní <code>.sdf</code> soubor, použij tlačítko <em>Upload File</em> a následně <em>Fetch Data</em>.</div></li>
    </ul>
  </details>

  <!-- POKROČILÉ VYHLEDÁVÁNÍ (ADVANCED SEARCH) -->
  <details id="advanced-search" class="step-container" bind:open={sectionOpen['advanced-search']}>
    <summary><h2>Pokročilé vyhledávání (Advanced Search) & specifické vstupy</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      Potřebuješ namodelovat sloučeninu podle vzorce SMILES, makromolekulu z Protein Data Bank, krystalovou mřížku nebo kofaktor s navázaným kovem? Aplikace nabízí pokročilé vyhledávání ve více chemických a krystalografických databázích.
    </p>

    <div class="adv-search-mockup" aria-label="Ukázka vyhledávacího pole a pokročilého vyhledávání">
      <!-- Mockup vyhledávacího řádku -->
      <div class="adv-search-bar-mockup">
        <span class="material-symbols-outlined" style="color: #64748b; font-size: 1.25rem;" aria-hidden="true">search</span>
        <div class="adv-search-input-text">
          <span class="adv-search-prefix-highlight">smiles:</span>CC(=O)Oc1ccccc1C(=O)O
        </div>
        <div class="adv-gear-btn-mockup" title="Pokročilé vyhledávání (Advanced Search)">
          <span class="material-symbols-outlined" style="font-size: 1.25rem;" aria-hidden="true">settings</span>
        </div>
      </div>

      <!-- Záložky v modálním okně -->
      <div class="adv-tabs-mockup">
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">database</span>
          PubChem
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">biotech</span>
          PDB / Ligandy
        </span>
        <span class="adv-tab-pill active">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">science</span>
          SMILES → 3D
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">grain</span>
          COD (Krystaly)
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">draw</span>
          Kreslení
        </span>
      </div>
    </div>
    <p class="image-caption">Ukázka: Vyhledávací pole s prefixem a záložky v okně pokročilého vyhledávání</p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">A</span>
        <div>
          <strong>Ikona ozubeného kola (Nastavení vyhledávání):</strong>
          Kliknutím na tlačítko s ikonou ozubeného kola <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">settings</span> v pravé části vyhledávacího řádku otevřeš okno <em>Pokročilé vyhledávání</em>. Zde můžeš pohodlně přepínat mezi jednotlivými zdroji pomocí záložek, využít interaktivní filtry (např. výběr řetězce u PDB) nebo kliknout na připravené ukázkové molekuly.
        </div>
      </li>
      <li>
        <span class="legend-number">B</span>
        <div>
          <strong>Přímé prefixy v hlavním poli:</strong>
          Okno nemusíš otevírat – stačí napsat prefix následovaný dvojtečkou přímo do vyhledávacího pole. Aplikace automaticky rozpozná typ dotazu a přesměruje jej na správnou službu.
        </div>
      </li>
    </ul>

    <!-- Karty jednotlivých vstupů -->
    <div class="adv-sources-grid">
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">science</span>
            SMILES & InChI
          </div>
          <span class="adv-prefix-badge">smiles: / cactus:</span>
        </div>
        <p class="adv-card-desc">
          Převod lineárního chemického vzorce do 3D souřadnic pomocí služby NIH CACTUS CIR (s fallbackem na PubChem 3D). Vhodné pro libovolné vlastní či exotické sloučeniny mimo běžné katalogy.
        </p>
        <div class="adv-card-example">
          Příklady: <code>smiles: CC(=O)Oc1ccccc1C(=O)O</code> (aspirin), <code>smiles: C1CCCCC1</code> (cyklohexan), <code>smiles: C12C3C4C1C5C2C3C45</code> (kuban)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">biotech</span>
            PDB Makromolekuly
          </div>
          <span class="adv-prefix-badge">pdb:</span>
        </div>
        <p class="adv-card-desc">
          Načte biologické makromolekuly z Protein Data Bank (proteiny, enzymy, DNA, RNA). V okně pokročilého vyhledávání lze navíc specifikovat konkrétní řetězec a zapnout krystalovou vodu.
        </p>
        <div class="adv-card-example">
          Příklady: <code>pdb: 1CRN</code> (krambin), <code>pdb: 1BNA</code> (B-DNA), <code>pdb: 1CRN:A</code> (řetězec A)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">category</span>
            CCD Ligandy a kofaktory
          </div>
          <span class="adv-prefix-badge">ccd:</span>
        </div>
        <p class="adv-card-desc">
          Stahuje ligandy a kofaktory z PDB Chemical Component Dictionary. Ideální pro 3D tisk kofaktorů s vázanými atomy kovů, barviv a léčiv vázaných v makromolekulách.
        </p>
        <div class="adv-card-example">
          Příklady: <code>ccd: HEM</code> (hem), <code>ccd: ATP</code>, <code>ccd: CLA</code> (chlorofyl a)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">grain</span>
            COD Krystaly a minerály
          </div>
          <span class="adv-prefix-badge">cod:</span>
        </div>
        <p class="adv-card-desc">
          Prohledává Crystallography Open Database. Umožňuje načíst anorganické krystalové mřížky, soli a minerály podle fulltextového názvu, sumárního vzorce nebo číselného COD ID.
        </p>
        <div class="adv-card-example">
          Příklady: <code>cod: 1506182</code>, <code>cod: CaCO3</code> (kalcit), <code>cod: quartz</code>, <code>cod: NaCl</code>
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">draw</span>
            Kreslení 2D → 3D
          </div>
          <span class="adv-prefix-badge">záložka Kreslení</span>
        </div>
        <p class="adv-card-desc">
          Strukturní vzorec nakreslíš přímo na plátně: zvol vazbu (jednoduchá, dvojná, trojná), prvek (C, H, O, N, P, S, F, Cl, Br) nebo kruh (benzen, cyklohexan, cyklopentan) a klikej či táhni myší. Klik prvkem na existující atom ho změní, klik do prázdna přidá nový atom. Tlačítko <em>Vytvořit 3D model</em> pak spočítá prostorové souřadnice včetně vodíků.
        </p>
        <img src={drawImg} alt="Záložka Kreslení v pokročilém vyhledávání s nakreslenou kyselinou salicylovou" loading="lazy" class="tutorial-img draw-img">
        <p class="image-caption">Ukázka: kyselina salicylová nakreslená v záložce Kreslení</p>
        <div class="adv-card-example">
          Online se 3D struktura počítá přes NIH CACTUS, bez internetu automaticky lokálně v prohlížeči (OpenBabel, silové pole MMFF94). Tip: záložku otevři jednou s připojením, aby se offline výpočet uložil do prohlížeče.
        </div>
      </div>
    </div>
  </details>

  <!-- Krok 2 -->
  <details id="step-2" class="step-container" bind:open={sectionOpen['step-2']}>
    <summary><h2>Krok 2: Rozhraní pro zobrazení</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Po načtení dat se ti zpřístupní nastavení modelu. Prvním krokem je výběr reprezentace molekuly.</p>
    <img src={step2Img} alt="UI ukázka screenshot s rozbaleným menu" loading="lazy" class="tutorial-img">
    <p class="image-caption">Obr. 2: UI ukázka s rozbaleným menu pro reprezentaci</p>
  </details>

  <!-- Krok 3 -->
  <details id="step-3" class="step-container" bind:open={sectionOpen['step-3']}>
    <summary><h2>Krok 3: Volba typu zobrazení</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Vyber si vzhled, který nejlépe vyhovuje tvým potřebám pro výuku nebo 3D tisk.</p>
    <img src={step3Img} alt="Výběr reprezentací molekuly" loading="lazy" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">Obr. 3: Nabídka rozbalovacího menu</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>Select Model Type:</strong> Zvol požadovaný vzhled (Spheres, Ball-and-Stick, Sticks, nebo náš tajný <span class="easter-egg">Minecraft</span> režim).</div></li>
    </ul>
  </details>

  <!-- Krok 4 a Interaktivní galerie -->
  <details id="step-4" class="step-container" bind:open={sectionOpen['step-4']}>
    <summary><h2>Krok 4: Nastavení parametrů a export</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Přizpůsob si detail a proporce modelu tak, aby se co nejlépe tiskl. Najetím myší na jednotlivé možnosti níže uvidíš, jak parametry vizuálně mění výsledek.</p>
    
    <!-- INTERAKTIVNÍ GALERIE -->
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
    <!-- KONEC GALERIE -->

    <img src={step4Img} alt="Ukázka parametrů u ball and stick" loading="lazy" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">Obr. 4: Parametry modelu a možnosti exportu</p>
    
    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>Model Settings:</strong> Zde můžeš upravit kvalitu, velikost modelu, průměr vazeb nebo zobrazení vodíků.</div></li>
      <li><span class="legend-number">5</span><div><strong>Možnosti exportu:</strong> Tlačítko <em>Download Template</em> stáhne čistá <code>.sdf</code> data molekuly. Modré tlačítko <em>One STL File</em> exportuje sloučený jednobarevný model.</div></li>
      <li><span class="legend-number">6</span><div><strong>Finální vícebarevný export:</strong> Zeleným tlačítkem <em>Download Model</em> stáhneš <code>.zip</code> archiv s modely oddělenými po atomech pro snazší přiřazení barev ve sliceru.</div></li>
    </ul>
  </details>

  <!-- Krok 5 -->
  <details id="step-5" class="step-container" bind:open={sectionOpen['step-5']}>
    <summary><h2>Krok 5: Aplikace změn (Reload)</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Na obrázku vidíš složitější model (ATP). Pamatuj, že po jakékoliv úpravě v sekci <em>Model Settings</em> se náhled neaktualizuje sám.</p>
    <img src={step5Img} alt="Ukázka aktualizace modelu pomocí tlačítka Reload" loading="lazy" class="tutorial-img">
    <p class="image-caption">Obr. 5: Ukázka modelu ATP a žlutého tlačítka Reload</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>Tlačítko Reload:</strong> Kdykoliv upravíš nastavení, vždy nejprve klikni na toto žluté tlačítko. Tím aplikuješ změny do 3D náhledu.</div></li>
    </ul>
  </details>

  <!-- SDÍLENÍ MODELU A NASTAVENÍ -->
  <details id="sharing" class="step-container" bind:open={sectionOpen['sharing']}>
    <summary><h2>Sdílení modelu a nastavení přes URL</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Svůj připravený model včetně přesného nastavení parametrů můžeš jednoduše poslat kolegům, studentům nebo si ho uložit do záložek pomocí URL odkazu.</p>

    <div class="share-tutorial-mockup" aria-label="Ukázka tlačítka sdílení a vyskakovacího okna s URL odkazem">
      <div class="share-mockup-popover">
        <div class="share-mockup-header">
          <span>Odkaz ke sdílení</span>
          <span class="share-mockup-close" aria-hidden="true">✕</span>
        </div>
        <div class="share-mockup-input-row">
          <div class="share-mockup-url">https://3dmolekuly.vscht.cz/?source=pubchem&amp;mol=caffeine&amp;style=ball-and-stick&amp;q=50</div>
          <div class="share-mockup-copy">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            Zkopírováno!
          </div>
        </div>
      </div>

      <div class="share-mockup-actions">
        <div class="share-mockup-download">
          <span class="material-symbols-outlined" aria-hidden="true">deployed_code_update</span>
          Download Model (.3mf)
        </div>
        <div class="share-mockup-slice">
          Slice ▾
        </div>
        <div class="share-mockup-square-btn" title="Sdílet">
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
        </div>
      </div>
    </div>
    <p class="image-caption">Obr. 6: Čtvercové tlačítko sdílení a vyskakovací okno s URL odkazem</p>

    <ul class="legend-list">
      <li><span class="legend-number">8</span><div><strong>Tlačítko Sdílet:</strong> Klikni na čtvercové tlačítko s ikonou sdílení (vedle tlačítka <em>Slice</em>). Odkaz se zkopíruje do schránky, tlačítko zezelená a přímo nad ním se otevře okno s textovým polem a celým URL odkazem. Odkaz v sobě nese zdroj databáze (<code>pubchem</code>, <code>pdb</code>, <code>cod</code>), název či kód molekuly, zvolený typ zobrazení i všechny upravené parametry, takže po jeho otevření se vše automaticky nastaví a vykreslí. Pokud pracuješ s vlastním nahraným souborem (<code>.sdf</code>, <code>.pdb</code>, <code>.cif</code>), odkaz slouží ke sdílení samotného typu zobrazení a nastavených hodnot (<code>source=file</code>), které se po otevření přednastaví pro nahrání vlastního modelu.</div></li>
    </ul>
  </details>

  <!-- OFFLINE POUŽITÍ A INSTALACE (PWA) -->
  <details id="offline-pwa" class="step-container" bind:open={sectionOpen['offline-pwa']}>
    <summary><h2>Offline použití a instalace jako aplikace (PWA)</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      3D Printing Molecules si můžeš nainstalovat jako aplikaci na plochu počítače nebo telefonu. Po prvním otevření s internetem se aplikace uloží do prohlížeče a dál ji můžeš používat i <strong>bez připojení k internetu</strong> – třeba ve třídě, v laboratoři nebo na cestách.
    </p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">computer</span>
        </span>
        <div>
          <strong>Instalace na počítači (Chrome, Edge):</strong>
          V adresním řádku klikni na ikonu <em>Instalovat aplikaci</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">install_desktop</span> (vpravo vedle adresy) a potvrď <em>Instalovat</em>. Aplikace se pak otevírá ve vlastním okně a najdeš ji v nabídce Start / Launchpadu.
        </div>
      </li>
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">phone_iphone</span>
        </span>
        <div>
          <strong>Instalace na mobilu:</strong>
          V <em>Safari</em> (iPhone, iPad) klepni na <em>Sdílet</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">ios_share</span> → <em>Přidat na plochu</em>. V <em>Chrome</em> (Android) otevři menu ⋮ → <em>Instalovat aplikaci</em> (případně <em>Přidat na plochu</em>).
        </div>
      </li>
    </ul>

    <div class="adv-sources-grid">
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #2e7d32;" aria-hidden="true">offline_pin</span>
            Funguje bez internetu
          </div>
        </div>
        <p class="adv-card-desc">
          Nahrání vlastních souborů z disku (<code>.sdf</code>, <code>.pdb</code>, <code>.cif</code>), 3D náhled a všechny typy zobrazení, úprava parametrů modelu, pohyblivé klouby, kontrola vodotěsnosti (manifold) i export do <code>.3mf</code> / <code>.stl</code> tlačítkem <em>Download Model</em>. Funguje i <em>Kreslení molekuly</em> v pokročilém vyhledávání – 3D model se spočítá lokálně.
        </p>
        <div class="adv-card-example">
          Veškeré výpočty (3D geometrie, Manifold, balení do ZIPu) běží přímo v tvém prohlížeči – na server se nic neodesílá.
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #e53935;" aria-hidden="true">cloud_off</span>
            Vyžaduje připojení
          </div>
        </div>
        <p class="adv-card-desc">
          Vyhledávání a stahování struktur z online katalogů – <strong>PubChem</strong>, <strong>PDB</strong> (včetně CCD ligandů), <strong>COD</strong> a převod SMILES přes NIH CACTUS. Bez internetu nefunguje ani tlačítko <em>Slice</em>, které otevírá model rovnou ve sliceru.
        </p>
        <div class="adv-card-example">
          Tip: Offline si model stáhni jako <code>.3mf</code> přes <em>Download Model</em> a do sliceru ho otevři ručně.
        </div>
      </div>
    </div>
  </details>

  <!-- INFORMACE K IMPORTU DO SLICERU -->
  <details id="slicer-import" class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;" bind:open={sectionOpen['slicer-import']}>
    <summary><h2>Jak importovat do sliceru?</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p style="font-size: 1.1rem; text-align: center;">
      Pro <strong>vícebarevný</strong> tisk molekuly se ujisti, že tě slicer upozorní hláškou <br>
      <em>„Byl detekován objekt o více částech“ (Multi-part object detected)</em>, <br>
      a následně potvrď volbou <strong>„ANO“ (YES)</strong>.
    </p>
    <img src="/assets/multipartobject.svg" alt="Dialog importu do sliceru" loading="lazy" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
  </details>

  <!-- SEKCE PRINTABLES A MAKERWORLD -->
  <details id="ready-models" class="step-container printables-container" bind:open={sectionOpen['ready-models']}>
    <summary><h2>Vyzkoušej již hotové modely na Printables a MakerWorld</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p class="printables-desc">
      Hledáš inspiraci nebo si chceš rovnou vytisknout oblíbené molekuly bez nutnosti nastavování? Prozkoumej naši sbírku hotových, ověřených 3D modelů molekul přímo na Printables a MakerWorld.
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
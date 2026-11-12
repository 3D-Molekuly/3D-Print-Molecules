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
            name: "Qualité de maillage par défaut (Qualité : 50)", 
            img: sphereQ50Img, 
            desc: "Réglage standard pour un modèle sphérique net et lisse." 
        },
        { 
            name: "Faible qualité (Qualité : 5)", 
            img: sphereQ5Img, 
            desc: "Réduit fortement le nombre de polygones. Convient à un rendu « low poly » particulier ou à un affichage plus rapide de très grosses molécules." 
        },
        { 
            name: "Masquer les hydrogènes", 
            img: sphereHoffImg, 
            desc: "Désactive l’affichage des atomes d’hydrogène, ce qui peut grandement simplifier les molécules organiques complexes." 
        },
        { 
            name: "Ball-and-Stick par défaut", 
            img: waterBasImg, 
            desc: "Représentation de base d’une molécule d’eau en mode boules et bâtonnets." 
        },
        { 
            name: "Afficher les liaisons multiples", 
            img: co2MultImg, 
            desc: "Pour le dioxyde de carbone (CO2), représente les doubles liaisons entre le carbone et l’oxygène (au lieu de la liaison simple par défaut)." 
        },
        { 
            name: "Diamètre d’atome uniforme", 
            img: waterUniformImg, 
            desc: "Uniformise la taille de tous les atomes du modèle, indépendamment de leur rayon de van der Waals réel." 
        },
        { 
            name: "Regrouper les liaisons séparément", 
            img: waterGroupImg, 
            desc: "Lors de l’export, sépare les liaisons en pièces distinctes, ce qui facilite la coloration et la préparation de l’impression 3D multicolore." 
        },
        { 
            name: "Échelle plus grande (Facteur d’échelle : 1,5)", 
            img: waterMultImg, 
            desc: "Augmente le volume global et les diamètres des éléments du modèle pour un objet physique plus massif." 
        },
        { 
            name: "Épaisseur des liaisons (Diamètre des liaisons : 0,6)", 
            img: waterBondDiaImg, 
            desc: "Épaissit les bâtonnets reliant les atomes pour rendre le modèle imprimé mécaniquement plus solide." 
        }
    ];

    // Default selected option in the gallery
    let activeOption = settingsOptions[0];

    // --- TABLE OF CONTENTS (IDs match the sections below) ---
    const tocItems = [
        { id: 'step-1', label: 'Étape 1 : choisir une molécule' },
        { id: 'advanced-search', label: 'Recherche avancée' },
        { id: 'step-2', label: 'Étape 2 : interface d’affichage' },
        { id: 'step-3', label: 'Étape 3 : type de représentation' },
        { id: 'step-4', label: 'Étape 4 : paramètres et export' },
        { id: 'step-5', label: 'Étape 5 : appliquer les modifications (Recharger)' },
        { id: 'sharing', label: 'Partage par URL' },
        { id: 'offline-pwa', label: 'Hors ligne et installation (PWA)' },
        { id: 'slicer-import', label: 'Import dans un trancheur' },
        { id: 'ready-models', label: 'Modèles prêts à imprimer' }
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
      Sommaire
      <span class="material-symbols-outlined toc-chevron" aria-hidden="true">expand_more</span>
    </summary>
    <button type="button" class="toc-toggle-all" on:click={toggleAllSections}>
      <span class="material-symbols-outlined" aria-hidden="true">{allSectionsOpen ? 'unfold_less' : 'unfold_more'}</span>
      {allSectionsOpen ? 'Tout replier' : 'Tout déplier'}
    </button>
    <nav aria-label="Sommaire du tutoriel">
      <ol class="toc-list">
        {#each tocItems as item (item.id)}
          <li><a href="#{item.id}" on:click={() => (sectionOpen[item.id] = true)}>{item.label}</a></li>
        {/each}
      </ol>
    </nav>
  </details>
</aside>

<section class="tutorial">
  <h1>Comment utiliser Impression 3D de molécules</h1>
  <p style="text-align: center; margin-bottom: 1.5rem;">
    Préparer un modèle de molécule pour l’impression 3D n’a jamais été aussi simple. Tout le processus se résume en trois étapes rapides :
  </p>

  <!-- FLOW SCHEMA -->
  <div class="flow-schema">
    <div class="flow-step-badge">Saisir le nom</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Générer le modèle</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Télécharger</div>
  </div>

  <!-- Step 1 -->
  <details id="step-1" class="step-container" bind:open={sectionOpen['step-1']}>
    <summary><h2>Étape 1 : choisir une molécule</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Indiquez d’abord au programme quelle substance vous souhaitez modéliser. Vous pouvez utiliser l’import automatique ou importer vos propres données.</p>
    <img src={step1Img} alt="Capture d’écran de l’interface montrant la recherche" class="tutorial-img">
    <p class="image-caption">Fig. 1 : interface de recherche PubChem</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>Recherche :</strong> saisissez le nom anglais de la substance dans le champ « Rechercher dans PubChem » et appuyez sur Entrée. Les données sont téléchargées automatiquement depuis la base de données publique. Outre les noms, vous pouvez aussi saisir un numéro CAS, un CID PubChem, une <strong>formule brute</strong> (<code>H2O</code>, <code>CO2</code>, <code>H2SO4</code> – la casse n’a pas d’importance, <code>h2so4</code> ou <code>H₂O</code> fonctionnent aussi) ou un <strong>SMILES</strong> (p. ex. <code>CC(=O)OC1=CC=CC=C1C(=O)O</code>). Une formule charge le composé le plus pertinent ; lorsque plusieurs composés la partagent (isomères), choisissez celui qui vous intéresse dans la recherche avancée.</div></li>
      <li><span class="legend-number">2</span><div><strong>Vos propres données :</strong> importez un fichier <code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code> ou ChemDraw (<code>.cdx</code>, <code>.cdxml</code>) avec le bouton <em>Importer un fichier</em>, faites-le glisser sur la fenêtre ou collez-le avec <kbd>Ctrl</kbd>+<kbd>V</kbd>. Le modèle se charge immédiatement. Les structures 2D (typiquement exportées depuis ChemDraw ou Marvin, sans hydrogènes) sont converties automatiquement en 3D et les hydrogènes sont ajoutés.</div></li>
    </ul>
  </details>

  <!-- ADVANCED SEARCH -->
  <details id="advanced-search" class="step-container" bind:open={sectionOpen['advanced-search']}>
    <summary><h2>Recherche avancée et saisies spécifiques</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      Besoin de modéliser un composé à partir d’une chaîne SMILES, une macromolécule de la Protein Data Bank, un réseau cristallin ou un cofacteur lié à un métal ? L’application propose une recherche avancée dans plusieurs bases de données.
    </p>

    <div class="adv-search-mockup" aria-label="Maquette de la barre de recherche et de la recherche avancée">
      <!-- Search bar mockup -->
      <div class="adv-search-bar-mockup">
        <span class="material-symbols-outlined" style="color: #64748b; font-size: 1.25rem;" aria-hidden="true">search</span>
        <div class="adv-search-input-text">
          <span class="adv-search-prefix-highlight">smiles:</span>CC(=O)Oc1ccccc1C(=O)O
        </div>
        <div class="adv-gear-btn-mockup" title="Recherche avancée">
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
          PDB / Ligands
        </span>
        <span class="adv-tab-pill active">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">science</span>
          SMILES → 3D
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">grain</span>
          COD (cristaux)
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">draw</span>
          Dessiner
        </span>
      </div>
    </div>
    <p class="image-caption">Exemple : barre de recherche avec préfixe et onglets de la boîte de dialogue Recherche avancée</p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">A</span>
        <div>
          <strong>Icône d’engrenage (paramètres de recherche) :</strong>
          cliquez sur le bouton en forme d’engrenage <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">settings</span> à droite de la barre de recherche principale pour ouvrir la fenêtre <em>Recherche avancée</em>. Vous pouvez y passer d’une base de données à l’autre grâce aux onglets, utiliser des filtres interactifs (comme la sélection de chaîne pour la PDB) ou essayer des molécules d’exemple préconfigurées.
        </div>
      </li>
      <li>
        <span class="legend-number">B</span>
        <div>
          <strong>Préfixes directs dans le champ de recherche :</strong>
          inutile même d’ouvrir la fenêtre : il suffit de saisir un préfixe suivi de deux-points directement dans la barre de recherche principale. L’application détecte automatiquement le type de requête et l’envoie au service correspondant. Les formules brutes et les SMILES sont reconnus même sans préfixe.
        </div>
      </li>
    </ul>

    <!-- Input source cards -->
    <div class="adv-sources-grid">
      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">database</span>
            PubChem : formules, isomères et conformères 3D
          </div>
          <span class="adv-prefix-badge">formula: / conformer:</span>
        </div>
        <p class="adv-card-desc">
          Saisissez une formule brute dans l’onglet <em>PubChem</em> pour lister tous les composés ayant cette formule, classés par pertinence – pour <code>C2H6O</code>, par exemple, l’éthanol et l’éther diméthylique – et choisissez le bon. Si la case <em>Choisir un conformère 3D</em> est cochée, l’application propose, au lieu de la structure par défaut, jusqu’à 10 conformations spatiales calculées par PubChem pour ce composé. Chacune affiche son énergie MMFF94 et, entre parenthèses, l’écart par rapport à la plus stable. Utile pour montrer la flexibilité des molécules ou imprimer plusieurs conformations côte à côte. Le conformère est conservé dans l’historique de recherche et dans les liens partagés.
        </p>
        <div class="adv-card-example">
          Exemples : <code>H2SO4</code>, <code>C2H6O</code> (isomères), Aspirin + <em>Choisir un conformère 3D</em>. Les sels et les complexes métalliques n’ont souvent pas de conformère 3D – l’application propose alors une conversion 2D → 3D.
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">upload_file</span>
            Fichiers ChemDraw et .mol
          </div>
          <span class="adv-prefix-badge">Import / glisser-déposer / Ctrl+V</span>
        </div>
        <p class="adv-card-desc">
          Il existe trois façons de transférer une structure depuis ChemDraw : l’enregistrer au format <code>.cdx</code> ou <code>.cdxml</code> et importer le fichier ; utiliser <em>Edit → Copy As → MOL Text</em> ou <em>CDXML Text</em> puis coller avec <kbd>Ctrl</kbd>+<kbd>V</kbd> n’importe où dans l’application (en dehors des autres champs de texte) ; ou utiliser <em>Copy As → SMILES</em> et coller le résultat dans la barre de recherche. Un fichier <code>.mol</code> issu de ChemDraw, Marvin, ChemSketch ou d’un autre éditeur fonctionne de la même manière. Les structures dessinées (2D) n’ont ni coordonnées spatiales ni hydrogènes ; elles sont donc converties automatiquement en 3D – en ligne via NIH CACTUS, hors ligne localement (OpenBabel). Les abréviations de groupes (Ph, OMe…) sont développées, et les charges ainsi que la stéréochimie indiquée par les liaisons en coin sont conservées.
        </p>
        <div class="adv-card-example">
          Les fichiers qui contiennent déjà des coordonnées 3D (p. ex. exportés depuis Avogadro ou un SDF 3D de PubChem) sont chargés tels quels.
        </div>
      </div>
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">science</span>
            SMILES et InChI
          </div>
          <span class="adv-prefix-badge">smiles: / cactus:</span>
        </div>
        <p class="adv-card-desc">
          Convertit une notation chimique linéaire directement en coordonnées 3D grâce à NIH CACTUS CIR (avec repli sur PubChem 3D). Idéal pour les composés personnalisés, synthétiques ou exotiques absents des catalogues habituels. Les SMILES comportant des ramifications, des cycles ou des liaisons multiples (p. ex. le résultat de <em>Copy As → SMILES</em> dans ChemDraw) sont reconnus même sans préfixe.
        </p>
        <div class="adv-card-example">
          Exemples : <code>smiles: CC(=O)Oc1ccccc1C(=O)O</code> (aspirine), <code>smiles: C1CCCCC1</code> (cyclohexane), <code>smiles: C12C3C4C1C5C2C3C45</code> (cubane)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">biotech</span>
            Macromolécules PDB
          </div>
          <span class="adv-prefix-badge">pdb:</span>
        </div>
        <p class="adv-card-desc">
          Récupère des structures macromoléculaires depuis la Protein Data Bank (protéines, enzymes, ADN, ARN). Dans la boîte de dialogue Recherche avancée, vous pouvez aussi choisir une chaîne particulière et inclure ou non les molécules d’eau cristalline.
        </p>
        <div class="adv-card-example">
          Exemples : <code>pdb: 1CRN</code> (crambine), <code>pdb: 1BNA</code> (ADN-B), <code>pdb: 1CRN:A</code> (chaîne A)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">category</span>
            Ligands et cofacteurs CCD
          </div>
          <span class="adv-prefix-badge">ccd:</span>
        </div>
        <p class="adv-card-desc">
          Télécharge des ligands et des cofacteurs depuis le Chemical Component Dictionary de la PDB. Parfait pour imprimer en 3D des cofacteurs complexés à un métal, des colorants et des médicaments liés à des macromolécules.
        </p>
        <div class="adv-card-example">
          Exemples : <code>ccd: HEM</code> (hème), <code>ccd: ATP</code>, <code>ccd: CLA</code> (chlorophylle a)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">grain</span>
            Cristaux et minéraux COD
          </div>
          <span class="adv-prefix-badge">cod:</span>
        </div>
        <p class="adv-card-desc">
          Interroge la Crystallography Open Database. Permet de charger des réseaux cristallins inorganiques, des sels et des minéraux par nom (recherche en texte intégral), formule empirique ou identifiant COD numérique.
        </p>
        <div class="adv-card-example">
          Exemples : <code>cod: 1506182</code>, <code>cod: CaCO3</code> (calcite), <code>cod: quartz</code>, <code>cod: NaCl</code>
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">draw</span>
            Dessin 2D → 3D
          </div>
          <span class="adv-prefix-badge">Onglet Dessiner</span>
        </div>
        <p class="adv-card-desc">
          Dessinez une formule développée directement sur le canevas : choisissez une liaison (simple, double, triple, ou en coin plein/hachurée pour la stéréochimie), un élément (C, H, O, N, P, S, F, Cl, Br, I, B, Si, Se, ou tout autre élément du menu <em>Autre</em>) ou un cycle (benzène, cyclohexane, cyclopentane ; d’autres cycloalcanes et hétérocycles comme la pyridine ou le furane sous <em>Autres cycles</em>), puis cliquez ou faites glisser. Les outils <em>+</em>/<em>−</em> fixent la charge des atomes, et la formule ainsi que le SMILES du dessin s’affichent en direct sous le canevas. Cliquer sur un atome existant avec un élément le remplace ; cliquer sur une zone vide ajoute un nouvel atome. Le bouton <em>Générer le modèle 3D</em> calcule ensuite les coordonnées 3D, hydrogènes compris.
        </p>
        <img src={drawImg} alt="Onglet Dessiner de la recherche avancée avec l’acide salicylique dessiné sur le canevas" loading="lazy" class="tutorial-img draw-img">
        <p class="image-caption">Exemple : acide salicylique dessiné dans l’onglet Dessiner</p>
        <div class="adv-card-example">
          En ligne, la structure 3D est fournie par NIH CACTUS ; sans Internet, elle est calculée localement dans votre navigateur (OpenBabel, champ de force MMFF94). Astuce : ouvrez une fois l’onglet en étant en ligne afin que le moteur hors ligne soit enregistré dans votre navigateur (l’application installée le fait automatiquement).
        </div>
      </div>
    </div>
  </details>

  <!-- Step 2 -->
  <details id="step-2" class="step-container" bind:open={sectionOpen['step-2']}>
    <summary><h2>Étape 2 : interface d’affichage</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Une fois les données chargées, les réglages du modèle deviennent disponibles. La première étape consiste à choisir la représentation de la molécule.</p>
    <img src={step2Img} alt="Capture d’écran de l’interface avec le menu déroulant ouvert" loading="lazy" class="tutorial-img">
    <p class="image-caption">Fig. 2 : interface avec le menu déroulant des représentations</p>
  </details>

  <!-- Step 3 -->
  <details id="step-3" class="step-container" bind:open={sectionOpen['step-3']}>
    <summary><h2>Étape 3 : choisir le type de représentation</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Choisissez l’apparence la mieux adaptée à vos besoins, pour l’enseignement ou pour l’impression 3D.</p>
    <img src={step3Img} alt="Choix de la représentation de la molécule" loading="lazy" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">Fig. 3 : options du menu déroulant</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>Choisir le type de modèle :</strong> sélectionnez l’apparence souhaitée (Spheres, Ball-and-Stick, Sticks, ou notre mode secret <span class="easter-egg">Minecraft</span>).</div></li>
    </ul>
  </details>

  <!-- Step 4 and Interactive Gallery -->
  <details id="step-4" class="step-container" bind:open={sectionOpen['step-4']}>
    <summary><h2>Étape 4 : réglage des paramètres et export</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Ajustez les détails et les proportions du modèle pour une impression optimale. Survolez les différentes options ci-dessous pour voir comment les paramètres modifient visuellement le résultat.</p>

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

    <img src={step4Img} alt="Exemple de paramètres du mode boules et bâtonnets" loading="lazy" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">Fig. 4 : paramètres du modèle et options d’export</p>

    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>Réglages du modèle :</strong> vous pouvez ici ajuster la qualité, la taille du modèle, le diamètre des liaisons ou l’affichage des hydrogènes.</div></li>
      <li><span class="legend-number">5</span><div><strong>Options d’export :</strong> le bouton <em>Télécharger le gabarit</em> télécharge les données brutes <code>.sdf</code> de la molécule. Le bouton bleu <em>Un seul fichier STL</em> exporte un modèle fusionné d’une seule couleur.</div></li>
      <li><span class="legend-number">6</span><div><strong>Export multicolore final :</strong> le bouton vert <em>Télécharger le modèle</em> vous permet de télécharger une archive <code>.zip</code> contenant les modèles séparés par atome, pour attribuer plus facilement les couleurs dans le trancheur.</div></li>
    </ul>
  </details>

  <!-- Step 5 -->
  <details id="step-5" class="step-container" bind:open={sectionOpen['step-5']}>
    <summary><h2>Étape 5 : appliquer les modifications (Recharger)</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>L’image montre un modèle plus complexe (ATP). N’oubliez pas qu’après toute modification dans la section <em>Réglages du modèle</em>, l’aperçu ne se met pas à jour automatiquement.</p>
    <img src={step5Img} alt="Mise à jour du modèle avec le bouton Recharger" loading="lazy" class="tutorial-img">
    <p class="image-caption">Fig. 5 : modèle de l’ATP et bouton jaune Recharger</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>Bouton Recharger :</strong> chaque fois que vous modifiez les réglages, cliquez d’abord sur ce bouton jaune. Il applique les modifications à l’aperçu 3D.</div></li>
    </ul>
  </details>

  <!-- SHARING MODEL AND SETTINGS -->
  <details id="sharing" class="step-container" bind:open={sectionOpen['sharing']}>
    <summary><h2>Partager des modèles et des réglages par URL</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Vous pouvez facilement partager la molécule que vous avez préparée, avec ses réglages exacts, avec des collègues ou des élèves, ou l’ajouter à vos favoris grâce à un lien URL partageable.</p>

    <div class="share-tutorial-mockup" aria-label="Illustration du bouton Partager et de la fenêtre flottante avec l’URL">
      <div class="share-mockup-popover">
        <div class="share-mockup-header">
          <span>Lien de partage</span>
          <span class="share-mockup-close" aria-hidden="true">✕</span>
        </div>
        <div class="share-mockup-input-row">
          <div class="share-mockup-url">https://3dmolekuly.vscht.cz/?source=pubchem&amp;mol=caffeine&amp;style=ball-and-stick&amp;q=50</div>
          <div class="share-mockup-copy">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            Copié !
          </div>
        </div>
      </div>

      <div class="share-mockup-actions">
        <div class="share-mockup-download">
          <span class="material-symbols-outlined" aria-hidden="true">deployed_code_update</span>
          Télécharger le modèle (.3mf)
        </div>
        <div class="share-mockup-slice">
          Trancher ▾
        </div>
        <div class="share-mockup-square-btn" title="Partager">
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
        </div>
      </div>
    </div>
    <p class="image-caption">Fig. 6 : bouton carré Partager et fenêtre flottante avec le lien URL</p>

    <ul class="legend-list">
      <li><span class="legend-number">8</span><div><strong>Bouton Partager :</strong> cliquez sur le bouton carré de partage (à côté du bouton <em>Trancher</em>). L’URL est copiée dans le presse-papiers, le bouton devient vert et une fenêtre apparaît juste au-dessus, affichant le lien complet. L’URL encode la source de données (<code>pubchem</code>, <code>pdb</code>, <code>cod</code>), le nom ou le code de la molécule, le type d’affichage choisi et tous les paramètres configurés : ouvrir le lien applique donc automatiquement tous les réglages et affiche le modèle. Un conformère 3D choisi dans PubChem est lui aussi conservé dans le lien (<code>conformer:…</code>). Si vous travaillez avec un fichier local importé (<code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code>, ChemDraw), le lien ne partage que le type d’affichage et les valeurs configurées (<code>source=file</code>), ce qui préconfigure tout pour la personne qui importera son propre fichier.</div></li>
    </ul>
  </details>

  <!-- OFFLINE USAGE AND PWA INSTALLATION -->
  <details id="offline-pwa" class="step-container" bind:open={sectionOpen['offline-pwa']}>
    <summary><h2>Utilisation hors ligne et installation (PWA)</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      Vous pouvez installer Impression 3D de molécules comme une application sur votre ordinateur ou votre téléphone. Après une première visite avec une connexion Internet, l’application est enregistrée dans votre navigateur et continue de fonctionner <strong>sans connexion Internet</strong> – en classe, au laboratoire ou en déplacement.
    </p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">computer</span>
        </span>
        <div>
          <strong>Installation sur un ordinateur (Chrome, Edge) :</strong>
          cliquez sur l’icône <em>Installer l’application</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">install_desktop</span> dans la barre d’adresse (juste à côté de l’URL) et confirmez avec <em>Installer</em>. L’application s’ouvre alors dans sa propre fenêtre et apparaît dans le menu Démarrer / le Launchpad.
        </div>
      </li>
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">phone_iphone</span>
        </span>
        <div>
          <strong>Installation sur un téléphone :</strong>
          dans <em>Safari</em> (iPhone, iPad), touchez <em>Partager</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">ios_share</span> → <em>Sur l’écran d’accueil</em>. Dans <em>Chrome</em> (Android), ouvrez le menu ⋮ → <em>Installer l’application</em> (ou <em>Ajouter à l’écran d’accueil</em>).
        </div>
      </li>
    </ul>

    <div class="adv-sources-grid">
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #2e7d32;" aria-hidden="true">offline_pin</span>
            Fonctionne hors ligne
          </div>
        </div>
        <p class="adv-card-desc">
          L’import de vos propres fichiers depuis le disque (<code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code>, ChemDraw <code>.cdx</code>/<code>.cdxml</code> ; les structures 2D sont converties en 3D par un calcul local), l’aperçu 3D et tous les types de représentation, la modification des paramètres du modèle, les articulations mobiles, la vérification d’étanchéité (manifold) et l’export en <code>.3mf</code> / <code>.stl</code> avec le bouton <em>Télécharger le modèle</em>. Le <em>dessin de molécule</em> de la recherche avancée fonctionne aussi – le modèle 3D est calculé localement (OpenBabel). Il faut pour cela que le module de calcul (~8 Mo) soit déjà enregistré sur votre appareil : dans le navigateur, ouvrez au moins une fois l’onglet Dessiner en étant en ligne ; l’application installée (PWA) le télécharge automatiquement lorsqu’elle est lancée en ligne.
        </p>
        <div class="adv-card-example">
          Tous les calculs (géométrie 3D, Manifold, création du ZIP) s’exécutent directement dans votre navigateur – rien n’est envoyé à un serveur.
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #e53935;" aria-hidden="true">cloud_off</span>
            Nécessite une connexion
          </div>
        </div>
        <p class="adv-card-desc">
          La recherche et le téléchargement de structures depuis les catalogues en ligne – <strong>PubChem</strong>, <strong>PDB</strong> (y compris les ligands CCD), <strong>COD</strong> – ainsi que la conversion des SMILES via NIH CACTUS. Le bouton <em>Trancher</em>, qui ouvre le modèle directement dans un trancheur, nécessite lui aussi Internet.
        </p>
        <div class="adv-card-example">
          Astuce : hors ligne, téléchargez le modèle en <code>.3mf</code> via <em>Télécharger le modèle</em> et ouvrez-le manuellement dans votre trancheur.
        </div>
      </div>
    </div>
  </details>

  <!-- SLICER IMPORT INFO -->
  <details id="slicer-import" class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;" bind:open={sectionOpen['slicer-import']}>
    <summary><h2>Comment importer dans le trancheur ?</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p style="font-size: 1.1rem; text-align: center;">
      Pour imprimer une molécule en <strong>plusieurs couleurs</strong>, vérifiez que le trancheur affiche le message <br>
      <em>« Multi-part object detected / Un objet en plusieurs parties a été détecté »</em>, <br>
      puis confirmez en choisissant <strong>« OUI »</strong>.
    </p>
    <img src="/assets/multipartobject.svg" alt="Boîte de dialogue d’import du trancheur" loading="lazy" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
    <PrusaSlicerPluginNote />
  </details>

  <!-- PRINTABLES AND MAKERWORLD SECTION -->
  <details id="ready-models" class="step-container printables-container" bind:open={sectionOpen['ready-models']}>
    <summary><h2>Essayez nos modèles prêts à imprimer sur Printables et MakerWorld</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p class="printables-desc">
      Vous cherchez l’inspiration ou souhaitez imprimer directement des molécules populaires sans toucher aux réglages ? Découvrez notre collection de modèles 3D de molécules vérifiés et prêts à imprimer, directement sur Printables et MakerWorld.
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

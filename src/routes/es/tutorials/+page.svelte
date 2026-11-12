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
            name: "Calidad de malla predeterminada (Calidad: 50)", 
            img: sphereQ50Img, 
            desc: "Ajuste estándar para un modelo esférico bonito y suave." 
        },
        { 
            name: "Calidad baja (Calidad: 5)", 
            img: sphereQ5Img, 
            desc: "Reduce considerablemente el número de polígonos. Adecuado para un aspecto 'low-poly' o para renderizar más rápido moléculas enormes." 
        },
        { 
            name: "Ocultar hidrógenos", 
            img: sphereHoffImg, 
            desc: "Desactiva la visualización de los átomos de hidrógeno, lo que puede simplificar mucho las moléculas orgánicas complejas." 
        },
        { 
            name: "Bolas y varillas predeterminado", 
            img: waterBasImg, 
            desc: "Representación básica de una molécula de agua en el modo de bolas y varillas." 
        },
        { 
            name: "Mostrar enlaces múltiples", 
            img: co2MultImg, 
            desc: "En el dióxido de carbono (CO2), muestra los enlaces dobles entre el carbono y el oxígeno (en lugar del enlace simple predeterminado)." 
        },
        { 
            name: "Diámetro de átomo uniforme", 
            img: waterUniformImg, 
            desc: "Iguala el tamaño de todos los átomos del modelo, independientemente de su radio de van der Waals real." 
        },
        { 
            name: "Agrupar enlaces por separado", 
            img: waterGroupImg, 
            desc: "Al exportar, separa los enlaces en piezas individuales, lo que facilita asignar colores y preparar la impresión 3D multicolor." 
        },
        { 
            name: "Escala mayor (Factor de multiplicación: 1,5)", 
            img: waterMultImg, 
            desc: "Aumenta el volumen total y los diámetros de los elementos del modelo para obtener una pieza física más robusta." 
        },
        { 
            name: "Grosor de los enlaces (Diámetro de enlace: 0,6)", 
            img: waterBondDiaImg, 
            desc: "Engrosa las varillas que unen los átomos para que el modelo impreso sea mecánicamente más resistente." 
        }
    ];

    // Default selected option in the gallery
    let activeOption = settingsOptions[0];

    // --- TABLE OF CONTENTS (IDs match the sections below) ---
    const tocItems = [
        { id: 'step-1', label: 'Paso 1: Selecciona una molécula' },
        { id: 'advanced-search', label: 'Búsqueda avanzada' },
        { id: 'step-2', label: 'Paso 2: Interfaz de visualización' },
        { id: 'step-3', label: 'Paso 3: Tipo de representación' },
        { id: 'step-4', label: 'Paso 4: Parámetros y exportación' },
        { id: 'step-5', label: 'Paso 5: Aplicar cambios (Recargar)' },
        { id: 'sharing', label: 'Compartir mediante URL' },
        { id: 'offline-pwa', label: 'Sin conexión e instalación (PWA)' },
        { id: 'slicer-import', label: 'Importar en el laminador' },
        { id: 'ready-models', label: 'Modelos listos para imprimir' }
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
      Contenido
      <span class="material-symbols-outlined toc-chevron" aria-hidden="true">expand_more</span>
    </summary>
    <button type="button" class="toc-toggle-all" on:click={toggleAllSections}>
      <span class="material-symbols-outlined" aria-hidden="true">{allSectionsOpen ? 'unfold_less' : 'unfold_more'}</span>
      {allSectionsOpen ? 'Contraer todo' : 'Expandir todo'}
    </button>
    <nav aria-label="Contenido del tutorial">
      <ol class="toc-list">
        {#each tocItems as item (item.id)}
          <li><a href="#{item.id}" on:click={() => (sectionOpen[item.id] = true)}>{item.label}</a></li>
        {/each}
      </ol>
    </nav>
  </details>
</aside>

<section class="tutorial">
  <h1>Cómo usar Impresión 3D de moléculas</h1>
  <p style="text-align: center; margin-bottom: 1.5rem;">
    Preparar un modelo de una molécula para la impresión 3D nunca ha sido tan fácil. Todo el proceso se resume en tres pasos rápidos:
  </p>

  <!-- FLOW SCHEMA -->
  <div class="flow-schema">
    <div class="flow-step-badge">Escribe el nombre</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Genera el modelo</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Descárgalo</div>
  </div>

  <!-- Step 1 -->
  <details id="step-1" class="step-container" bind:open={sectionOpen['step-1']}>
    <summary><h2>Paso 1: Selecciona una molécula</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Primero, indica al programa qué sustancia quieres modelar. Puedes usar la importación automática o subir tus propios datos.</p>
    <img src={step1Img} alt="Captura de la interfaz con la búsqueda" class="tutorial-img">
    <p class="image-caption">Fig. 1: Interfaz de búsqueda en PubChem</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>Búsqueda:</strong> Escribe el nombre en inglés de la sustancia en el campo "Buscar en PubChem" y pulsa Enter. Los datos se descargarán automáticamente de la base de datos pública. Además del nombre, también puedes introducir un número CAS, un CID de PubChem, una <strong>fórmula molecular</strong> (<code>H2O</code>, <code>CO2</code>, <code>H2SO4</code>; da igual mayúsculas o minúsculas, también funcionan <code>h2so4</code> o <code>H₂O</code>) o un <strong>SMILES</strong> (p. ej., <code>CC(=O)OC1=CC=CC=C1C(=O)O</code>). Una fórmula carga el compuesto más relevante; si varios compuestos la comparten (isómeros), elige el que quieras en la Búsqueda avanzada.</div></li>
      <li><span class="legend-number">2</span><div><strong>Datos propios:</strong> Sube un archivo <code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code> o de ChemDraw (<code>.cdx</code>, <code>.cdxml</code>) con el botón <em>Subir archivo</em>, arrástralo a la ventana o pégalo con <kbd>Ctrl</kbd>+<kbd>V</kbd>. El modelo se carga al instante. Las estructuras 2D (normalmente exportadas de ChemDraw o Marvin, sin hidrógenos) se convierten automáticamente a 3D y se les añaden los hidrógenos.</div></li>
    </ul>
  </details>

  <!-- ADVANCED SEARCH -->
  <details id="advanced-search" class="step-container" bind:open={sectionOpen['advanced-search']}>
    <summary><h2>Búsqueda avanzada y entradas específicas</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      ¿Necesitas modelar un compuesto a partir de una cadena SMILES, una macromolécula del Protein Data Bank, una red cristalina o un cofactor con un metal unido? La aplicación permite búsquedas avanzadas en varias bases de datos.
    </p>

    <div class="adv-search-mockup" aria-label="Maqueta de la barra de búsqueda y de la búsqueda avanzada">
      <!-- Search bar mockup -->
      <div class="adv-search-bar-mockup">
        <span class="material-symbols-outlined" style="color: #64748b; font-size: 1.25rem;" aria-hidden="true">search</span>
        <div class="adv-search-input-text">
          <span class="adv-search-prefix-highlight">smiles:</span>CC(=O)Oc1ccccc1C(=O)O
        </div>
        <div class="adv-gear-btn-mockup" title="Búsqueda avanzada">
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
          PDB / Ligandos
        </span>
        <span class="adv-tab-pill active">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">science</span>
          SMILES → 3D
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">grain</span>
          COD (cristales)
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">draw</span>
          Dibujar
        </span>
      </div>
    </div>
    <p class="image-caption">Ejemplo: barra de búsqueda con prefijo y pestañas del diálogo de Búsqueda avanzada</p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">A</span>
        <div>
          <strong>Icono de engranaje (ajustes de búsqueda):</strong>
          Haz clic en el botón de engranaje <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">settings</span> a la derecha de la barra de búsqueda principal para abrir la ventana de <em>Búsqueda avanzada</em>. Ahí puedes cambiar de base de datos mediante pestañas, usar filtros interactivos (como la selección de cadena en PDB) o probar moléculas de ejemplo ya preparadas.
        </div>
      </li>
      <li>
        <span class="legend-number">B</span>
        <div>
          <strong>Prefijos directos en el campo de búsqueda:</strong>
          Ni siquiera tienes que abrir la ventana: basta con escribir un prefijo seguido de dos puntos directamente en el cuadro de búsqueda principal. La aplicación detecta automáticamente el tipo de consulta y la envía al servicio correspondiente. Las fórmulas moleculares y los SMILES se reconocen incluso sin prefijo.
        </div>
      </li>
    </ul>

    <!-- Input source cards -->
    <div class="adv-sources-grid">
      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">database</span>
            PubChem: fórmulas, isómeros y confórmeros 3D
          </div>
          <span class="adv-prefix-badge">formula: / conformer:</span>
        </div>
        <p class="adv-card-desc">
          Escribe una fórmula molecular en la pestaña <em>PubChem</em> para ver todos los compuestos con esa fórmula ordenados por relevancia (para <code>C2H6O</code>, por ejemplo, tanto el etanol como el éter dimetílico) y elige el correcto. Con la opción <em>Elegir un confórmero 3D</em> marcada, la aplicación ofrece, en lugar de la estructura predeterminada, hasta 10 conformaciones espaciales que PubChem ha calculado para el compuesto. Cada una muestra su energía MMFF94 y, entre paréntesis, la diferencia respecto a la más estable. Resulta útil para demostrar la flexibilidad molecular o imprimir varias conformaciones una al lado de otra. El confórmero se conserva en el historial de búsqueda y en los enlaces compartidos.
        </p>
        <div class="adv-card-example">
          Ejemplos: <code>H2SO4</code>, <code>C2H6O</code> (isómeros), Aspirin + <em>Elegir un confórmero 3D</em>. Las sales y los complejos metálicos a menudo no tienen confórmeros 3D; en ese caso, la aplicación ofrece una conversión 2D → 3D.
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">upload_file</span>
            Archivos de ChemDraw y .mol
          </div>
          <span class="adv-prefix-badge">Subir / arrastrar y soltar / Ctrl+V</span>
        </div>
        <p class="adv-card-desc">
          Hay tres formas de traer una estructura desde ChemDraw: guardarla como <code>.cdx</code> o <code>.cdxml</code> y subir el archivo; usar <em>Edit → Copy As → MOL Text</em> o <em>CDXML Text</em> y pegarla con <kbd>Ctrl</kbd>+<kbd>V</kbd> en cualquier parte de la aplicación (fuera de otros campos de texto); o usar <em>Copy As → SMILES</em> y pegarla en el cuadro de búsqueda. Un archivo <code>.mol</code> de ChemDraw, Marvin, ChemSketch u otro editor funciona igual. Las estructuras dibujadas (2D) no tienen coordenadas espaciales ni hidrógenos, por lo que se convierten automáticamente a 3D: en línea mediante NIH CACTUS y sin conexión de forma local (OpenBabel). Las abreviaturas de grupos (Ph, OMe…) se expanden, y se conservan las cargas y la estereoquímica de los enlaces en cuña.
        </p>
        <div class="adv-card-example">
          Los archivos que ya contienen coordenadas 3D (p. ej., exportados de Avogadro o un SDF 3D de PubChem) se cargan sin cambios.
        </div>
      </div>
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">science</span>
            SMILES e InChI
          </div>
          <span class="adv-prefix-badge">smiles: / cactus:</span>
        </div>
        <p class="adv-card-desc">
          Convierte la notación química lineal directamente en coordenadas 3D mediante NIH CACTUS CIR (con PubChem 3D como alternativa). Ideal para compuestos propios, sintéticos o exóticos que no figuran en los catálogos habituales. Los SMILES con ramificaciones, anillos o enlaces múltiples (p. ej., la salida de <em>Copy As → SMILES</em> de ChemDraw) se reconocen incluso sin el prefijo.
        </p>
        <div class="adv-card-example">
          Ejemplos: <code>smiles: CC(=O)Oc1ccccc1C(=O)O</code> (aspirina), <code>smiles: C1CCCCC1</code> (ciclohexano), <code>smiles: C12C3C4C1C5C2C3C45</code> (cubano)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">biotech</span>
            Macromoléculas de PDB
          </div>
          <span class="adv-prefix-badge">pdb:</span>
        </div>
        <p class="adv-card-desc">
          Obtiene estructuras macromoleculares del Protein Data Bank (proteínas, enzimas, ADN, ARN). En el diálogo de Búsqueda avanzada también puedes indicar una cadena concreta y activar o desactivar las moléculas de agua cristalográfica.
        </p>
        <div class="adv-card-example">
          Ejemplos: <code>pdb: 1CRN</code> (crambina), <code>pdb: 1BNA</code> (ADN-B), <code>pdb: 1CRN:A</code> (cadena A)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">category</span>
            Ligandos y cofactores CCD
          </div>
          <span class="adv-prefix-badge">ccd:</span>
        </div>
        <p class="adv-card-desc">
          Descarga ligandos y cofactores del PDB Chemical Component Dictionary. Perfecto para imprimir en 3D cofactores con metales complejados, colorantes y fármacos unidos a macromoléculas.
        </p>
        <div class="adv-card-example">
          Ejemplos: <code>ccd: HEM</code> (hemo), <code>ccd: ATP</code>, <code>ccd: CLA</code> (clorofila a)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">grain</span>
            Cristales y minerales de COD
          </div>
          <span class="adv-prefix-badge">cod:</span>
        </div>
        <p class="adv-card-desc">
          Consulta la Crystallography Open Database. Permite cargar redes cristalinas inorgánicas, sales y minerales por nombre (búsqueda de texto completo), fórmula empírica o ID numérico de COD.
        </p>
        <div class="adv-card-example">
          Ejemplos: <code>cod: 1506182</code>, <code>cod: CaCO3</code> (calcita), <code>cod: quartz</code> (cuarzo), <code>cod: NaCl</code>
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">draw</span>
            Dibujar 2D → 3D
          </div>
          <span class="adv-prefix-badge">Pestaña Dibujar</span>
        </div>
        <p class="adv-card-desc">
          Dibuja una fórmula estructural directamente en el lienzo: elige un enlace (simple, doble, triple, o en cuña/discontinuo para la estereoquímica), un elemento (C, H, O, N, P, S, F, Cl, Br, I, B, Si, Se o cualquier otro del menú <em>Otros</em>) o un anillo (benceno, ciclohexano, ciclopentano; más cicloalcanos y heterociclos como la piridina o el furano en <em>Más anillos</em>) y haz clic o arrastra. Las herramientas <em>+</em>/<em>−</em> asignan cargas a los átomos, y la fórmula y el SMILES del dibujo se muestran en tiempo real bajo el lienzo. Al hacer clic con un elemento sobre un átomo existente, lo cambias; al hacer clic en un espacio vacío, añades un átomo nuevo. Después, el botón <em>Generar modelo 3D</em> calcula las coordenadas 3D, hidrógenos incluidos.
        </p>
        <img src={drawImg} alt="Pestaña Dibujar de la Búsqueda avanzada con ácido salicílico dibujado en el lienzo" loading="lazy" class="tutorial-img draw-img">
        <p class="image-caption">Ejemplo: ácido salicílico dibujado en la pestaña Dibujar</p>
        <div class="adv-card-example">
          Con conexión, la estructura 3D se obtiene de NIH CACTUS; sin internet se calcula localmente en tu navegador (OpenBabel, campo de fuerza MMFF94). Consejo: abre la pestaña una vez con conexión para que el motor sin conexión se guarde en tu navegador (la aplicación instalada lo hace automáticamente).
        </div>
      </div>
    </div>
  </details>

  <!-- Step 2 -->
  <details id="step-2" class="step-container" bind:open={sectionOpen['step-2']}>
    <summary><h2>Paso 2: Interfaz de visualización</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Una vez cargados los datos, estarán disponibles los ajustes del modelo. El primer paso es elegir la representación de la molécula.</p>
    <img src={step2Img} alt="Captura de la interfaz con el menú desplegado" loading="lazy" class="tutorial-img">
    <p class="image-caption">Fig. 2: Interfaz con el menú desplegable de representación</p>
  </details>

  <!-- Step 3 -->
  <details id="step-3" class="step-container" bind:open={sectionOpen['step-3']}>
    <summary><h2>Paso 3: Elige el tipo de representación</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Elige el aspecto que mejor se adapte a lo que necesitas para la enseñanza o la impresión 3D.</p>
    <img src={step3Img} alt="Selección de la representación de la molécula" loading="lazy" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">Fig. 3: Opciones del menú desplegable</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>Selecciona el tipo de modelo:</strong> Elige el aspecto deseado (Spheres, Ball-and-Stick, Sticks o nuestro modo secreto <span class="easter-egg">Minecraft</span>).</div></li>
    </ul>
  </details>

  <!-- Step 4 and Interactive Gallery -->
  <details id="step-4" class="step-container" bind:open={sectionOpen['step-4']}>
    <summary><h2>Paso 4: Ajuste de parámetros y exportación</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Ajusta los detalles y las proporciones del modelo para obtener una impresión óptima. Pasa el cursor por encima de cada opción para ver cómo los parámetros cambian visualmente el resultado.</p>

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

    <img src={step4Img} alt="Ejemplo de parámetros del modelo de bolas y varillas" loading="lazy" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">Fig. 4: Parámetros del modelo y opciones de exportación</p>

    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>Ajustes del modelo:</strong> Aquí puedes ajustar la calidad, el tamaño del modelo, el diámetro de los enlaces o la visualización de los hidrógenos.</div></li>
      <li><span class="legend-number">5</span><div><strong>Opciones de exportación:</strong> El botón <em>Descargar plantilla</em> descarga los datos <code>.sdf</code> sin procesar de la molécula. El botón azul <em>Un solo archivo STL</em> exporta un modelo unido de un solo color.</div></li>
      <li><span class="legend-number">6</span><div><strong>Exportación multicolor final:</strong> Con el botón verde <em>Descargar modelo</em> descargarás un archivo <code>.zip</code> con los modelos separados por átomos, para asignar los colores más fácilmente en el laminador.</div></li>
    </ul>
  </details>

  <!-- Step 5 -->
  <details id="step-5" class="step-container" bind:open={sectionOpen['step-5']}>
    <summary><h2>Paso 5: Aplica los cambios (Recargar)</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>La imagen muestra un modelo más complejo (ATP). Recuerda que, después de cualquier cambio en la sección <em>Ajustes del modelo</em>, la vista previa no se actualiza automáticamente.</p>
    <img src={step5Img} alt="Actualización del modelo con el botón Recargar" loading="lazy" class="tutorial-img">
    <p class="image-caption">Fig. 5: Modelo de ATP y el botón amarillo Recargar</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>Botón Recargar:</strong> Cada vez que cambies los ajustes, haz clic primero en este botón amarillo. Así se aplican los cambios a la vista previa 3D.</div></li>
    </ul>
  </details>

  <!-- SHARING MODEL AND SETTINGS -->
  <details id="sharing" class="step-container" bind:open={sectionOpen['sharing']}>
    <summary><h2>Compartir modelos y ajustes mediante URL</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Puedes compartir fácilmente la molécula que has preparado, con sus ajustes exactos, con colegas o estudiantes, o guardarla en marcadores mediante un enlace URL para compartir.</p>

    <div class="share-tutorial-mockup" aria-label="Ilustración del botón Compartir y de la ventana flotante con la URL">
      <div class="share-mockup-popover">
        <div class="share-mockup-header">
          <span>Enlace para compartir</span>
          <span class="share-mockup-close" aria-hidden="true">✕</span>
        </div>
        <div class="share-mockup-input-row">
          <div class="share-mockup-url">https://3dmolekuly.vscht.cz/?source=pubchem&amp;mol=caffeine&amp;style=ball-and-stick&amp;q=50</div>
          <div class="share-mockup-copy">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            ¡Copiado!
          </div>
        </div>
      </div>

      <div class="share-mockup-actions">
        <div class="share-mockup-download">
          <span class="material-symbols-outlined" aria-hidden="true">deployed_code_update</span>
          Descargar modelo (.3mf)
        </div>
        <div class="share-mockup-slice">
          Laminar ▾
        </div>
        <div class="share-mockup-square-btn" title="Compartir">
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
        </div>
      </div>
    </div>
    <p class="image-caption">Fig. 6: Botón cuadrado con el icono de compartir y ventana flotante con el enlace URL</p>

    <ul class="legend-list">
      <li><span class="legend-number">8</span><div><strong>Botón Compartir:</strong> Haz clic en el botón cuadrado con el icono de compartir (junto al botón <em>Laminar</em>). La URL se copia al portapapeles, el botón se vuelve verde y justo encima aparece una ventana con el enlace completo. La URL codifica la fuente de datos (<code>pubchem</code>, <code>pdb</code>, <code>cod</code>), el nombre o código de la molécula, el tipo de visualización elegido y todos los parámetros configurados, de modo que al abrir el enlace se aplican automáticamente todos los ajustes y se muestra el modelo. Un confórmero 3D elegido de PubChem también se conserva en el enlace (<code>conformer:…</code>). Si trabajas con un archivo local subido (<code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code>, ChemDraw), el enlace comparte solo el tipo de visualización y los valores configurados (<code>source=file</code>), dejándolo todo preconfigurado para quien suba su propio archivo.</div></li>
    </ul>
  </details>

  <!-- OFFLINE USAGE AND PWA INSTALLATION -->
  <details id="offline-pwa" class="step-container" bind:open={sectionOpen['offline-pwa']}>
    <summary><h2>Uso sin conexión e instalación como PWA</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      Puedes instalar Impresión 3D de moléculas como aplicación en tu ordenador o tu móvil. Tras la primera visita con conexión a internet, la aplicación se guarda en tu navegador y sigue funcionando <strong>sin conexión a internet</strong>: en el aula, en el laboratorio o donde estés.
    </p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">computer</span>
        </span>
        <div>
          <strong>Instalación en un ordenador (Chrome, Edge):</strong>
          Haz clic en el icono <em>Instalar aplicación</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">install_desktop</span> de la barra de direcciones (justo al lado de la URL) y confirma con <em>Instalar</em>. A partir de entonces, la aplicación se abre en su propia ventana y aparece en el menú Inicio / Launchpad.
        </div>
      </li>
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">phone_iphone</span>
        </span>
        <div>
          <strong>Instalación en un móvil:</strong>
          En <em>Safari</em> (iPhone, iPad), toca <em>Compartir</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">ios_share</span> → <em>Añadir a pantalla de inicio</em>. En <em>Chrome</em> (Android), abre el menú ⋮ → <em>Instalar aplicación</em> (o <em>Añadir a pantalla de inicio</em>).
        </div>
      </li>
    </ul>

    <div class="adv-sources-grid">
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #2e7d32;" aria-hidden="true">offline_pin</span>
            Funciona sin conexión
          </div>
        </div>
        <p class="adv-card-desc">
          Subir tus propios archivos desde el disco (<code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code>, ChemDraw <code>.cdx</code>/<code>.cdxml</code>; las estructuras 2D se convierten a 3D mediante un cálculo local), la vista previa 3D y todos los tipos de representación, la edición de los parámetros del modelo, las articulaciones móviles, la comprobación de estanqueidad (manifold) y la exportación a <code>.3mf</code> / <code>.stl</code> con el botón <em>Descargar modelo</em>. <em>Dibujar una molécula</em> en la Búsqueda avanzada también funciona: el modelo 3D se calcula localmente (OpenBabel). Para ello, el módulo de cálculo (~8 MB) debe estar ya guardado en tu dispositivo: en el navegador, abre la pestaña Dibujar al menos una vez con conexión; la aplicación instalada (PWA) lo descarga automáticamente al abrirse con conexión.
        </p>
        <div class="adv-card-example">
          Todos los cálculos (geometría 3D, Manifold, empaquetado ZIP) se realizan directamente en tu navegador: no se envía nada a ningún servidor.
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #e53935;" aria-hidden="true">cloud_off</span>
            Requiere conexión
          </div>
        </div>
        <p class="adv-card-desc">
          Buscar y descargar estructuras de catálogos en línea: <strong>PubChem</strong>, <strong>PDB</strong> (incluidos los ligandos CCD), <strong>COD</strong> y la conversión de SMILES mediante NIH CACTUS. El botón <em>Laminar</em>, que abre el modelo directamente en un laminador, también necesita internet.
        </p>
        <div class="adv-card-example">
          Consejo: sin conexión, descarga el modelo como <code>.3mf</code> con <em>Descargar modelo</em> y ábrelo manualmente en tu laminador.
        </div>
      </div>
    </div>
  </details>

  <!-- SLICER IMPORT INFO -->
  <details id="slicer-import" class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;" bind:open={sectionOpen['slicer-import']}>
    <summary><h2>¿Cómo se importa en el laminador?</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p style="font-size: 1.1rem; text-align: center;">
      Para imprimir moléculas en <strong>varios colores</strong>, asegúrate de que el laminador muestre el mensaje <br>
      <em>‘Se ha detectado un objeto multiparte / Multi-part object detected’</em> <br>
      y confírmalo seleccionando <strong>‘SÍ’ (YES)</strong>.
    </p>
    <img src="/assets/multipartobject.svg" alt="Diálogo de importación del laminador" loading="lazy" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
    <PrusaSlicerPluginNote />
  </details>

  <!-- PRINTABLES AND MAKERWORLD SECTION -->
  <details id="ready-models" class="step-container printables-container" bind:open={sectionOpen['ready-models']}>
    <summary><h2>Prueba modelos listos para imprimir en Printables y MakerWorld</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p class="printables-desc">
      ¿Buscas inspiración o quieres imprimir moléculas populares directamente, sin tocar ningún ajuste? Explora nuestra colección de modelos 3D de moléculas verificados y listos para imprimir directamente en Printables y MakerWorld.
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

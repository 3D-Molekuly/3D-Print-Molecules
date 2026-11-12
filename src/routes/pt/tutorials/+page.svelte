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
            name: "Qualidade de malha predefinida (Qualidade: 50)", 
            img: sphereQ50Img, 
            desc: "Definição padrão para um modelo esférico bonito e suave." 
        },
        { 
            name: "Qualidade baixa (Qualidade: 5)", 
            img: sphereQ5Img, 
            desc: "Reduz significativamente o número de polígonos. Adequado para um aspeto 'low-poly' específico ou para uma renderização mais rápida de moléculas enormes." 
        },
        { 
            name: "Ocultar hidrogénios", 
            img: sphereHoffImg, 
            desc: "Desativa a visualização dos átomos de hidrogénio, o que pode simplificar muito moléculas orgânicas complexas." 
        },
        { 
            name: "Ball-and-Stick predefinido", 
            img: waterBasImg, 
            desc: "Representação básica de uma molécula de água no modo de bolas e varetas (ball-and-stick)." 
        },
        { 
            name: "Mostrar ligações múltiplas", 
            img: co2MultImg, 
            desc: "No dióxido de carbono (CO2), visualiza as ligações duplas entre o carbono e o oxigénio (em comparação com a ligação simples predefinida)." 
        },
        { 
            name: "Diâmetro uniforme dos átomos", 
            img: waterUniformImg, 
            desc: "Uniformiza o tamanho de todos os átomos do modelo, independentemente do seu raio de van der Waals real." 
        },
        { 
            name: "Agrupar ligações separadamente", 
            img: waterGroupImg, 
            desc: "Na exportação, separa as ligações em peças individuais, facilitando a atribuição de cores e a preparação para impressão 3D multicolor." 
        },
        { 
            name: "Escala maior (Fator de multiplicação: 1.5)", 
            img: waterMultImg, 
            desc: "Aumenta o volume total e os diâmetros dos elementos do modelo, para um resultado físico mais robusto." 
        },
        { 
            name: "Espessura das ligações (Diâmetro das ligações: 0.6)", 
            img: waterBondDiaImg, 
            desc: "Engrossa as varetas que ligam os átomos, tornando o modelo impresso mecanicamente mais resistente." 
        }
    ];

    // Default selected option in the gallery
    let activeOption = settingsOptions[0];

    // --- TABLE OF CONTENTS (IDs match the sections below) ---
    const tocItems = [
        { id: 'step-1', label: 'Passo 1: Selecionar uma molécula' },
        { id: 'advanced-search', label: 'Pesquisa avançada' },
        { id: 'step-2', label: 'Passo 2: Interface de visualização' },
        { id: 'step-3', label: 'Passo 3: Tipo de representação' },
        { id: 'step-4', label: 'Passo 4: Parâmetros e exportação' },
        { id: 'step-5', label: 'Passo 5: Aplicar alterações (Recarregar)' },
        { id: 'sharing', label: 'Partilha através de URL' },
        { id: 'offline-pwa', label: 'Offline e instalação (PWA)' },
        { id: 'slicer-import', label: 'Importação para um slicer' },
        { id: 'ready-models', label: 'Modelos prontos a imprimir' }
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
      Conteúdo
      <span class="material-symbols-outlined toc-chevron" aria-hidden="true">expand_more</span>
    </summary>
    <button type="button" class="toc-toggle-all" on:click={toggleAllSections}>
      <span class="material-symbols-outlined" aria-hidden="true">{allSectionsOpen ? 'unfold_less' : 'unfold_more'}</span>
      {allSectionsOpen ? 'Recolher tudo' : 'Expandir tudo'}
    </button>
    <nav aria-label="Conteúdo do tutorial">
      <ol class="toc-list">
        {#each tocItems as item (item.id)}
          <li><a href="#{item.id}" on:click={() => (sectionOpen[item.id] = true)}>{item.label}</a></li>
        {/each}
      </ol>
    </nav>
  </details>
</aside>

<section class="tutorial">
  <h1>Como usar a Impressão 3D de Moléculas</h1>
  <p style="text-align: center; margin-bottom: 1.5rem;">
    Preparar um modelo de uma molécula para impressão 3D nunca foi tão fácil. Todo o processo pode ser resumido em três passos rápidos:
  </p>

  <!-- FLOW SCHEMA -->
  <div class="flow-schema">
    <div class="flow-step-badge">Introduzir o nome</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Gerar o modelo</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Descarregar</div>
  </div>

  <!-- Step 1 -->
  <details id="step-1" class="step-container" bind:open={sectionOpen['step-1']}>
    <summary><h2>Passo 1: Selecionar uma molécula</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Primeiro, indique ao programa que substância pretende modelar. Pode usar a importação automática ou carregar os seus próprios dados.</p>
    <img src={step1Img} alt="Captura de ecrã da interface com a pesquisa" class="tutorial-img">
    <p class="image-caption">Fig. 1: Interface de pesquisa no PubChem</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>Pesquisa:</strong> Introduza o nome da substância em inglês no campo "Pesquisar no PubChem" e prima Enter. Os dados são descarregados automaticamente da base de dados pública. Além de nomes, também pode introduzir um número CAS, um CID do PubChem, uma <strong>fórmula molecular</strong> (<code>H2O</code>, <code>CO2</code>, <code>H2SO4</code> – maiúsculas e minúsculas não importam, <code>h2so4</code> ou <code>H₂O</code> também funcionam) ou <strong>SMILES</strong> (p. ex., <code>CC(=O)OC1=CC=CC=C1C(=O)O</code>). Uma fórmula carrega o composto mais relevante; quando vários compostos partilham a mesma fórmula (isómeros), escolha o que pretende na Pesquisa avançada.</div></li>
      <li><span class="legend-number">2</span><div><strong>Dados próprios:</strong> Carregue um ficheiro <code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code> ou ChemDraw (<code>.cdx</code>, <code>.cdxml</code>) com o botão <em>Carregar ficheiro</em>, arraste-o para a janela ou cole-o com <kbd>Ctrl</kbd>+<kbd>V</kbd>. O modelo é carregado de imediato. As estruturas 2D (tipicamente exportadas do ChemDraw ou do Marvin, sem hidrogénios) são convertidas automaticamente para 3D e os hidrogénios são adicionados.</div></li>
    </ul>
  </details>

  <!-- ADVANCED SEARCH -->
  <details id="advanced-search" class="step-container" bind:open={sectionOpen['advanced-search']}>
    <summary><h2>Pesquisa avançada e entradas específicas</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      Precisa de modelar um composto a partir de uma cadeia SMILES, uma macromolécula do Protein Data Bank, uma rede cristalina ou um cofator com um metal ligado? A aplicação suporta pesquisa avançada em várias bases de dados.
    </p>

    <div class="adv-search-mockup" aria-label="Ilustração da barra de pesquisa e da pesquisa avançada">
      <!-- Search bar mockup -->
      <div class="adv-search-bar-mockup">
        <span class="material-symbols-outlined" style="color: #64748b; font-size: 1.25rem;" aria-hidden="true">search</span>
        <div class="adv-search-input-text">
          <span class="adv-search-prefix-highlight">smiles:</span>CC(=O)Oc1ccccc1C(=O)O
        </div>
        <div class="adv-gear-btn-mockup" title="Pesquisa avançada">
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
          COD (Cristais)
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">draw</span>
          Desenhar
        </span>
      </div>
    </div>
    <p class="image-caption">Exemplo: barra de pesquisa com prefixo e separadores no diálogo de Pesquisa avançada</p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">A</span>
        <div>
          <strong>Ícone da roda dentada (definições de pesquisa):</strong>
          Clique no botão da roda dentada <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">settings</span> no lado direito da barra de pesquisa principal para abrir a janela de <em>Pesquisa avançada</em>. Aqui pode alternar entre bases de dados através de separadores, usar filtros interativos (como a seleção de cadeia no PDB) ou experimentar moléculas de exemplo pré-configuradas.
        </div>
      </li>
      <li>
        <span class="legend-number">B</span>
        <div>
          <strong>Prefixos diretos no campo de pesquisa:</strong>
          Nem sequer precisa de abrir a janela – basta escrever um prefixo seguido de dois pontos diretamente na caixa de pesquisa principal. A aplicação deteta automaticamente o tipo de consulta e encaminha-a para o serviço correspondente. Fórmulas moleculares e SMILES são reconhecidos mesmo sem prefixo.
        </div>
      </li>
    </ul>

    <!-- Input source cards -->
    <div class="adv-sources-grid">
      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">database</span>
            PubChem: fórmulas, isómeros e confórmeros 3D
          </div>
          <span class="adv-prefix-badge">formula: / conformer:</span>
        </div>
        <p class="adv-card-desc">
          Introduza uma fórmula molecular no separador <em>PubChem</em> para listar todos os compostos com essa fórmula, ordenados por relevância – para <code>C2H6O</code>, por exemplo, tanto o etanol como o éter dimetílico – e escolha o correto. Com a opção <em>Escolher um confórmero 3D</em> assinalada, a aplicação oferece, em vez da estrutura predefinida, até 10 conformações espaciais que o PubChem calculou para o composto. Cada uma mostra a sua energia MMFF94 e, entre parênteses, a diferença em relação à mais estável. Útil para demonstrar a flexibilidade molecular ou imprimir várias conformações lado a lado. O confórmero é guardado no histórico de pesquisa e nas ligações partilhadas.
        </p>
        <div class="adv-card-example">
          Exemplos: <code>H2SO4</code>, <code>C2H6O</code> (isómeros), Aspirin + <em>Escolher um confórmero 3D</em>. Sais e complexos metálicos muitas vezes não têm confórmeros 3D – a aplicação oferece então uma conversão 2D → 3D.
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">upload_file</span>
            Ficheiros ChemDraw e .mol
          </div>
          <span class="adv-prefix-badge">Carregar / arrastar e largar / Ctrl+V</span>
        </div>
        <p class="adv-card-desc">
          Há três formas de trazer uma estrutura do ChemDraw: guardá-la como <code>.cdx</code> ou <code>.cdxml</code> e carregar o ficheiro; usar <em>Edit → Copy As → MOL Text</em> ou <em>CDXML Text</em> e colar com <kbd>Ctrl</kbd>+<kbd>V</kbd> em qualquer ponto da aplicação (fora de outros campos de texto); ou usar <em>Copy As → SMILES</em> e colar na caixa de pesquisa. Um ficheiro <code>.mol</code> do ChemDraw, Marvin, ChemSketch ou outro editor funciona da mesma forma. As estruturas desenhadas (2D) não têm coordenadas espaciais nem hidrogénios, por isso são convertidas automaticamente para 3D – online através do NIH CACTUS, offline localmente (OpenBabel). As abreviaturas de grupos (Ph, OMe…) são expandidas, e as cargas e a estereoquímica das ligações em cunha são preservadas.
        </p>
        <div class="adv-card-example">
          Os ficheiros que já contêm coordenadas 3D (p. ex., exportados do Avogadro ou um SDF 3D do PubChem) são carregados sem alterações.
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
          Converte a notação química linear diretamente em coordenadas 3D através do NIH CACTUS CIR (com o PubChem 3D como alternativa). Ideal para compostos personalizados, sintéticos ou exóticos fora dos catálogos habituais. SMILES com ramificações, anéis ou ligações múltiplas (p. ex., o resultado de <em>Copy As → SMILES</em> do ChemDraw) são reconhecidos mesmo sem prefixo.
        </p>
        <div class="adv-card-example">
          Exemplos: <code>smiles: CC(=O)Oc1ccccc1C(=O)O</code> (aspirina), <code>smiles: C1CCCCC1</code> (ciclo-hexano), <code>smiles: C12C3C4C1C5C2C3C45</code> (cubano)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">biotech</span>
            Macromoléculas do PDB
          </div>
          <span class="adv-prefix-badge">pdb:</span>
        </div>
        <p class="adv-card-desc">
          Obtém estruturas macromoleculares do Protein Data Bank (proteínas, enzimas, ADN, ARN). No diálogo de Pesquisa avançada, também pode especificar uma cadeia individual e incluir ou excluir as moléculas de água cristalográfica.
        </p>
        <div class="adv-card-example">
          Exemplos: <code>pdb: 1CRN</code> (crambina), <code>pdb: 1BNA</code> (ADN-B), <code>pdb: 1CRN:A</code> (cadeia A)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">category</span>
            Ligandos e cofatores CCD
          </div>
          <span class="adv-prefix-badge">ccd:</span>
        </div>
        <p class="adv-card-desc">
          Descarrega ligandos e cofatores do PDB Chemical Component Dictionary. Perfeito para imprimir em 3D cofatores com metais complexados, corantes e fármacos ligados a macromoléculas.
        </p>
        <div class="adv-card-example">
          Exemplos: <code>ccd: HEM</code> (heme), <code>ccd: ATP</code>, <code>ccd: CLA</code> (clorofila a)
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">grain</span>
            Cristais e minerais COD
          </div>
          <span class="adv-prefix-badge">cod:</span>
        </div>
        <p class="adv-card-desc">
          Consulta a Crystallography Open Database. Permite carregar redes cristalinas inorgânicas, sais e minerais por nome (pesquisa de texto integral), fórmula empírica ou ID COD numérico.
        </p>
        <div class="adv-card-example">
          Exemplos: <code>cod: 1506182</code>, <code>cod: CaCO3</code> (calcite), <code>cod: quartz</code>, <code>cod: NaCl</code>
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">draw</span>
            Desenhar 2D → 3D
          </div>
          <span class="adv-prefix-badge">Separador Desenhar</span>
        </div>
        <p class="adv-card-desc">
          Esboce uma fórmula de estrutura diretamente na área de desenho: escolha uma ligação (simples, dupla, tripla, ou em cunha/tracejada para a estereoquímica), um elemento (C, H, O, N, P, S, F, Cl, Br, I, B, Si, Se ou qualquer outro do menu <em>Outros</em>) ou um anel (benzeno, ciclo-hexano, ciclopentano; mais cicloalcanos e heterociclos, como a piridina ou o furano, em <em>Mais anéis</em>) e clique ou arraste. As ferramentas <em>+</em>/<em>−</em> definem as cargas dos átomos, e a fórmula e o SMILES do desenho são mostrados em tempo real por baixo da área de desenho. Clicar num átomo existente com um elemento altera-o; clicar num espaço vazio adiciona um novo átomo. O botão <em>Gerar modelo 3D</em> calcula então as coordenadas 3D, incluindo os hidrogénios.
        </p>
        <img src={drawImg} alt="Separador Desenhar da Pesquisa avançada com ácido salicílico esboçado na área de desenho" loading="lazy" class="tutorial-img draw-img">
        <p class="image-caption">Exemplo: ácido salicílico esboçado no separador Desenhar</p>
        <div class="adv-card-example">
          Online, a estrutura 3D vem do NIH CACTUS; sem Internet é calculada localmente no seu navegador (OpenBabel, campo de forças MMFF94). Dica: abra o separador uma vez enquanto estiver online, para que o motor offline fique guardado no navegador (a aplicação instalada faz isto automaticamente).
        </div>
      </div>
    </div>
  </details>

  <!-- Step 2 -->
  <details id="step-2" class="step-container" bind:open={sectionOpen['step-2']}>
    <summary><h2>Passo 2: Interface de visualização</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Depois de carregados os dados, as definições do modelo ficam disponíveis. O primeiro passo é selecionar a representação da molécula.</p>
    <img src={step2Img} alt="Captura de ecrã da interface com o menu expandido" loading="lazy" class="tutorial-img">
    <p class="image-caption">Fig. 2: Interface com o menu pendente de representação</p>
  </details>

  <!-- Step 3 -->
  <details id="step-3" class="step-container" bind:open={sectionOpen['step-3']}>
    <summary><h2>Passo 3: Escolher o tipo de representação</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Escolha o aspeto que melhor se adapta às suas necessidades de ensino ou de impressão 3D.</p>
    <img src={step3Img} alt="Seleção da representação da molécula" loading="lazy" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">Fig. 3: Opções do menu pendente</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>Selecionar tipo de modelo:</strong> Selecione o aspeto pretendido (Spheres, Ball-and-Stick, Sticks ou o nosso modo secreto <span class="easter-egg">Minecraft</span>).</div></li>
    </ul>
  </details>

  <!-- Step 4 and Interactive Gallery -->
  <details id="step-4" class="step-container" bind:open={sectionOpen['step-4']}>
    <summary><h2>Passo 4: Definição de parâmetros e exportação</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Ajuste os detalhes e as proporções do modelo para uma impressão ideal. Passe o cursor sobre as opções abaixo para ver como os parâmetros alteram visualmente o resultado.</p>

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

    <img src={step4Img} alt="Exemplo de parâmetros do modelo de bolas e varetas" loading="lazy" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">Fig. 4: Parâmetros do modelo e opções de exportação</p>

    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>Definições do modelo:</strong> Aqui pode ajustar a qualidade, o tamanho do modelo, o diâmetro das ligações ou a visualização dos hidrogénios.</div></li>
      <li><span class="legend-number">5</span><div><strong>Opções de exportação:</strong> O botão <em>Descarregar modelo base</em> descarrega os dados <code>.sdf</code> em bruto da molécula. O botão azul <em>Um único ficheiro STL</em> exporta um modelo unido de uma só cor.</div></li>
      <li><span class="legend-number">6</span><div><strong>Exportação multicolor final:</strong> Com o botão verde <em>Descarregar modelo</em>, descarrega um arquivo <code>.zip</code> com os modelos separados por átomos, para facilitar a atribuição de cores no slicer.</div></li>
    </ul>
  </details>

  <!-- Step 5 -->
  <details id="step-5" class="step-container" bind:open={sectionOpen['step-5']}>
    <summary><h2>Passo 5: Aplicar alterações (Recarregar)</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>A imagem mostra um modelo mais complexo (ATP). Lembre-se de que, após qualquer ajuste na secção <em>Definições do modelo</em>, a pré-visualização não é atualizada automaticamente.</p>
    <img src={step5Img} alt="Atualização do modelo com o botão Recarregar" loading="lazy" class="tutorial-img">
    <p class="image-caption">Fig. 5: Modelo de ATP e o botão amarelo Recarregar</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>Botão Recarregar:</strong> Sempre que ajustar as definições, clique primeiro neste botão amarelo. Assim, as alterações são aplicadas à pré-visualização 3D.</div></li>
    </ul>
  </details>

  <!-- SHARING MODEL AND SETTINGS -->
  <details id="sharing" class="step-container" bind:open={sectionOpen['sharing']}>
    <summary><h2>Partilhar modelos e definições através de URL</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>Pode partilhar facilmente a molécula preparada, juntamente com as definições exatas dos parâmetros, com colegas ou estudantes, ou guardá-la nos favoritos através de uma ligação URL partilhável.</p>

    <div class="share-tutorial-mockup" aria-label="Ilustração do botão Partilhar e da janela flutuante com o URL">
      <div class="share-mockup-popover">
        <div class="share-mockup-header">
          <span>Ligação para partilhar</span>
          <span class="share-mockup-close" aria-hidden="true">✕</span>
        </div>
        <div class="share-mockup-input-row">
          <div class="share-mockup-url">https://3dmolekuly.vscht.cz/?source=pubchem&amp;mol=caffeine&amp;style=ball-and-stick&amp;q=50</div>
          <div class="share-mockup-copy">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            Copiado!
          </div>
        </div>
      </div>

      <div class="share-mockup-actions">
        <div class="share-mockup-download">
          <span class="material-symbols-outlined" aria-hidden="true">deployed_code_update</span>
          Descarregar modelo (.3mf)
        </div>
        <div class="share-mockup-slice">
          Fatiar ▾
        </div>
        <div class="share-mockup-square-btn" title="Partilhar">
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
        </div>
      </div>
    </div>
    <p class="image-caption">Fig. 6: Botão quadrado com o ícone Partilhar e janela flutuante com a ligação URL</p>

    <ul class="legend-list">
      <li><span class="legend-number">8</span><div><strong>Botão Partilhar:</strong> Clique no botão quadrado com o ícone de partilha (ao lado do botão <em>Fatiar</em>). O URL é copiado para a área de transferência, o botão fica verde e aparece uma janela diretamente por cima dele com a ligação completa. O URL codifica a fonte da base de dados (<code>pubchem</code>, <code>pdb</code>, <code>cod</code>), o nome ou código da molécula, o tipo de visualização selecionado e todos os parâmetros configurados, pelo que abrir a ligação aplica automaticamente todas as definições e apresenta o modelo. Um confórmero 3D escolhido no PubChem também é guardado na ligação (<code>conformer:…</code>). Ao trabalhar com um ficheiro local carregado (<code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code>, ChemDraw), a ligação partilha apenas o tipo de visualização e os valores configurados (<code>source=file</code>), deixando tudo pré-configurado para quem carregar o seu próprio ficheiro.</div></li>
    </ul>
  </details>

  <!-- OFFLINE USAGE AND PWA INSTALLATION -->
  <details id="offline-pwa" class="step-container" bind:open={sectionOpen['offline-pwa']}>
    <summary><h2>Utilização offline e instalação da PWA</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      Pode instalar a Impressão 3D de Moléculas como aplicação no seu computador ou telemóvel. Após a primeira visita com ligação à Internet, a aplicação fica guardada no navegador e continua a funcionar <strong>sem ligação à Internet</strong> – na sala de aula, no laboratório ou em viagem.
    </p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">computer</span>
        </span>
        <div>
          <strong>Instalar num computador (Chrome, Edge):</strong>
          Clique no ícone <em>Instalar aplicação</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">install_desktop</span> na barra de endereço (mesmo ao lado do URL) e confirme <em>Instalar</em>. A aplicação abre então numa janela própria e aparece no menu Iniciar / Launchpad.
        </div>
      </li>
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">phone_iphone</span>
        </span>
        <div>
          <strong>Instalar num telemóvel:</strong>
          No <em>Safari</em> (iPhone, iPad), toque em <em>Partilhar</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">ios_share</span> → <em>Adicionar ao ecrã principal</em>. No <em>Chrome</em> (Android), abra o menu ⋮ → <em>Instalar aplicação</em> (ou <em>Adicionar ao ecrã principal</em>).
        </div>
      </li>
    </ul>

    <div class="adv-sources-grid">
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #2e7d32;" aria-hidden="true">offline_pin</span>
            Funciona offline
          </div>
        </div>
        <p class="adv-card-desc">
          Carregar os seus próprios ficheiros a partir do disco (<code>.sdf</code>, <code>.mol</code>, <code>.pdb</code>, <code>.cif</code>, ChemDraw <code>.cdx</code>/<code>.cdxml</code>; as estruturas 2D são convertidas para 3D por cálculo local), a pré-visualização 3D e todos os tipos de representação, a edição dos parâmetros do modelo, as articulações móveis, a verificação de estanquidade (manifold) e a exportação para <code>.3mf</code> / <code>.stl</code> com o botão <em>Descarregar modelo</em>. <em>Desenhar uma molécula</em> na Pesquisa avançada também funciona – o modelo 3D é calculado localmente (OpenBabel). Para isso, o módulo de cálculo (~8 MB) tem de estar já guardado no seu dispositivo: no navegador, abra o separador Desenhar pelo menos uma vez enquanto estiver online; a aplicação instalada (PWA) descarrega-o automaticamente quando é iniciada online.
        </p>
        <div class="adv-card-example">
          Todos os cálculos (geometria 3D, Manifold, compactação ZIP) são executados diretamente no seu navegador – nada é enviado para um servidor.
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #e53935;" aria-hidden="true">cloud_off</span>
            Requer ligação
          </div>
        </div>
        <p class="adv-card-desc">
          Pesquisar e descarregar estruturas de catálogos online – <strong>PubChem</strong>, <strong>PDB</strong> (incluindo ligandos CCD), <strong>COD</strong> – e a conversão de SMILES através do NIH CACTUS. O botão <em>Fatiar</em>, que abre o modelo diretamente num slicer, também precisa de Internet.
        </p>
        <div class="adv-card-example">
          Dica: quando estiver offline, descarregue o modelo como <code>.3mf</code> através de <em>Descarregar modelo</em> e abra-o manualmente no seu slicer.
        </div>
      </div>
    </div>
  </details>

  <!-- SLICER IMPORT INFO -->
  <details id="slicer-import" class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;" bind:open={sectionOpen['slicer-import']}>
    <summary><h2>Como importar para o slicer?</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p style="font-size: 1.1rem; text-align: center;">
      Para imprimir moléculas <strong>a várias cores</strong>, certifique-se de que o slicer mostra a mensagem <br>
      <em>‘Multi-part object detected / An object with multiple parts was detected’</em> (foi detetado um objeto com várias peças), <br>
      e confirme selecionando <strong>‘YES’</strong> (Sim).
    </p>
    <img src="/assets/multipartobject.svg" alt="Diálogo de importação no slicer" loading="lazy" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
    <PrusaSlicerPluginNote />
  </details>

  <!-- PRINTABLES AND MAKERWORLD SECTION -->
  <details id="ready-models" class="step-container printables-container" bind:open={sectionOpen['ready-models']}>
    <summary><h2>Experimente modelos prontos a imprimir no Printables e no MakerWorld</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p class="printables-desc">
      Procura inspiração ou quer imprimir moléculas populares diretamente, sem ajustar definições? Explore a nossa coleção de modelos 3D de moléculas verificados e prontos a imprimir, diretamente no Printables e no MakerWorld.
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

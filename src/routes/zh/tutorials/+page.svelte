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
            name: "默认网格质量（质量：50）",
            img: sphereQ50Img,
            desc: "标准设置，可得到美观、平滑的球形模型。"
        },
        {
            name: "低质量（质量：5）",
            img: sphereQ5Img,
            desc: "大幅减少多边形数量。适合营造特定的“低多边形”（low-poly）风格，或更快地渲染超大分子。"
        },
        {
            name: "隐藏氢原子",
            img: sphereHoffImg,
            desc: "关闭氢原子的显示，可大大简化复杂的有机分子。"
        },
        {
            name: "默认球棍模型",
            img: waterBasImg,
            desc: "以球棍（Ball-and-Stick）模式表示的水分子基本模型。"
        },
        {
            name: "显示多重键",
            img: co2MultImg,
            desc: "对于二氧化碳（CO2），显示碳与氧之间的双键（默认显示为单键）。"
        },
        {
            name: "统一原子直径",
            img: waterUniformImg,
            desc: "使模型中所有原子大小一致，而不考虑其实际的范德华半径。"
        },
        {
            name: "化学键单独分组",
            img: waterGroupImg,
            desc: "导出时将化学键分离为单独的部件，便于着色和准备多色 3D 打印。"
        },
        {
            name: "更大比例（缩放系数：1.5）",
            img: waterMultImg,
            desc: "增大模型的整体体积和各元素直径，得到更厚实的实物模型。"
        },
        {
            name: "化学键粗细（化学键直径：0.6）",
            img: waterBondDiaImg,
            desc: "加粗原子之间的连接棒，使打印出的模型更加坚固。"
        }
    ];

    // Default selected option in the gallery
    let activeOption = settingsOptions[0];

    // --- TABLE OF CONTENTS (IDs match the sections below) ---
    const tocItems = [
        { id: 'step-1', label: '第 1 步：选择分子' },
        { id: 'advanced-search', label: '高级搜索' },
        { id: 'step-2', label: '第 2 步：显示界面' },
        { id: 'step-3', label: '第 3 步：表示方式' },
        { id: 'step-4', label: '第 4 步：参数与导出' },
        { id: 'step-5', label: '第 5 步：应用更改（重新加载）' },
        { id: 'sharing', label: '通过 URL 分享' },
        { id: 'offline-pwa', label: '离线使用与安装（PWA）' },
        { id: 'slicer-import', label: '导入切片软件' },
        { id: 'ready-models', label: '现成的打印模型' }
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
      目录
      <span class="material-symbols-outlined toc-chevron" aria-hidden="true">expand_more</span>
    </summary>
    <button type="button" class="toc-toggle-all" on:click={toggleAllSections}>
      <span class="material-symbols-outlined" aria-hidden="true">{allSectionsOpen ? 'unfold_less' : 'unfold_more'}</span>
      {allSectionsOpen ? '全部折叠' : '全部展开'}
    </button>
    <nav aria-label="教程目录">
      <ol class="toc-list">
        {#each tocItems as item (item.id)}
          <li><a href="#{item.id}" on:click={() => (sectionOpen[item.id] = true)}>{item.label}</a></li>
        {/each}
      </ol>
    </nav>
  </details>
</aside>

<section class="tutorial">
  <h1>如何使用分子 3D 打印</h1>
  <p style="text-align: center; margin-bottom: 1.5rem;">
    为 3D 打印准备分子模型从未如此简单。整个过程可以概括为三个快速步骤：
  </p>

  <!-- FLOW SCHEMA -->
  <div class="flow-schema">
    <div class="flow-step-badge">输入名称</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">生成模型</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">下载</div>
  </div>

  <!-- Step 1 -->
  <details id="step-1" class="step-container" bind:open={sectionOpen['step-1']}>
    <summary><h2>第 1 步：选择分子</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>首先，告诉程序您想为哪种物质建模。您可以使用自动导入，也可以上传自己的数据。</p>
    <img src={step1Img} alt="显示搜索功能的界面截图" class="tutorial-img">
    <p class="image-caption">图 1：PubChem 搜索界面</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>搜索：</strong>在“在 PubChem 中搜索”字段中输入物质的<strong>英文名称</strong>（PubChem 只支持英文名称，例如 <code>Aspirin</code>、<code>Caffeine</code>），然后按 Enter 键。数据会自动从公共数据库下载。除名称外，您还可以输入 CAS 号、PubChem CID、<strong>分子式</strong>（<code>H2O</code>、<code>CO2</code>、<code>H2SO4</code>——不区分大小写，<code>h2so4</code> 或 <code>H₂O</code> 也可以）或 <strong>SMILES</strong>（例如 <code>CC(=O)OC1=CC=CC=C1C(=O)O</code>）。输入分子式时会加载最相关的化合物；如果有多个化合物具有相同分子式（同分异构体），请在高级搜索中选择所需的化合物。</div></li>
      <li><span class="legend-number">2</span><div><strong>自有数据：</strong>通过<em>上传文件</em>按钮上传 <code>.sdf</code>、<code>.mol</code>、<code>.pdb</code>、<code>.cif</code> 或 ChemDraw（<code>.cdx</code>、<code>.cdxml</code>）文件，也可以将文件拖到窗口中，或用 <kbd>Ctrl</kbd>+<kbd>V</kbd> 粘贴。模型会立即加载。2D 结构（通常从 ChemDraw 或 Marvin 导出，不含氢原子）会自动转换为 3D 并补充氢原子。</div></li>
    </ul>
  </details>

  <!-- ADVANCED SEARCH -->
  <details id="advanced-search" class="step-container" bind:open={sectionOpen['advanced-search']}>
    <summary><h2>高级搜索与特定输入</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      需要根据 SMILES 字符串为化合物建模，或者为来自蛋白质数据库（Protein Data Bank）的生物大分子、晶格或结合金属的辅因子建模？本应用支持跨多个数据库的高级搜索。
    </p>

    <div class="adv-search-mockup" aria-label="搜索栏和高级搜索的示意图">
      <!-- Search bar mockup -->
      <div class="adv-search-bar-mockup">
        <span class="material-symbols-outlined" style="color: #64748b; font-size: 1.25rem;" aria-hidden="true">search</span>
        <div class="adv-search-input-text">
          <span class="adv-search-prefix-highlight">smiles:</span>CC(=O)Oc1ccccc1C(=O)O
        </div>
        <div class="adv-gear-btn-mockup" title="高级搜索">
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
          PDB / 配体
        </span>
        <span class="adv-tab-pill active">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">science</span>
          SMILES → 3D
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">grain</span>
          COD（晶体）
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">draw</span>
          绘制
        </span>
      </div>
    </div>
    <p class="image-caption">示例：带前缀的搜索栏以及高级搜索对话框中的选项卡</p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">A</span>
        <div>
          <strong>齿轮图标（搜索设置）：</strong>
          点击主搜索栏右侧的齿轮按钮 <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">settings</span>，即可打开<em>高级搜索</em>弹窗。在这里您可以通过选项卡切换数据库、使用交互式筛选（例如 PDB 的链选择），或试用预设的示例分子。
        </div>
      </li>
      <li>
        <span class="legend-number">B</span>
        <div>
          <strong>在搜索框中直接使用前缀：</strong>
          您甚至无需打开弹窗——只需在主搜索框中直接输入前缀和冒号（例如 <code>smiles:</code>、<code>pdb:</code>）。应用会自动识别查询类型，并将其发送到相应的服务。分子式和 SMILES 即使不加前缀也能被识别。
        </div>
      </li>
    </ul>

    <!-- Input source cards -->
    <div class="adv-sources-grid">
      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">database</span>
            PubChem：分子式、同分异构体和 3D 构象
          </div>
          <span class="adv-prefix-badge">formula: / conformer:</span>
        </div>
        <p class="adv-card-desc">
          在 <em>PubChem</em> 选项卡中输入分子式，即可按相关性列出具有该分子式的所有化合物——例如 <code>C2H6O</code> 会同时列出乙醇和二甲醚——然后选择所需的化合物。勾选<em>选择 3D 构象</em>后，应用会提供 PubChem 为该化合物计算的最多 10 种空间构象，以替代默认结构。每种构象都会显示其 MMFF94 能量，括号内为与最稳定构象的能量差。这有助于演示分子的柔性，或将几种构象并排打印出来。所选构象会保存在搜索历史和分享链接中。
        </p>
        <div class="adv-card-example">
          示例：<code>H2SO4</code>、<code>C2H6O</code>（同分异构体）、Aspirin + <em>选择 3D 构象</em>。盐和金属配合物通常没有 3D 构象——此时应用会提供 2D → 3D 转换。
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">upload_file</span>
            ChemDraw 和 .mol 文件
          </div>
          <span class="adv-prefix-badge">上传 / 拖放 / Ctrl+V</span>
        </div>
        <p class="adv-card-desc">
          从 ChemDraw 导入结构有三种方式：将其保存为 <code>.cdx</code> 或 <code>.cdxml</code> 并上传文件；使用 <em>Edit → Copy As → MOL Text</em> 或 <em>CDXML Text</em>（编辑 → 复制为 → MOL/CDXML 文本），然后在应用中任意位置（其他文本框以外）按 <kbd>Ctrl</kbd>+<kbd>V</kbd> 粘贴；或者使用 <em>Copy As → SMILES</em>（复制为 SMILES）并粘贴到搜索框中。来自 ChemDraw、Marvin、ChemSketch 或其他编辑器的 <code>.mol</code> 文件也同样适用。绘制的（2D）结构没有空间坐标和氢原子，因此会被自动转换为 3D——在线时通过 NIH CACTUS，离线时在本地（OpenBabel）完成。基团缩写（Ph、OMe…）会被展开，电荷以及楔形键所表示的立体化学信息会被保留。
        </p>
        <div class="adv-card-example">
          已包含 3D 坐标的文件（例如从 Avogadro 导出的文件或 PubChem 的 3D SDF）会按原样加载。
        </div>
      </div>
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">science</span>
            SMILES 与 InChI
          </div>
          <span class="adv-prefix-badge">smiles: / cactus:</span>
        </div>
        <p class="adv-card-desc">
          通过 NIH CACTUS CIR（以 PubChem 3D 作为备选）将线性化学表示法直接转换为 3D 坐标。非常适合标准目录中没有的自定义、合成或特殊化合物。带有支链、环或多重键的 SMILES（例如 ChemDraw <em>Copy As → SMILES</em> 的输出）即使不加前缀也能被识别。
        </p>
        <div class="adv-card-example">
          示例：<code>smiles: CC(=O)Oc1ccccc1C(=O)O</code>（阿司匹林）、<code>smiles: C1CCCCC1</code>（环己烷）、<code>smiles: C12C3C4C1C5C2C3C45</code>（立方烷）
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">biotech</span>
            PDB 生物大分子
          </div>
          <span class="adv-prefix-badge">pdb:</span>
        </div>
        <p class="adv-card-desc">
          从蛋白质数据库（Protein Data Bank）获取生物大分子结构（蛋白质、酶、DNA、RNA）。在高级搜索对话框中，还可以指定单条链并切换是否包含结晶水分子。
        </p>
        <div class="adv-card-example">
          示例：<code>pdb: 1CRN</code>（crambin 蛋白）、<code>pdb: 1BNA</code>（B 型 DNA）、<code>pdb: 1CRN:A</code>（A 链）
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">category</span>
            CCD 配体与辅因子
          </div>
          <span class="adv-prefix-badge">ccd:</span>
        </div>
        <p class="adv-card-desc">
          从 PDB 化学组分词典（Chemical Component Dictionary）下载配体和辅因子。非常适合 3D 打印含金属的辅因子、染料以及与生物大分子结合的药物。
        </p>
        <div class="adv-card-example">
          示例：<code>ccd: HEM</code>（血红素）、<code>ccd: ATP</code>、<code>ccd: CLA</code>（叶绿素 a）
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">grain</span>
            COD 晶体与矿物
          </div>
          <span class="adv-prefix-badge">cod:</span>
        </div>
        <p class="adv-card-desc">
          查询晶体学开放数据库（Crystallography Open Database）。可按英文全文名称、实验式或数字 COD ID 加载无机晶格、盐和矿物。
        </p>
        <div class="adv-card-example">
          示例：<code>cod: 1506182</code>、<code>cod: CaCO3</code>（方解石）、<code>cod: quartz</code>（石英）、<code>cod: NaCl</code>
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">draw</span>
            绘制 2D → 3D
          </div>
          <span class="adv-prefix-badge">绘制选项卡</span>
        </div>
        <p class="adv-card-desc">
          直接在画布上绘制结构式：选择化学键（单键、双键、三键，或用于表示立体化学的楔形键/虚楔键）、元素（C、H、O、N、P、S、F、Cl、Br、I、B、Si、Se，或<em>其他</em>菜单中的任意元素）或环（苯、环己烷、环戊烷；更多环烷烃和杂环，如吡啶或呋喃，位于<em>更多环</em>中），然后点击或拖动。<em>+</em>/<em>−</em> 工具用于设置原子电荷，所绘结构的分子式和 SMILES 会实时显示在画布下方。用元素点击已有原子会更改该原子；点击空白处则会添加新原子。随后点击<em>生成 3D 模型</em>按钮即可计算包括氢原子在内的 3D 坐标。
        </p>
        <img src={drawImg} alt="高级搜索中的绘制选项卡，画布上绘有水杨酸" loading="lazy" class="tutorial-img draw-img">
        <p class="image-caption">示例：在绘制选项卡中绘制的水杨酸</p>
        <div class="adv-card-example">
          在线时，3D 结构由 NIH CACTUS 生成；没有网络时，则在您的浏览器中本地计算（OpenBabel，MMFF94 力场）。提示：请在联网状态下打开一次该选项卡，以便将离线计算引擎保存到浏览器中（已安装的应用会自动完成这一步）。
        </div>
      </div>
    </div>
  </details>

  <!-- Step 2 -->
  <details id="step-2" class="step-container" bind:open={sectionOpen['step-2']}>
    <summary><h2>第 2 步：显示界面</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>加载数据后，即可使用模型设置。第一步是选择分子的表示方式。</p>
    <img src={step2Img} alt="展开菜单的界面截图" loading="lazy" class="tutorial-img">
    <p class="image-caption">图 2：显示表示方式下拉菜单的界面</p>
  </details>

  <!-- Step 3 -->
  <details id="step-3" class="step-container" bind:open={sectionOpen['step-3']}>
    <summary><h2>第 3 步：选择表示方式</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>选择最适合您教学或 3D 打印需求的外观。</p>
    <img src={step3Img} alt="分子表示方式选择" loading="lazy" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">图 3：下拉菜单选项</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>选择模型类型：</strong>选择所需的外观（Spheres 空间填充模型、Ball-and-Stick 球棍模型、Sticks 棒状模型，或我们的隐藏彩蛋 <span class="easter-egg">Minecraft</span> 模式）。</div></li>
    </ul>
  </details>

  <!-- Step 4 and Interactive Gallery -->
  <details id="step-4" class="step-container" bind:open={sectionOpen['step-4']}>
    <summary><h2>第 4 步：参数设置与导出</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>调整模型的细节和比例，以获得最佳打印效果。将鼠标悬停在下方各选项上，即可查看参数如何改变模型外观。</p>

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

    <img src={step4Img} alt="球棍模型参数示例" loading="lazy" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">图 4：模型参数与导出选项</p>

    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>模型设置：</strong>在这里可以调整质量、模型大小、化学键直径或是否显示氢原子。</div></li>
      <li><span class="legend-number">5</span><div><strong>导出选项：</strong><em>下载模板</em>按钮用于下载分子的原始 <code>.sdf</code> 数据。蓝色的<em>单个 STL 文件</em>按钮会导出合并后的单色模型。</div></li>
      <li><span class="legend-number">6</span><div><strong>最终多色导出：</strong>使用绿色的<em>下载模型</em>按钮，可下载一个 <code>.zip</code> 压缩包，其中的模型按原子拆分，便于在切片软件中分配颜色。</div></li>
    </ul>
  </details>

  <!-- Step 5 -->
  <details id="step-5" class="step-container" bind:open={sectionOpen['step-5']}>
    <summary><h2>第 5 步：应用更改（重新加载）</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>图中展示的是一个较复杂的模型（ATP）。请注意，在<em>模型设置</em>部分进行任何调整后，预览都不会自动更新。</p>
    <img src={step5Img} alt="使用“重新加载”按钮更新模型" loading="lazy" class="tutorial-img">
    <p class="image-caption">图 5：ATP 模型和黄色的“重新加载”按钮</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>“重新加载”按钮：</strong>每次调整设置后，请务必先点击这个黄色按钮，才能将更改应用到 3D 预览中。</div></li>
    </ul>
  </details>

  <!-- SHARING MODEL AND SETTINGS -->
  <details id="sharing" class="step-container" bind:open={sectionOpen['sharing']}>
    <summary><h2>通过 URL 分享模型和设置</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>您可以通过分享链接（URL），轻松地将准备好的分子连同其精确的参数设置分享给同事或学生，也可以将其加入书签。</p>

    <div class="share-tutorial-mockup" aria-label="“分享”按钮和浮动 URL 弹窗示意图">
      <div class="share-mockup-popover">
        <div class="share-mockup-header">
          <span>分享链接</span>
          <span class="share-mockup-close" aria-hidden="true">✕</span>
        </div>
        <div class="share-mockup-input-row">
          <div class="share-mockup-url">https://3dmolekuly.vscht.cz/?source=pubchem&amp;mol=caffeine&amp;style=ball-and-stick&amp;q=50</div>
          <div class="share-mockup-copy">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            已复制！
          </div>
        </div>
      </div>

      <div class="share-mockup-actions">
        <div class="share-mockup-download">
          <span class="material-symbols-outlined" aria-hidden="true">deployed_code_update</span>
          下载模型（.3mf）
        </div>
        <div class="share-mockup-slice">
          切片 ▾
        </div>
        <div class="share-mockup-square-btn" title="分享">
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
        </div>
      </div>
    </div>
    <p class="image-caption">图 6：方形“分享”图标按钮及显示 URL 链接的浮动弹窗</p>

    <ul class="legend-list">
      <li><span class="legend-number">8</span><div><strong>“分享”按钮：</strong>点击方形的分享图标按钮（位于<em>切片</em>按钮旁边）。URL 会被复制到剪贴板，按钮变为绿色，并在其正上方弹出显示完整链接的窗口。URL 中编码了数据库来源（<code>pubchem</code>、<code>pdb</code>、<code>cod</code>）、分子名称或代码、所选显示类型以及所有已配置的参数，因此打开该链接时会自动应用全部设置并渲染模型。从 PubChem 选择的 3D 构象也会保存在链接中（<code>conformer:…</code>）。如果使用的是上传的本地文件（<code>.sdf</code>、<code>.mol</code>、<code>.pdb</code>、<code>.cif</code>、ChemDraw），链接只会分享显示类型和已配置的数值（<code>source=file</code>），这样任何上传自己文件的人都能直接使用预设好的设置。</div></li>
    </ul>
  </details>

  <!-- OFFLINE USAGE AND PWA INSTALLATION -->
  <details id="offline-pwa" class="step-container" bind:open={sectionOpen['offline-pwa']}>
    <summary><h2>离线使用与 PWA 安装</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      您可以将分子 3D 打印作为应用安装到电脑或手机上。在联网状态下首次访问后，应用会保存在浏览器中，之后<strong>无需网络连接</strong>也能继续使用——无论是在教室、实验室还是外出途中。
    </p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">computer</span>
        </span>
        <div>
          <strong>在电脑上安装（Chrome、Edge）：</strong>
          点击地址栏中（紧挨着 URL 右侧）的<em>安装应用</em>图标 <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">install_desktop</span>，然后点击<em>安装</em>确认。之后应用会在独立窗口中打开，并出现在“开始”菜单 / 启动台（Launchpad）中。
        </div>
      </li>
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">phone_iphone</span>
        </span>
        <div>
          <strong>在手机上安装：</strong>
          在 <em>Safari</em>（iPhone、iPad）中，轻点<em>分享</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">ios_share</span> → <em>添加到主屏幕</em>。在 <em>Chrome</em>（Android）中，打开 ⋮ 菜单 → <em>安装应用</em>（或<em>添加到主屏幕</em>）。
        </div>
      </li>
    </ul>

    <div class="adv-sources-grid">
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #2e7d32;" aria-hidden="true">offline_pin</span>
            离线可用
          </div>
        </div>
        <p class="adv-card-desc">
          从磁盘上传自己的文件（<code>.sdf</code>、<code>.mol</code>、<code>.pdb</code>、<code>.cif</code>、ChemDraw <code>.cdx</code>/<code>.cdxml</code>；2D 结构会通过本地计算转换为 3D）、3D 预览和所有表示方式、编辑模型参数、活动关节、封闭性（流形）检查，以及通过<em>下载模型</em>按钮导出 <code>.3mf</code> / <code>.stl</code>。高级搜索中的<em>绘制分子</em>同样可用——3D 模型在本地计算（OpenBabel）。前提是计算模块（约 8 MB）已保存在您的设备上：在浏览器中，请至少在联网时打开一次绘制选项卡；已安装的应用（PWA）在联网启动时会自动下载该模块。
        </p>
        <div class="adv-card-example">
          所有计算（3D 几何、Manifold、ZIP 打包）都直接在您的浏览器中运行——不会向服务器发送任何数据。
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #e53935;" aria-hidden="true">cloud_off</span>
            需要网络连接
          </div>
        </div>
        <p class="adv-card-desc">
          从在线目录中搜索和下载结构——<strong>PubChem</strong>、<strong>PDB</strong>（包括 CCD 配体）、<strong>COD</strong>，以及通过 NIH CACTUS 进行 SMILES 转换。直接在切片软件中打开模型的<em>切片</em>按钮也需要联网。
        </p>
        <div class="adv-card-example">
          提示：离线时，请通过<em>下载模型</em>将模型下载为 <code>.3mf</code>，然后在切片软件中手动打开。
        </div>
      </div>
    </div>
  </details>

  <!-- SLICER IMPORT INFO -->
  <details id="slicer-import" class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;" bind:open={sectionOpen['slicer-import']}>
    <summary><h2>如何导入切片软件？</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p style="font-size: 1.1rem; text-align: center;">
      要进行<strong>多色</strong>分子打印，请确认切片软件显示以下提示<br>
      <em>“Multi-part object detected / An object with multiple parts was detected”（检测到多部件对象），</em><br>
      然后选择<strong>“YES”（是）</strong>确认。
    </p>
    <img src="/assets/multipartobject.svg" alt="切片软件导入对话框" loading="lazy" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
    <PrusaSlicerPluginNote />
  </details>

  <!-- PRINTABLES AND MAKERWORLD SECTION -->
  <details id="ready-models" class="step-container printables-container" bind:open={sectionOpen['ready-models']}>
    <summary><h2>试试 Printables 和 MakerWorld 上的现成打印模型</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p class="printables-desc">
      想寻找灵感，或者无需调整设置就直接打印热门分子？欢迎在 Printables 和 MakerWorld 上浏览我们经过验证、可直接打印的 3D 分子模型合集。
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
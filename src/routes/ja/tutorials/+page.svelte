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
            name: "標準のメッシュ品質（品質：50）", 
            img: sphereQ50Img, 
            desc: "なめらかできれいな球体モデルになる標準設定です。" 
        },
        { 
            name: "低品質（品質：5）", 
            img: sphereQ5Img, 
            desc: "ポリゴン数を大幅に減らします。「ローポリ」風の見た目にしたいときや、巨大な分子を速く描画したいときに適しています。" 
        },
        { 
            name: "水素を非表示", 
            img: sphereHoffImg, 
            desc: "水素原子の表示をオフにします。複雑な有機分子を大幅に簡略化できます。" 
        },
        { 
            name: "標準の球棒モデル（Ball-and-Stick）", 
            img: waterBasImg, 
            desc: "球棒モードによる水分子の基本的な表示です。" 
        },
        { 
            name: "多重結合を表示", 
            img: co2MultImg, 
            desc: "二酸化炭素（CO2）では、炭素と酸素の間の二重結合を表示します（初期設定の単結合との比較）。" 
        },
        { 
            name: "原子径を統一", 
            img: waterUniformImg, 
            desc: "実際のファンデルワールス半径に関係なく、モデル内のすべての原子の大きさをそろえます。" 
        },
        { 
            name: "結合を別グループにする", 
            img: waterGroupImg, 
            desc: "出力時に結合を個別のパーツに分けるため、色分けやマルチカラー3Dプリントの準備が簡単になります。" 
        },
        { 
            name: "大きな縮尺（拡大倍率：1.5）", 
            img: waterMultImg, 
            desc: "モデル全体の体積と各要素の直径を大きくし、より存在感のある模型に仕上げます。" 
        },
        { 
            name: "結合の太さ（結合の太さの係数：0.6）", 
            img: waterBondDiaImg, 
            desc: "原子をつなぐ棒を太くし、印刷したモデルの機械的強度を高めます。" 
        }
    ];

    // Default selected option in the gallery
    let activeOption = settingsOptions[0];

    // --- TABLE OF CONTENTS (IDs match the sections below) ---
    const tocItems = [
        { id: 'step-1', label: 'ステップ1：分子を選ぶ' },
        { id: 'advanced-search', label: '詳細検索' },
        { id: 'step-2', label: 'ステップ2：表示画面' },
        { id: 'step-3', label: 'ステップ3：表示方法' },
        { id: 'step-4', label: 'ステップ4：パラメーターと出力' },
        { id: 'step-5', label: 'ステップ5：変更を適用（再読み込み）' },
        { id: 'sharing', label: 'URL で共有' },
        { id: 'offline-pwa', label: 'オフラインとインストール（PWA）' },
        { id: 'slicer-import', label: 'スライサーへのインポート' },
        { id: 'ready-models', label: 'すぐに印刷できるモデル' }
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
      目次
      <span class="material-symbols-outlined toc-chevron" aria-hidden="true">expand_more</span>
    </summary>
    <button type="button" class="toc-toggle-all" on:click={toggleAllSections}>
      <span class="material-symbols-outlined" aria-hidden="true">{allSectionsOpen ? 'unfold_less' : 'unfold_more'}</span>
      {allSectionsOpen ? 'すべて折りたたむ' : 'すべて展開'}
    </button>
    <nav aria-label="チュートリアルの目次">
      <ol class="toc-list">
        {#each tocItems as item (item.id)}
          <li><a href="#{item.id}" on:click={() => (sectionOpen[item.id] = true)}>{item.label}</a></li>
        {/each}
      </ol>
    </nav>
  </details>
</aside>

<section class="tutorial">
  <h1>「分子の3Dプリント」の使い方</h1>
  <p style="text-align: center; margin-bottom: 1.5rem;">
    分子模型を3Dプリント用に準備するのは、これまでになく簡単です。全体の流れは、次の3つの簡単なステップにまとめられます。
  </p>

  <!-- FLOW SCHEMA -->
  <div class="flow-schema">
    <div class="flow-step-badge">名前を入力</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">モデルを生成</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">ダウンロード</div>
  </div>

  <!-- Step 1 -->
  <details id="step-1" class="step-container" bind:open={sectionOpen['step-1']}>
    <summary><h2>ステップ1：分子を選ぶ</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>まず、どの物質をモデル化するかをプログラムに指定します。自動インポートを使うことも、ご自身のデータをアップロードすることもできます。</p>
    <img src={step1Img} alt="検索画面のスクリーンショット" class="tutorial-img">
    <p class="image-caption">図1：PubChem の検索画面</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>検索：</strong>「PubChem で検索」欄に物質の<strong>英語名</strong>（例：<code>Aspirin</code>、<code>Caffeine</code>）を入力して Enter キーを押します。PubChem は日本語名に対応していないため、名前は英語で入力してください。データは公開データベースから自動的にダウンロードされます。名前のほかに、CAS 番号、PubChem CID、<strong>分子式</strong>（<code>H2O</code>、<code>CO2</code>、<code>H2SO4</code> – 大文字・小文字は区別されず、<code>h2so4</code> や <code>H₂O</code> も使えます）、または <strong>SMILES</strong>（例：<code>CC(=O)OC1=CC=CC=C1C(=O)O</code>）も入力できます。分子式を入力すると最も関連度の高い化合物が読み込まれます。同じ分子式を持つ化合物が複数ある場合（異性体）は、詳細検索で目的のものを選んでください。</div></li>
      <li><span class="legend-number">2</span><div><strong>独自のデータ：</strong><code>.sdf</code>、<code>.mol</code>、<code>.pdb</code>、<code>.cif</code>、または ChemDraw（<code>.cdx</code>、<code>.cdxml</code>）のファイルを、<em>アップロード</em>ボタンでアップロードするか、ウィンドウにドラッグするか、<kbd>Ctrl</kbd>+<kbd>V</kbd> で貼り付けます。モデルはすぐに読み込まれます。2D構造（通常は ChemDraw や Marvin から水素なしで出力されたもの）は自動的に3Dに変換され、水素が付加されます。</div></li>
    </ul>
  </details>

  <!-- ADVANCED SEARCH -->
  <details id="advanced-search" class="step-container" bind:open={sectionOpen['advanced-search']}>
    <summary><h2>詳細検索と特殊な入力</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      SMILES 文字列からの化合物、Protein Data Bank の生体高分子、結晶格子、金属が結合した補因子などをモデル化したいときは、複数のデータベースに対応した詳細検索をご利用ください。
    </p>

    <div class="adv-search-mockup" aria-label="検索バーと詳細検索のイメージ">
      <!-- Search bar mockup -->
      <div class="adv-search-bar-mockup">
        <span class="material-symbols-outlined" style="color: #64748b; font-size: 1.25rem;" aria-hidden="true">search</span>
        <div class="adv-search-input-text">
          <span class="adv-search-prefix-highlight">smiles:</span>CC(=O)Oc1ccccc1C(=O)O
        </div>
        <div class="adv-gear-btn-mockup" title="詳細検索">
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
          PDB / リガンド
        </span>
        <span class="adv-tab-pill active">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">science</span>
          SMILES → 3D
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">grain</span>
          COD（結晶）
        </span>
        <span class="adv-tab-pill">
          <span class="material-symbols-outlined" style="font-size: 1rem;" aria-hidden="true">draw</span>
          描画
        </span>
      </div>
    </div>
    <p class="image-caption">例：プレフィックス付きの検索バーと、詳細検索ダイアログのタブ</p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">A</span>
        <div>
          <strong>歯車アイコン（検索設定）：</strong>
          メイン検索バー右側の歯車ボタン <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">settings</span> をクリックすると、<em>詳細検索</em>のポップアップが開きます。タブでデータベースを切り替えたり、対話的なフィルター（PDB の鎖の選択など）を使ったり、あらかじめ用意された例の分子を試したりできます。
        </div>
      </li>
      <li>
        <span class="legend-number">B</span>
        <div>
          <strong>検索欄での直接プレフィックス：</strong>
          ポップアップを開かなくても、メイン検索欄にプレフィックスとコロンを続けて入力するだけで検索できます。アプリがクエリの種類を自動的に判別し、対応するサービスに振り分けます。分子式と SMILES はプレフィックスなしでも認識されます。
        </div>
      </li>
    </ul>

    <!-- Input source cards -->
    <div class="adv-sources-grid">
      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">database</span>
            PubChem：分子式、異性体、3D配座
          </div>
          <span class="adv-prefix-badge">formula: / conformer:</span>
        </div>
        <p class="adv-card-desc">
          <em>PubChem</em> タブに分子式を入力すると、その分子式を持つすべての化合物が関連度順に一覧表示されます（例えば <code>C2H6O</code> ならエタノールとジメチルエーテルの両方）。その中から目的のものを選んでください。<em>3D配座を選択</em>にチェックを入れると、初期構造の代わりに、PubChem がその化合物について計算した最大10個の立体配座が表示されます。それぞれに MMFF94 エネルギーと、括弧内に最も安定な配座との差が示されます。分子の柔軟性を示したり、複数の配座を並べて印刷したりするのに便利です。選んだ配座は検索履歴と共有リンクにも保存されます。
        </p>
        <div class="adv-card-example">
          例：<code>H2SO4</code>、<code>C2H6O</code>（異性体）、Aspirin + <em>3D配座を選択</em>。塩や金属錯体には3D配座がないことが多く、その場合アプリは 2D → 3D 変換を提案します。
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">upload_file</span>
            ChemDraw と .mol ファイル
          </div>
          <span class="adv-prefix-badge">アップロード / ドラッグ＆ドロップ / Ctrl+V</span>
        </div>
        <p class="adv-card-desc">
          ChemDraw から構造を取り込む方法は3つあります。<code>.cdx</code> または <code>.cdxml</code> として保存してファイルをアップロードする方法、<em>Edit → Copy As → MOL Text</em> または <em>CDXML Text</em>（編集 → 形式を指定してコピー）を使い、アプリ内の任意の場所（他のテキスト欄以外）で <kbd>Ctrl</kbd>+<kbd>V</kbd> で貼り付ける方法、そして <em>Copy As → SMILES</em> を使って検索欄に貼り付ける方法です。ChemDraw、Marvin、ChemSketch などのエディターで作成した <code>.mol</code> ファイルも同様に使えます。描画した（2D）構造には空間座標や水素がないため、自動的に3Dに変換されます。オンラインでは NIH CACTUS、オフラインではローカル（OpenBabel）で処理されます。官能基の略記（Ph、OMe…）は展開され、電荷やくさび形結合による立体化学は保持されます。
        </p>
        <div class="adv-card-example">
          すでに3D座標を含むファイル（例：Avogadro から出力したもの、PubChem の 3D SDF）は、そのまま読み込まれます。
        </div>
      </div>
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">science</span>
            SMILES と InChI
          </div>
          <span class="adv-prefix-badge">smiles: / cactus:</span>
        </div>
        <p class="adv-card-desc">
          NIH CACTUS CIR を使って、線形の化学表記を直接3D座標に変換します（PubChem 3D による代替あり）。標準的なカタログにない独自の化合物、合成化合物、珍しい化合物に最適です。分岐、環、多重結合を含む SMILES（例：ChemDraw の <em>Copy As → SMILES</em> の出力）は、プレフィックスなしでも認識されます。
        </p>
        <div class="adv-card-example">
          例：<code>smiles: CC(=O)Oc1ccccc1C(=O)O</code>（アスピリン）、<code>smiles: C1CCCCC1</code>（シクロヘキサン）、<code>smiles: C12C3C4C1C5C2C3C45</code>（キュバン）
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">biotech</span>
            PDB の生体高分子
          </div>
          <span class="adv-prefix-badge">pdb:</span>
        </div>
        <p class="adv-card-desc">
          Protein Data Bank から生体高分子の構造（タンパク質、酵素、DNA、RNA）を取得します。詳細検索ダイアログでは、個別の鎖を指定したり、結晶水分子の表示を切り替えたりすることもできます。
        </p>
        <div class="adv-card-example">
          例：<code>pdb: 1CRN</code>（クランビン）、<code>pdb: 1BNA</code>（B-DNA）、<code>pdb: 1CRN:A</code>（A 鎖）
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">category</span>
            CCD のリガンドと補因子
          </div>
          <span class="adv-prefix-badge">ccd:</span>
        </div>
        <p class="adv-card-desc">
          PDB Chemical Component Dictionary からリガンドや補因子をダウンロードします。金属を含む補因子、色素、生体高分子に結合した薬物の3Dプリントに最適です。
        </p>
        <div class="adv-card-example">
          例：<code>ccd: HEM</code>（ヘム）、<code>ccd: ATP</code>、<code>ccd: CLA</code>（クロロフィル a）
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">grain</span>
            COD の結晶と鉱物
          </div>
          <span class="adv-prefix-badge">cod:</span>
        </div>
        <p class="adv-card-desc">
          Crystallography Open Database を検索します。無機結晶格子、塩、鉱物を、英語の名称による全文検索、組成式、または数値の COD ID で読み込めます。
        </p>
        <div class="adv-card-example">
          例：<code>cod: 1506182</code>、<code>cod: CaCO3</code>（方解石）、<code>cod: quartz</code>（石英）、<code>cod: NaCl</code>
        </div>
      </div>

      <div class="adv-source-card adv-source-card--wide">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #0070f3;" aria-hidden="true">draw</span>
            描画 2D → 3D
          </div>
          <span class="adv-prefix-badge">描画タブ</span>
        </div>
        <p class="adv-card-desc">
          キャンバス上で直接構造式を描けます。結合（単結合、二重結合、三重結合、立体化学用のくさび形／破線くさび形結合）、元素（C、H、O、N、P、S、F、Cl、Br、I、B、Si、Se、または<em>その他</em>メニューの任意の元素）、環（ベンゼン、シクロヘキサン、シクロペンタン。<em>その他の環</em>にはさらに多くのシクロアルカンや、ピリジン、フランなどの複素環があります）を選び、クリックまたはドラッグします。<em>+</em>／<em>−</em> ツールで原子の電荷を設定でき、描いた構造の分子式と SMILES がキャンバスの下にリアルタイムで表示されます。元素を選んだ状態で既存の原子をクリックするとその原子が変更され、空いている場所をクリックすると新しい原子が追加されます。最後に<em>3Dモデルを生成</em>ボタンを押すと、水素を含む3D座標が計算されます。
        </p>
        <img src={drawImg} alt="詳細検索の描画タブで、キャンバスにサリチル酸を描いた例" loading="lazy" class="tutorial-img draw-img">
        <p class="image-caption">例：描画タブで描いたサリチル酸</p>
        <div class="adv-card-example">
          オンラインでは3D構造は NIH CACTUS から取得され、インターネットに接続していない場合はブラウザ内でローカルに計算されます（OpenBabel、MMFF94 力場）。ヒント：オンラインのときに一度このタブを開いておくと、オフライン用エンジンがブラウザに保存されます（インストール版アプリでは自動的に行われます）。
        </div>
      </div>
    </div>
  </details>

  <!-- Step 2 -->
  <details id="step-2" class="step-container" bind:open={sectionOpen['step-2']}>
    <summary><h2>ステップ2：表示画面</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>データを読み込むと、モデル設定が使えるようになります。最初に分子の表示方法を選びます。</p>
    <img src={step2Img} alt="メニューを開いた状態の画面のスクリーンショット" loading="lazy" class="tutorial-img">
    <p class="image-caption">図2：表示方法のドロップダウンメニューを開いた画面</p>
  </details>

  <!-- Step 3 -->
  <details id="step-3" class="step-container" bind:open={sectionOpen['step-3']}>
    <summary><h2>ステップ3：表示方法を選ぶ</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>教育や3Dプリントの目的に最も合った見た目を選んでください。</p>
    <img src={step3Img} alt="分子の表示方法の選択" loading="lazy" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">図3：ドロップダウンメニューの選択肢</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>モデルの種類を選択：</strong>目的の見た目を選びます（Spheres＝空間充填モデル、Ball-and-Stick＝球棒モデル、Sticks＝棒モデル、または隠しモードの <span class="easter-egg">Minecraft</span>）。</div></li>
    </ul>
  </details>

  <!-- Step 4 and Interactive Gallery -->
  <details id="step-4" class="step-container" bind:open={sectionOpen['step-4']}>
    <summary><h2>ステップ4：パラメーター設定と出力</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>最適な印刷結果が得られるよう、モデルの細部や比率を調整します。下の各オプションにマウスを重ねると、パラメーターによって結果がどう変わるかを確認できます。</p>
    
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

    <img src={step4Img} alt="球棒モデルのパラメーターの例" loading="lazy" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">図4：モデルのパラメーターと出力オプション</p>
    
    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>モデル設定：</strong>品質、モデルのサイズ、結合の太さ、水素の表示などを調整できます。</div></li>
      <li><span class="legend-number">5</span><div><strong>出力オプション：</strong><em>テンプレートをダウンロード</em>ボタンでは、分子の元データ（<code>.sdf</code>）をダウンロードします。青い<em>STL ファイル1つ</em>ボタンでは、1つに結合した単色モデルを出力します。</div></li>
      <li><span class="legend-number">6</span><div><strong>最終的なマルチカラー出力：</strong>緑色の<em>モデルをダウンロード</em>ボタンを使うと、原子ごとに分割されたモデルを含む <code>.zip</code> アーカイブをダウンロードできます。スライサーでの色の割り当てが簡単になります。</div></li>
    </ul>
  </details>

  <!-- Step 5 -->
  <details id="step-5" class="step-container" bind:open={sectionOpen['step-5']}>
    <summary><h2>ステップ5：変更を適用する（再読み込み）</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>図はより複雑なモデル（ATP）の例です。<em>モデル設定</em>で何かを調整しても、プレビューは自動的には更新されないことにご注意ください。</p>
    <img src={step5Img} alt="再読み込みボタンでモデルを更新する様子" loading="lazy" class="tutorial-img">
    <p class="image-caption">図5：ATP モデルと黄色の再読み込みボタン</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>再読み込みボタン：</strong>設定を変更したら、必ず最初にこの黄色のボタンをクリックしてください。変更が3Dプレビューに反映されます。</div></li>
    </ul>
  </details>

  <!-- SHARING MODEL AND SETTINGS -->
  <details id="sharing" class="step-container" bind:open={sectionOpen['sharing']}>
    <summary><h2>URL でモデルと設定を共有する</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>共有用の URL リンクを使えば、準備した分子を正確なパラメーター設定ごと同僚や学生と簡単に共有したり、ブックマークに保存したりできます。</p>

    <div class="share-tutorial-mockup" aria-label="共有ボタンと URL のポップアップのイメージ">
      <div class="share-mockup-popover">
        <div class="share-mockup-header">
          <span>共有用リンク</span>
          <span class="share-mockup-close" aria-hidden="true">✕</span>
        </div>
        <div class="share-mockup-input-row">
          <div class="share-mockup-url">https://3dmolekuly.vscht.cz/?source=pubchem&amp;mol=caffeine&amp;style=ball-and-stick&amp;q=50</div>
          <div class="share-mockup-copy">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
            コピーしました！
          </div>
        </div>
      </div>

      <div class="share-mockup-actions">
        <div class="share-mockup-download">
          <span class="material-symbols-outlined" aria-hidden="true">deployed_code_update</span>
          モデルをダウンロード（.3mf）
        </div>
        <div class="share-mockup-slice">
          スライス ▾
        </div>
        <div class="share-mockup-square-btn" title="共有">
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
        </div>
      </div>
    </div>
    <p class="image-caption">図6：四角い共有アイコンボタンと、URL リンクを表示するポップアップ</p>

    <ul class="legend-list">
      <li><span class="legend-number">8</span><div><strong>共有ボタン：</strong>四角い共有アイコンのボタン（<em>スライス</em>ボタンの隣）をクリックします。URL がクリップボードにコピーされ、ボタンが緑色に変わり、そのすぐ上にリンク全体を表示するポップアップが現れます。URL にはデータベースの種類（<code>pubchem</code>、<code>pdb</code>、<code>cod</code>）、分子名またはコード、選択した表示方法、設定したすべてのパラメーターが含まれるため、リンクを開くとすべての設定が自動的に適用され、モデルが表示されます。PubChem で選んだ3D配座もリンクに保持されます（<code>conformer:…</code>）。アップロードしたローカルファイル（<code>.sdf</code>、<code>.mol</code>、<code>.pdb</code>、<code>.cif</code>、ChemDraw）で作業している場合、リンクには表示方法と設定値のみが含まれ（<code>source=file</code>）、受け取った人が自分のファイルをアップロードするとその設定がそのまま適用されます。</div></li>
    </ul>
  </details>

  <!-- OFFLINE USAGE AND PWA INSTALLATION -->
  <details id="offline-pwa" class="step-container" bind:open={sectionOpen['offline-pwa']}>
    <summary><h2>オフラインでの利用と PWA のインストール</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p>
      「分子の3Dプリント」は、パソコンやスマートフォンにアプリとしてインストールできます。インターネットに接続した状態で一度アクセスすると、アプリがブラウザに保存され、教室や研究室、外出先などで<strong>インターネットに接続していなくても</strong>使い続けられます。
    </p>

    <ul class="legend-list">
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">computer</span>
        </span>
        <div>
          <strong>パソコンへのインストール（Chrome、Edge）：</strong>
          アドレスバー（URL のすぐ右）にある<em>アプリをインストール</em>アイコン <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">install_desktop</span> をクリックし、<em>インストール</em>で確定します。アプリは専用のウィンドウで開き、スタートメニュー／Launchpad に表示されます。
        </div>
      </li>
      <li>
        <span class="legend-number">
          <span class="material-symbols-outlined legend-icon" aria-hidden="true">phone_iphone</span>
        </span>
        <div>
          <strong>スマートフォンへのインストール：</strong>
          <em>Safari</em>（iPhone、iPad）では、<em>共有</em> <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.15rem; color: #0070f3;">ios_share</span> → <em>ホーム画面に追加</em>をタップします。<em>Chrome</em>（Android）では、⋮ メニュー → <em>アプリをインストール</em>（または<em>ホーム画面に追加</em>）を選びます。
        </div>
      </li>
    </ul>

    <div class="adv-sources-grid">
      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #2e7d32;" aria-hidden="true">offline_pin</span>
            オフラインで使える機能
          </div>
        </div>
        <p class="adv-card-desc">
          ディスクからの独自ファイルのアップロード（<code>.sdf</code>、<code>.mol</code>、<code>.pdb</code>、<code>.cif</code>、ChemDraw <code>.cdx</code>/<code>.cdxml</code>。2D構造はローカルでの計算により3Dに変換されます）、3Dプレビューとすべての表示方法、モデルのパラメーター編集、可動ジョイント、水密性（マニフォールド）チェック、<em>モデルをダウンロード</em>ボタンによる <code>.3mf</code> / <code>.stl</code> への出力。詳細検索の<em>分子を描画</em>も使えます（3Dモデルはローカルで計算されます、OpenBabel）。ただし、計算モジュール（約 8 MB）がすでに端末に保存されている必要があります。ブラウザでは、オンラインのときに描画タブを少なくとも一度開いてください。インストール版アプリ（PWA）では、オンラインで起動したときに自動的にダウンロードされます。
        </p>
        <div class="adv-card-example">
          すべての計算（3D形状、Manifold、ZIP 圧縮）はブラウザ内で直接実行され、サーバーには何も送信されません。
        </div>
      </div>

      <div class="adv-source-card">
        <div class="adv-card-header">
          <div class="adv-card-title">
            <span class="material-symbols-outlined" style="color: #e53935;" aria-hidden="true">cloud_off</span>
            接続が必要な機能
          </div>
        </div>
        <p class="adv-card-desc">
          オンラインカタログ（<strong>PubChem</strong>、<strong>PDB</strong>（CCD リガンドを含む）、<strong>COD</strong>）での構造の検索とダウンロード、および NIH CACTUS による SMILES の変換。モデルをスライサーで直接開く<em>スライス</em>ボタンにもインターネット接続が必要です。
        </p>
        <div class="adv-card-example">
          ヒント：オフラインのときは、<em>モデルをダウンロード</em>でモデルを <code>.3mf</code> として保存し、スライサーで手動で開いてください。
        </div>
      </div>
    </div>
  </details>

  <!-- SLICER IMPORT INFO -->
  <details id="slicer-import" class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;" bind:open={sectionOpen['slicer-import']}>
    <summary><h2>スライサーへのインポート方法</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p style="font-size: 1.1rem; text-align: center;">
      分子を<strong>マルチカラー</strong>で印刷するには、スライサーに次のメッセージが表示されることを確認してください。<br>
      <em>「Multi-part object detected / An object with multiple parts was detected」（複数のパーツからなるオブジェクトを検出しました）</em><br>
      表示されたら<strong>「YES」</strong>を選んで確定します。
    </p>
    <img src="/assets/multipartobject.svg" alt="スライサーのインポートダイアログ" loading="lazy" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
    <PrusaSlicerPluginNote />
  </details>

  <!-- PRINTABLES AND MAKERWORLD SECTION -->
  <details id="ready-models" class="step-container printables-container" bind:open={sectionOpen['ready-models']}>
    <summary><h2>Printables と MakerWorld ですぐに印刷できるモデルを試す</h2><span class="material-symbols-outlined step-chevron" aria-hidden="true">expand_more</span></summary>
    <p class="printables-desc">
      アイデアを探している方や、設定を調整せずに人気の分子をすぐに印刷したい方は、Printables と MakerWorld で公開している、検証済みですぐに印刷できる分子3Dモデルのコレクションをご覧ください。
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
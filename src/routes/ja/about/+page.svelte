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
  <h1>プロジェクトについて</h1>

  <h2>私たちについて</h2>
  <p>
    このプロジェクトは、<strong>学術機関と学生の協力</strong>によって生まれました。
    <em>医学</em>、<em>生化学</em>、<em>情報科学</em>、<em>教育</em>の専門家が連携することで、
    <strong>教育方法と技術の両面でバランスの取れた</strong>ツールを実現しています。
  </p>
  <p>
    本プロジェクトは次の機関の共同事業です。
    <br>
    • <strong>プラハ化学技術大学（UCT Prague）化学教育・人文学科</strong>
    <br>
    • <strong>カレル大学第一医学部</strong>
  </p>

  <div class="logos-container">
    <a href="https://kuhv.vscht.cz" target="_blank" rel="noopener noreferrer" title="プラハ化学技術大学 化学教育・人文学科">
      <img src={vscht} alt="プラハ化学技術大学 化学教育・人文学科のロゴ" height="75" class="logo logo-vscht">
    </a>
    <a href="https://www.lf1.cuni.cz" target="_blank" rel="noopener noreferrer" title="カレル大学第一医学部">
      <img src={lf1} alt="カレル大学第一医学部のロゴ" height="75" class="logo logo-light">
      <img src={lf1Dark} alt="カレル大学第一医学部のロゴ" height="75" class="logo logo-dark">
    </a>
  </div>

  <h2>開発の目的</h2>
  <p>
    <strong>分子の形</strong>、<strong>空間的な相互作用</strong>、<strong>生体有機分子の性質</strong>を本当に理解するには、
    <em>直感的に理解できる3Dモデル</em>を手に取ることが欠かせないと私たちは考えています。デジタルでの可視化は便利ですが、限界もあります。
    専用のソフトウェアが必要で、<em>授業</em>や<em>実物での説明</em>には必ずしも向いていません。
    分子模型キットでの組み立ては<strong>時間がかかり、技術的にも手間がかかります</strong>。
    また、印刷用モデルの準備も複雑になりがちです。そこで私たちは、
    <strong>分子の3Dプリント</strong>を<em>より身近に、より速く、より使いやすく</em>するためにこのプロジェクトを始めました。
  </p>

  <h2>沿革と開発</h2>
  <p>
    アプリケーションの最初のプロトタイプは、2023年に <em>PyMOL</em> 用のターミナルスクリプトとして作られました。その後 <em>Python</em> で何度か改良を重ね、ウェブアプリケーションという形に発展しました。本プロジェクトはカレル大学第一医学部でも評価され、<a href="https://www.lf1.cuni.cz/25-rocnik-svk-a-vpz-uz-znaji-sve-viteze" target="_blank" rel="noopener noreferrer">第25回学生科学会議（SVK）</a>で賞を受賞しました。
  </p>

  <h2>できること</h2>
  <p>
    このアプリケーションでは、次のことができます。
  </p>
  <ul class="tech-list">
    <li><em>PubChem</em> などのサービスから分子データを<strong>自動でインポート</strong></li>
    <li><strong>独自のファイルをアップロード</strong>（<code>.sdf</code>）</li>
    <li>さまざまな表示方法で<strong>3Dモデルを生成</strong></li>
    <li><strong>原子を色分け</strong>し、<em>モデルの品質</em>を選択</li>
    <li><strong>モデルを印刷用に最適化</strong>し、スライサー（例：<em>PrusaSlicer</em>）向けに出力</li>
    <li>分子模型の<strong>マルチカラー3Dプリントに対応</strong></li>
  </ul>
  <p>
    このアプリケーションにより、分子データから印刷用モデルを準備する時間を
    わずか<strong>数分</strong>に短縮できます。<em>手作業での処理</em>よりもはるかに効率的です。
  </p>

  <PrusaSlicerPluginNote />

  <h2>技術基盤</h2>
  <ul class="tech-list">
    <li>言語：<span class="highlight">TypeScript</span></li>
    <li>GUI：<em>SvelteKit</em>、<em>Bootstrap</em></li>
    <li>データ連携：公開データベース（<em>PubChem</em>、<em>COD</em>）との接続</li>
    <li>表示方法：<em>ファンデルワールス</em>（空間充填、<em>Spheres</em>）、<em>Ball-and-Stick</em>（球棒モデル）、<em>Stick</em>（棒モデル）</li>
    <li>最適化：詳細度の調整、水素の付加、モデルの改良など</li>
    <li>出力：スライサー用の印刷可能な形式</li>
  </ul>

  <p style="margin-top: 2rem; text-align: center;">
    私たちの目標は、<em>学生、研究者、教育者</em>をはじめ、できるだけ多くの人が
    <strong>分子の3Dプリント</strong>を利用できるようにすることです。
  </p>
</section>

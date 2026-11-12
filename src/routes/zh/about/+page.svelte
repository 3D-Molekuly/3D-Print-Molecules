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
  <h1>关于项目</h1>

  <h2>我们是谁</h2>
  <p>
    本项目是<strong>学术机构与学生合作</strong>的成果。
    来自<em>医学</em>、<em>生物化学</em>、<em>计算机科学</em>和<em>教育</em>领域的专家共同参与，
    确保该工具在<strong>教学方法和技术上都兼顾平衡</strong>。
  </p>
  <p>
    本项目由以下单位共同开发：
    <br>
    • <strong>布拉格化工大学（UCT Prague）化学教育与人文学系</strong>
    <br>
    • <strong>查理大学第一医学院</strong>
  </p>

  <div class="logos-container">
    <a href="https://kuhv.vscht.cz" target="_blank" rel="noopener noreferrer" title="布拉格化工大学化学教育与人文学系">
      <img src={vscht} alt="布拉格化工大学化学教育与人文学系标志" height="75" class="logo logo-vscht">
    </a>
    <a href="https://www.lf1.cuni.cz" target="_blank" rel="noopener noreferrer" title="查理大学第一医学院">
      <img src={lf1} alt="查理大学第一医学院标志" height="75" class="logo logo-light">
      <img src={lf1Dark} alt="查理大学第一医学院标志" height="75" class="logo logo-dark">
    </a>
  </div>

  <h2>为什么开发它</h2>
  <p>
    我们相信，要真正<strong>理解分子的形状</strong>、<strong>空间相互作用</strong>
    以及<strong>生物有机分子的性质</strong>，必须借助<em>直观易懂的 3D 模型</em>。
    数字可视化固然有用，但往往有局限——它需要专业软件，也不太适合<em>教学</em>或<em>实物演示</em>。
    用模型套件搭建分子模型<strong>耗时且技术要求高</strong>，而准备可打印的模型也可能相当复杂。
    正因如此，我们创建了这个项目——让<strong>分子 3D 打印</strong>变得<em>更易上手、更快速、更友好</em>。
  </p>

  <h2>历史与发展</h2>
  <p>
    应用的第一个原型诞生于 2023 年，最初是 <em>PyMOL</em> 软件的一个终端脚本，随后经过多次 <em>Python</em> 版本的迭代，逐步发展为网页应用的构想。该项目还在查理大学第一医学院获得认可，在<a href="https://www.lf1.cuni.cz/25-rocnik-svk-a-vpz-uz-znaji-sve-viteze" target="_blank" rel="noopener noreferrer">第 25 届学生科研会议（SVK）</a>上获奖。
  </p>

  <h2>功能</h2>
  <p>
    我们的应用可以：
  </p>
  <ul class="tech-list">
    <li>从 <em>PubChem</em> 等服务<strong>自动导入</strong>分子数据</li>
    <li><strong>上传自己的文件</strong>（<code>.sdf</code>）</li>
    <li>以多种表示方式<strong>生成 3D 模型</strong></li>
    <li><strong>按原子着色</strong>并选择<em>模型质量</em></li>
    <li><strong>针对打印优化模型</strong>并导出到切片软件（例如 <em>PrusaSlicer</em>）</li>
    <li><strong>支持多色 3D 打印</strong>分子模型</li>
  </ul>
  <p>
    借助本应用，从分子数据到可打印模型的准备时间可缩短至<strong>几分钟</strong>——
    比<em>手动处理</em>高效得多。
  </p>

  <PrusaSlicerPluginNote />

  <h2>技术基础</h2>
  <ul class="tech-list">
    <li>编程语言：<span class="highlight">TypeScript</span></li>
    <li>图形界面：<em>SvelteKit</em>、<em>Bootstrap</em></li>
    <li>数据集成：连接公共数据库（<em>PubChem</em>、<em>COD</em>）</li>
    <li>表示方式：<em>范德华</em>模型（空间填充，<em>Spheres</em>）、<em>Ball-and-Stick</em>（球棍模型）、<em>Stick</em>（棒状模型）</li>
    <li>优化：细节控制、添加氢原子、模型精修等……</li>
    <li>导出：可直接用于切片软件的打印格式</li>
  </ul>

  <p style="margin-top: 2rem; text-align: center;">
    我们的目标是让尽可能多的人——无论是<em>学生、研究人员还是教师</em>——都能使用<strong>分子 3D 打印</strong>。
  </p>
</section>

<script lang="ts">
    import vscht from '$lib/images/logoVSCHT.svg';
    import lf1 from '$lib/images/logo1LF.svg';
</script>

<style>
  section.about {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    line-height: 1.6;
    color: #333;
  }
  .about h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  .about h3 {
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
</style>

<section class="about">
  <h2>About the Project</h2>

  <h3>Who We Are</h3>
  <p>
    The project is the result of a <strong>collaboration between academic institutions and students</strong>.
    This partnership of experts in <em>medicine</em>, <em>biochemistry</em>, <em>computer science</em>, and
    <em>education</em> ensures that the tool is both <strong>methodologically and technically balanced</strong>.
  </p>
  <p>
    The project is a joint effort of:
    <br>
    • <strong>Department of Chemistry Education and Humanities, University of Chemistry and Technology, Prague (UCT Prague)</strong>
    <br>
    • <strong>First Faculty of Medicine, Charles University</strong>
  </p>

  <div class="logos-container">
    <a href="https://kuhv.vscht.cz" target="_blank" rel="noopener noreferrer" title="Department of Chemistry Education and Humanities, UCT Prague">
      <img src={vscht} alt="Logo of the Department of Chemistry Education and Humanities, UCT Prague" class="logo" style="color:red;">
    </a>
    <a href="https://www.lf1.cuni.cz" target="_blank" rel="noopener noreferrer" title="First Faculty of Medicine, Charles University">
      <img src={lf1} alt="Logo of the First Faculty of Medicine, Charles University" class="logo" style="color:blue;">
    </a>
  </div>

  <h3>Why It Was Created</h3>
  <p>
    We believe that to truly <strong>understand molecular shape</strong>, <strong>spatial interactions</strong>,
    and <strong>the properties of bioorganic molecules</strong>, it is essential to work with
    <em>intuitively understandable 3D models</em>. Digital visualization is useful but often limited —
    it requires specialized software and is not ideal for <em>teaching</em> or <em>physical demonstration</em>.
    Building molecular models using kits is <strong>time-consuming and technically demanding</strong>,
    and preparing printable models can be complicated. That’s why our project was created —
    to make <strong>3D printing of molecules</strong> more <em>accessible, faster, and user-friendly</em>.
  </p>

  <h3>What It Can Do</h3>
  <p>
    Our application allows you to:
  </p>
  <ul class="tech-list">
    <li><strong>Automatically import</strong> molecular data from services like <em>PubChem</em></li>
    <li><strong>Upload your own files</strong> (<code>.sdf</code>)</li>
    <li><strong>Generate 3D models</strong> in various representations</li>
    <li><strong>Color-code atoms</strong> and choose the <em>model quality</em></li>
    <li><strong>Optimize models for printing</strong> and export them for slicers (e.g. <em>PrusaSlicer</em>)</li>
    <li><strong>Support multi-color 3D printing</strong> of molecular models</li>
  </ul>
  <p>
    Thanks to the application, the preparation time for printable models can be reduced from
    molecular data to just <strong>a few minutes</strong> — much more efficiently than through
    <em>manual processing</em>.
  </p>

  <h3>Technical Foundations</h3>
  <ul class="tech-list">
    <li>Language: <span class="highlight">TypeScript</span></li>
    <li>GUI: <em>SvelteKit</em>, <em>Bootstrap</em></li>
    <li>Data integration: connection with public databases (<em>PubChem</em>, <em>COD</em>)</li>
    <li>Representations: <em>van der Waals</em> (space-filling, <em>Spheres</em>), <em>Ball-and-Stick</em>, <em>Stick</em></li>
    <li>Optimization: control of detail, hydrogen addition, model refinement, and more...</li>
    <li>Export outputs: print-ready formats for slicers</li>
  </ul>

  <p style="margin-top: 2rem; text-align: center;">
    Our goal is to make <strong>3D molecular printing</strong> accessible to as many people as possible —
    <em>students, researchers, and educators</em> alike.
  </p>
</section>
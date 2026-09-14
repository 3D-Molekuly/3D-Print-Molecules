<script lang="ts">
    // --- MAIN STEP IMAGES ---
    import step1Img from '$lib/images/step1.png';
    import step2Img from '$lib/images/step2.png';
    import step3Img from '$lib/images/step3.png';
    import step4Img from '$lib/images/step4.png';
    import step5Img from '$lib/images/step5.png'; 

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
            name: "Default Mesh Quality (Quality: 50)", 
            img: sphereQ50Img, 
            desc: "Standard setting for a nice and smooth spherical model." 
        },
        { 
            name: "Low Quality (Quality: 5)", 
            img: sphereQ5Img, 
            desc: "Significantly reduces the polygon count. Suitable for a specific 'low-poly' look or faster rendering of huge molecules." 
        },
        { 
            name: "Hide Hydrogens", 
            img: sphereHoffImg, 
            desc: "Turns off the display of hydrogen atoms, which can greatly simplify complex organic molecules." 
        },
        { 
            name: "Default Ball-and-Stick", 
            img: waterBasImg, 
            desc: "Basic representation of a water molecule in ball-and-stick mode." 
        },
        { 
            name: "Show Multiple Bonds", 
            img: co2MultImg, 
            desc: "For carbon dioxide (CO2), visualizes double bonds between carbon and oxygen (compared to the default single bond)." 
        },
        { 
            name: "Uniform Atom Diameter", 
            img: waterUniformImg, 
            desc: "Unifies the size of all atoms in the model regardless of their actual van der Waals radius." 
        },
        { 
            name: "Group Bonds Separately", 
            img: waterGroupImg, 
            desc: "During export, separates bonds into individual parts, making coloring and preparation for multicolor 3D printing easier." 
        },
        { 
            name: "Larger Scale (Multiplication Factor: 1.5)", 
            img: waterMultImg, 
            desc: "Increases the overall volume and element diameters of the model for a more massive physical result." 
        },
        { 
            name: "Bond Thickness (Bond Diameter: 0.6)", 
            img: waterBondDiaImg, 
            desc: "Thickens the connecting sticks between atoms to make the printed model mechanically stronger." 
        }
    ];

    // Default selected option in the gallery
    let activeOption = settingsOptions[0];
</script>

<style>
  section {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    line-height: 1.6;
    /* color: #333; Removed to support dark mode for text outside of boxes */
  }
  .tutorial h2 {
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
    margin-bottom: 3rem;
    background: #f9f9f9;
    color: #333; /* Forcing dark text for light box background in dark mode */
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .step-container h3 {
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
  .gallery-preview h4 {
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

  /* --- STYLES FOR PRINTABLES SECTION --- */
  .printables-container {
    background: #fff8f5;
    border: 1px solid #ffd8c7;
    color: #333;
    text-align: center;
  }
  .printables-container h3 {
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
  }
  .printables-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #fa6831;
    color: #ffffff !important;
    font-size: 1.2rem;
    font-weight: 700;
    padding: 0.75rem 1.75rem;
    border-radius: 8px;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(250, 104, 49, 0.25);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  .printables-btn:hover {
    background-color: #e0531c;
    color: #ffffff !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(250, 104, 49, 0.35);
  }
  .printables-logo {
    display: inline-block;
    flex-shrink: 0;
  }
  .printables-btn .external-arrow {
    font-size: 1.1rem;
    line-height: 1;
    transition: transform 0.2s ease;
  }
  .printables-btn:hover .external-arrow {
    transform: translate(2px, -2px);
  }
</style>

<section class="tutorial">
  <h2>How to Use 3D Printing Molecules</h2>
  <p style="text-align: center; margin-bottom: 1.5rem;">
    Preparing a molecule model for 3D printing has never been easier. The entire process can be summarized in three quick steps:
  </p>

  <!-- FLOW SCHEMA -->
  <div class="flow-schema">
    <div class="flow-step-badge">Enter name</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Generate model</div>
    <div class="flow-arrow">➔</div>
    <div class="flow-step-badge">Download</div>
  </div>

  <!-- Step 1 -->
  <div class="step-container">
    <h3>Step 1: Select a Molecule</h3>
    <p>First, tell the program which substance you want to model. You can use automatic import or upload your own data.</p>
    <img src={step1Img} alt="UI screenshot showing search" class="tutorial-img">
    <p class="image-caption">Fig. 1: PubChem search interface</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>Search:</strong> Enter the English name of the substance into the "Search on PubChem" field and press Enter. Data will automatically download from the public database.</div></li>
      <li><span class="legend-number">2</span><div><strong>Custom Data:</strong> If you have your own <code>.sdf</code> file, use the <em>Upload File</em> button followed by <em>Fetch Data</em>.</div></li>
    </ul>
  </div>

  <!-- Step 2 -->
  <div class="step-container">
    <h3>Step 2: Display Interface</h3>
    <p>After loading the data, the model settings will become available. The first step is selecting the molecule representation.</p>
    <img src={step2Img} alt="UI screenshot with expanded menu" class="tutorial-img">
    <p class="image-caption">Fig. 2: UI showing the representation dropdown menu</p>
  </div>

  <!-- Step 3 -->
  <div class="step-container">
    <h3>Step 3: Choose Representation Type</h3>
    <p>Choose the look that best suits your needs for education or 3D printing.</p>
    <img src={step3Img} alt="Molecule representation selection" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">Fig. 3: Dropdown menu options</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>Select Model Type:</strong> Select the desired look (Spheres, Ball-and-Stick, Sticks, or our secret <span class="easter-egg">Minecraft</span> mode).</div></li>
    </ul>
  </div>

  <!-- Step 4 and Interactive Gallery -->
  <div class="step-container">
    <h3>Step 4: Parameter Settings and Export</h3>
    <p>Adjust the details and proportions of the model for optimal printing. Hover over the individual options below to see how the parameters visually change the result.</p>
    
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
        <img src={activeOption.img} alt={activeOption.name} />
        <h4>{activeOption.name}</h4>
        <p>{activeOption.desc}</p>
      </div>
    </div>
    <!-- END OF GALLERY -->

    <img src={step4Img} alt="Ball-and-stick parameters example" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">Fig. 4: Model parameters and export options</p>
    
    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>Model Settings:</strong> Here you can adjust the quality, model size, bond diameter, or display of hydrogens.</div></li>
      <li><span class="legend-number">5</span><div><strong>Export Options:</strong> The <em>Download Template</em> button downloads the raw <code>.sdf</code> data of the molecule. The blue <em>One STL File</em> button exports a merged single-color model.</div></li>
      <li><span class="legend-number">6</span><div><strong>Final Multicolor Export:</strong> Using the green <em>Download Model</em> button, you will download a <code>.zip</code> archive with models separated by atoms for easier color assignment in the slicer.</div></li>
    </ul>
  </div>

  <!-- Step 5 -->
  <div class="step-container">
    <h3>Step 5: Apply Changes (Reload)</h3>
    <p>The image shows a more complex model (ATP). Remember that after any adjustment in the <em>Model Settings</em> section, the preview does not update automatically.</p>
    <img src={step5Img} alt="Updating the model using the Reload button" class="tutorial-img">
    <p class="image-caption">Fig. 5: ATP model and the yellow Reload button</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>Reload Button:</strong> Whenever you adjust the settings, always click this yellow button first. This applies the changes to the 3D preview.</div></li>
    </ul>
  </div>

  <!-- SLICER IMPORT INFO -->
  <div class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;">
    <h3>How to import to slicer?</h3>
    <p style="font-size: 1.1rem; text-align: center;">
      For <strong>multicolor</strong> molecule printing, ensure the slicer shows the message <br>
      <em>‘Multi-part object detected / An object with multiple parts was detected,’</em> <br>
      then confirm by selecting <strong>‘YES.’</strong>
    </p>
    <img src="/assets/multipartobject.svg" alt="Slicer import dialog" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
  </div>

  <!-- PRINTABLES SECTION -->
  <div class="step-container printables-container">
    <h3>Try Ready-to-Print Models on Printables</h3>
    <p class="printables-desc">
      Looking for inspiration or want to print popular molecules directly without tweaking settings? Explore our collection of verified, ready-to-print 3D molecule models directly on Printables.
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
    </div>
  </div>
</section>
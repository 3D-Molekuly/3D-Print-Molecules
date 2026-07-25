<script lang="ts">
    // --- HLAVNÍ OBRÁZKY KROKŮ ---
    import step1Img from '$lib/images/step1.png';
    import step2Img from '$lib/images/step2.png';
    import step3Img from '$lib/images/step3.png';
    import step4Img from '$lib/images/step4.png';
    import step5Img from '$lib/images/step5.png'; 

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
</script>

<style>
  section {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    line-height: 1.6;
    /* color: #333; odstraněno pro podporu tmavého režimu u textů mimo boxy */
  }
  .tutorial h2 {
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
    margin-bottom: 3rem;
    background: #f9f9f9;
    color: #333; /* Vynucení tmavého textu pro světlé pozadí boxu v tmavém režimu */
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
</style>

<section class="tutorial">
  <h2>Jak používat 3D Printing Molecules</h2>
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
  <div class="step-container">
    <h3>Krok 1: Výběr molekuly</h3>
    <p>Nejprve programu řekni, jakou látku chceš modelovat. Můžeš využít automatický import nebo nahrát vlastní data.</p>
    <img src={step1Img} alt="UI ukázka screenshot" class="tutorial-img">
    <p class="image-caption">Obr. 1: Zobrazení vyhledávání z PubChemu</p>
    <ul class="legend-list">
      <li><span class="legend-number">1</span><div><strong>Vyhledávání:</strong> Zadej anglický název látky do pole "Search on PubChem" a stiskni Enter. Data se automaticky stáhnou z veřejné databáze.</div></li>
      <li><span class="legend-number">2</span><div><strong>Vlastní data:</strong> Pokud máš vlastní <code>.sdf</code> soubor, použij tlačítko <em>Upload File</em> a následně <em>Fetch Data</em>.</div></li>
    </ul>
  </div>

  <!-- Krok 2 -->
  <div class="step-container">
    <h3>Krok 2: Rozhraní pro zobrazení</h3>
    <p>Po načtení dat se ti zpřístupní nastavení modelu. Prvním krokem je výběr reprezentace molekuly.</p>
    <img src={step2Img} alt="UI ukázka screenshot s rozbaleným menu" class="tutorial-img">
    <p class="image-caption">Obr. 2: UI ukázka s rozbaleným menu pro reprezentaci</p>
  </div>

  <!-- Krok 3 -->
  <div class="step-container">
    <h3>Krok 3: Volba typu zobrazení</h3>
    <p>Vyber si vzhled, který nejlépe vyhovuje tvým potřebám pro výuku nebo 3D tisk.</p>
    <img src={step3Img} alt="Výběr reprezentací molekuly" class="tutorial-img" style="max-width: 400px; display: block; margin: 1rem auto;">
    <p class="image-caption">Obr. 3: Nabídka rozbalovacího menu</p>
    <ul class="legend-list">
      <li><span class="legend-number">3</span><div><strong>Select Model Type:</strong> Zvol požadovaný vzhled (Spheres, Ball-and-Stick, Sticks, nebo náš tajný <span class="easter-egg">Minecraft</span> režim).</div></li>
    </ul>
  </div>

  <!-- Krok 4 a Interaktivní galerie -->
  <div class="step-container">
    <h3>Krok 4: Nastavení parametrů a export</h3>
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
        <img src={activeOption.img} alt={activeOption.name} />
        <h4>{activeOption.name}</h4>
        <p>{activeOption.desc}</p>
      </div>
    </div>
    <!-- KONEC GALERIE -->

    <img src={step4Img} alt="Ukázka parametrů u ball and stick" class="tutorial-img" style="margin-top: 2rem;">
    <p class="image-caption">Obr. 4: Parametry modelu a možnosti exportu</p>
    
    <ul class="legend-list">
      <li><span class="legend-number">4</span><div><strong>Model Settings:</strong> Zde můžeš upravit kvalitu, velikost modelu, průměr vazeb nebo zobrazení vodíků.</div></li>
      <li><span class="legend-number">5</span><div><strong>Možnosti exportu:</strong> Tlačítko <em>Download Template</em> stáhne čistá <code>.sdf</code> data molekuly. Modré tlačítko <em>One STL File</em> exportuje sloučený jednobarevný model.</div></li>
      <li><span class="legend-number">6</span><div><strong>Finální vícebarevný export:</strong> Zeleným tlačítkem <em>Download Model</em> stáhneš <code>.zip</code> archiv s modely oddělenými po atomech pro snazší přiřazení barev ve sliceru.</div></li>
    </ul>
  </div>

  <!-- Krok 5 -->
  <div class="step-container">
    <h3>Krok 5: Aplikace změn (Reload)</h3>
    <p>Na obrázku vidíš složitější model (ATP). Pamatuj, že po jakékoliv úpravě v sekci <em>Model Settings</em> se náhled neaktualizuje sám.</p>
    <img src={step5Img} alt="Ukázka aktualizace modelu pomocí tlačítka Reload" class="tutorial-img">
    <p class="image-caption">Obr. 5: Ukázka modelu ATP a žlutého tlačítka Reload</p>
    <ul class="legend-list">
      <li><span class="legend-number">7</span><div><strong>Tlačítko Reload:</strong> Kdykoliv upravíš nastavení, vždy nejprve klikni na toto žluté tlačítko. Tím aplikuješ změny do 3D náhledu.</div></li>
    </ul>
  </div>

  <!-- INFORMACE K IMPORTU DO SLICERU -->
  <div class="step-container" style="background: #eef5ff; border: 1px solid #cce0ff; color: #333;">
    <h3>Jak importovat do sliceru?</h3>
    <p style="font-size: 1.1rem; text-align: center;">
      Pro <strong>vícebarevný</strong> tisk molekuly se ujisti, že tě slicer upozorní hláškou <br>
      <em>„Byl detekován objekt o více částech“ (Multi-part object detected)</em>, <br>
      a následně potvrď volbou <strong>„ANO“ (YES)</strong>.
    </p>
    <img src="/assets/multipartobject.svg" alt="Dialog importu do sliceru" class="tutorial-img" style="max-width: 500px; display: block; margin: 1.5rem auto 0 auto; border: none;">
  </div>
</section>
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
  <h1>Acerca del proyecto</h1>

  <h2>Quiénes somos</h2>
  <p>
    El proyecto es fruto de una <strong>colaboración entre instituciones académicas y estudiantes</strong>.
    Esta alianza de especialistas en <em>medicina</em>, <em>bioquímica</em>, <em>informática</em> y
    <em>educación</em> garantiza que la herramienta esté <strong>equilibrada tanto metodológica como técnicamente</strong>.
  </p>
  <p>
    El proyecto es un esfuerzo conjunto de:
    <br>
    • <strong>Departamento de Didáctica de la Química y Humanidades, Universidad de Química y Tecnología de Praga (UCT Praga)</strong>
    <br>
    • <strong>Primera Facultad de Medicina, Universidad Carolina</strong>
  </p>

  <div class="logos-container">
    <a href="https://kuhv.vscht.cz" target="_blank" rel="noopener noreferrer" title="Departamento de Didáctica de la Química y Humanidades, UCT Praga">
      <img src={vscht} alt="Logotipo del Departamento de Didáctica de la Química y Humanidades, UCT Praga" height="75" class="logo logo-vscht">
    </a>
    <a href="https://www.lf1.cuni.cz" target="_blank" rel="noopener noreferrer" title="Primera Facultad de Medicina, Universidad Carolina">
      <img src={lf1} alt="Logotipo de la Primera Facultad de Medicina, Universidad Carolina" height="75" class="logo logo-light">
      <img src={lf1Dark} alt="Logotipo de la Primera Facultad de Medicina, Universidad Carolina" height="75" class="logo logo-dark">
    </a>
  </div>

  <h2>Por qué nació</h2>
  <p>
    Creemos que, para <strong>comprender de verdad la forma de las moléculas</strong>, las <strong>interacciones espaciales</strong>
    y <strong>las propiedades de las moléculas bioorgánicas</strong>, es fundamental trabajar con
    <em>modelos 3D intuitivos y fáciles de entender</em>. La visualización digital es útil, pero a menudo limitada:
    requiere software especializado y no es ideal para la <em>enseñanza</em> ni para la <em>demostración física</em>.
    Construir modelos moleculares con kits <strong>lleva mucho tiempo y es técnicamente exigente</strong>,
    y preparar modelos imprimibles puede resultar complicado. Por eso nació nuestro proyecto:
    para que la <strong>impresión 3D de moléculas</strong> sea más <em>accesible, rápida y sencilla</em>.
  </p>

  <h2>Historia y desarrollo</h2>
  <p>
    El primer prototipo de la aplicación se creó en 2023 como un script de terminal para el programa <em>PyMOL</em> y, tras varias iteraciones en <em>Python</em>, evolucionó gradualmente hasta convertirse en una aplicación web. El proyecto incluso fue reconocido en la Primera Facultad de Medicina de la Universidad Carolina, donde recibió un premio en la <a href="https://www.lf1.cuni.cz/25-rocnik-svk-a-vpz-uz-znaji-sve-viteze" target="_blank" rel="noopener noreferrer">25.ª Conferencia Científica Estudiantil (SVK)</a>.
  </p>

  <h2>Qué puede hacer</h2>
  <p>
    Nuestra aplicación te permite:
  </p>
  <ul class="tech-list">
    <li><strong>Importar automáticamente</strong> datos moleculares de servicios como <em>PubChem</em></li>
    <li><strong>Subir tus propios archivos</strong> (<code>.sdf</code>)</li>
    <li><strong>Generar modelos 3D</strong> en distintas representaciones</li>
    <li><strong>Colorear los átomos</strong> y elegir la <em>calidad del modelo</em></li>
    <li><strong>Optimizar los modelos para la impresión</strong> y exportarlos para laminadores (p. ej., <em>PrusaSlicer</em>)</li>
    <li><strong>Imprimir en 3D en varios colores</strong> modelos moleculares</li>
  </ul>
  <p>
    Gracias a la aplicación, el tiempo necesario para pasar de los datos moleculares a un modelo imprimible
    se reduce a solo <strong>unos minutos</strong>, mucho más eficiente que el
    <em>procesamiento manual</em>.
  </p>

  <PrusaSlicerPluginNote />

  <h2>Bases técnicas</h2>
  <ul class="tech-list">
    <li>Lenguaje: <span class="highlight">TypeScript</span></li>
    <li>GUI: <em>SvelteKit</em>, <em>Bootstrap</em></li>
    <li>Integración de datos: conexión con bases de datos públicas (<em>PubChem</em>, <em>COD</em>)</li>
    <li>Representaciones: <em>van der Waals</em> (modelo compacto, <em>Spheres</em>), <em>Ball-and-Stick</em>, <em>Stick</em></li>
    <li>Optimización: control del nivel de detalle, adición de hidrógenos, refinado del modelo y mucho más...</li>
    <li>Exportación: formatos listos para imprimir para laminadores</li>
  </ul>

  <p style="margin-top: 2rem; text-align: center;">
    Nuestro objetivo es que la <strong>impresión 3D de moléculas</strong> llegue al mayor número de personas posible:
    <em>estudiantes, investigadores y docentes</em> por igual.
  </p>
</section>

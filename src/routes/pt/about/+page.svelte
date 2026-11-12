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
  <h1>Sobre o projeto</h1>

  <h2>Quem somos</h2>
  <p>
    O projeto é o resultado de uma <strong>colaboração entre instituições académicas e estudantes</strong>.
    Esta parceria de especialistas em <em>medicina</em>, <em>bioquímica</em>, <em>informática</em> e
    <em>educação</em> garante que a ferramenta é <strong>equilibrada tanto do ponto de vista metodológico como técnico</strong>.
  </p>
  <p>
    O projeto é um esforço conjunto de:
    <br>
    • <strong>Departamento de Ensino da Química e Humanidades, Universidade de Química e Tecnologia de Praga (UCT Praga)</strong>
    <br>
    • <strong>Primeira Faculdade de Medicina, Universidade Carolina</strong>
  </p>

  <div class="logos-container">
    <a href="https://kuhv.vscht.cz" target="_blank" rel="noopener noreferrer" title="Departamento de Ensino da Química e Humanidades, UCT Praga">
      <img src={vscht} alt="Logótipo do Departamento de Ensino da Química e Humanidades, UCT Praga" height="75" class="logo logo-vscht">
    </a>
    <a href="https://www.lf1.cuni.cz" target="_blank" rel="noopener noreferrer" title="Primeira Faculdade de Medicina, Universidade Carolina">
      <img src={lf1} alt="Logótipo da Primeira Faculdade de Medicina, Universidade Carolina" height="75" class="logo logo-light">
      <img src={lf1Dark} alt="Logótipo da Primeira Faculdade de Medicina, Universidade Carolina" height="75" class="logo logo-dark">
    </a>
  </div>

  <h2>Porque foi criado</h2>
  <p>
    Acreditamos que, para <strong>compreender verdadeiramente a forma das moléculas</strong>, as <strong>interações espaciais</strong>
    e <strong>as propriedades das moléculas bio-orgânicas</strong>, é essencial trabalhar com
    <em>modelos 3D intuitivamente compreensíveis</em>. A visualização digital é útil, mas muitas vezes limitada —
    exige software especializado e não é ideal para o <em>ensino</em> ou para a <em>demonstração física</em>.
    Montar modelos moleculares com kits é <strong>moroso e tecnicamente exigente</strong>,
    e preparar modelos imprimíveis pode ser complicado. Foi por isso que o nosso projeto nasceu —
    para tornar a <strong>impressão 3D de moléculas</strong> mais <em>acessível, rápida e fácil de usar</em>.
  </p>

  <h2>História e desenvolvimento</h2>
  <p>
    O primeiro protótipo da aplicação foi criado em 2023 como um script de terminal para a aplicação <em>PyMOL</em> e, ao longo de várias iterações em <em>Python</em>, evoluiu gradualmente para o conceito de uma aplicação web. O projeto chegou mesmo a ser reconhecido na Primeira Faculdade de Medicina da Universidade Carolina, tendo recebido um prémio na <a href="https://www.lf1.cuni.cz/25-rocnik-svk-a-vpz-uz-znaji-sve-viteze" target="_blank" rel="noopener noreferrer">25.ª Conferência Científica Estudantil (SVK)</a>.
  </p>

  <h2>O que faz</h2>
  <p>
    A nossa aplicação permite:
  </p>
  <ul class="tech-list">
    <li><strong>Importar automaticamente</strong> dados moleculares de serviços como o <em>PubChem</em></li>
    <li><strong>Carregar os seus próprios ficheiros</strong> (<code>.sdf</code>)</li>
    <li><strong>Gerar modelos 3D</strong> em várias representações</li>
    <li><strong>Colorir os átomos</strong> e escolher a <em>qualidade do modelo</em></li>
    <li><strong>Otimizar os modelos para impressão</strong> e exportá-los para slicers (p. ex., <em>PrusaSlicer</em>)</li>
    <li><strong>Suportar a impressão 3D multicolor</strong> de modelos moleculares</li>
  </ul>
  <p>
    Graças à aplicação, o tempo de preparação de modelos imprimíveis a partir de dados moleculares
    pode ser reduzido a apenas <strong>alguns minutos</strong> — de forma muito mais eficiente do que com
    <em>processamento manual</em>.
  </p>

  <PrusaSlicerPluginNote />

  <h2>Fundamentos técnicos</h2>
  <ul class="tech-list">
    <li>Linguagem: <span class="highlight">TypeScript</span></li>
    <li>Interface gráfica: <em>SvelteKit</em>, <em>Bootstrap</em></li>
    <li>Integração de dados: ligação a bases de dados públicas (<em>PubChem</em>, <em>COD</em>)</li>
    <li>Representações: <em>van der Waals</em> (preenchimento espacial, <em>Spheres</em>), <em>Ball-and-Stick</em>, <em>Stick</em></li>
    <li>Otimização: controlo do detalhe, adição de hidrogénios, refinamento do modelo e muito mais...</li>
    <li>Resultados da exportação: formatos prontos a imprimir para slicers</li>
  </ul>

  <p style="margin-top: 2rem; text-align: center;">
    O nosso objetivo é tornar a <strong>impressão 3D de moléculas</strong> acessível ao maior número possível de pessoas —
    <em>estudantes, investigadores e professores</em>.
  </p>
</section>

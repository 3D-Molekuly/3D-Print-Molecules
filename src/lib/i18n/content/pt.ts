import type { LocaleContent } from './types';

const siteName = 'Impressão 3D de Moléculas';

export const pt: LocaleContent = {
	seo: {
		siteName,
		alternateName: '3D Printing Molecules',
		author: 'UCT Praga, Primeira Faculdade de Medicina – Universidade Carolina',
		ogImageAlt:
			'Interface da aplicação web Impressão 3D de Moléculas para gerar modelos moleculares 3MF e STL',
		orgUct: 'Universidade de Química e Tecnologia de Praga (UCT Praga)',
		orgLf1: 'Primeira Faculdade de Medicina, Universidade Carolina',
		home: {
			title: 'Impressão 3D de Moléculas – Gerador gratuito de PubChem, PDB e CIF para 3MF/STL',
			description:
				'Aplicação web gratuita da UCT Praga e da Universidade Carolina para visualizar e converter moléculas do PubChem, PDB, COD, SDF e CIF em modelos multicolores 3MF e STL prontos para impressão 3D.',
			keywords:
				'impressão 3D de moléculas, imprimir moléculas em 3D, modelos moleculares 3D, PubChem para STL, PDB para 3MF, CIF para STL, modelo molecular multicolor, modelos para ensino de química, PrusaSlicer, Bambu Studio',
			sharedOgTitle: (molecule) => `${molecule} – Modelo molecular para impressão 3D | ${siteName}`,
			featureList: [
				'Importação de estruturas moleculares do PubChem, RCSB PDB e Crystallography Open Database (COD)',
				'Carregamento de ficheiros próprios .sdf, .pdb e .cif',
				'Exportação em .3MF multicolor e .STL multipeça',
				'Modos Spheres, Split for Gluing, Ball-and-Stick, Moving Joints (articulações impressas no lugar), Sticks e Minecraft',
				'Abertura direta com um clique no PrusaSlicer, Bambu Studio, OrcaSlicer e Ultimaker Cura'
			]
		},
		tutorials: {
			title: `Tutorial: como preparar e imprimir modelos de moléculas em 3D | ${siteName}`,
			description:
				'Guia passo a passo para importar moléculas do PubChem, PDB, COD ou de ficheiros SDF/CIF, personalizar representações 3D e exportar modelos 3MF/STL multicolores para o seu slicer.',
			keywords:
				'como imprimir moléculas em 3D, tutorial de modelos moleculares, guia 3MF multicolor slicer, objeto multipeça PrusaSlicer, imprimir moléculas no Bambu Studio',
			howToName: 'Como preparar um modelo molecular para impressão 3D',
			steps: [
				{
					name: 'Selecione ou carregue uma molécula',
					text: 'Pesquise um composto no PubChem, PDB ou COD, ou carregue o seu próprio ficheiro .sdf, .pdb ou .cif.'
				},
				{
					name: 'Escolha a representação e as definições',
					text: 'Selecione um estilo de modelo (Spheres, Split for Gluing, Ball-and-Stick, Moving Joints, Sticks) e ajuste a escala, a qualidade da malha ou o diâmetro das ligações.'
				},
				{
					name: 'Exporte para 3MF ou STL e fatie',
					text: 'Descarregue o ficheiro .3MF a cores ou um ZIP com as peças STL separadas e importe o modelo no seu slicer 3D como objeto multipeça.'
				}
			],
			breadcrumb: 'Tutorial'
		},
		about: {
			title: `Sobre o projeto – UCT Praga e Universidade Carolina | ${siteName}`,
			description:
				'Colaboração académica entre a UCT Praga e a Universidade Carolina que torna a impressão 3D multicolor de modelos moleculares rápida e acessível para professores, estudantes e investigadores.',
			keywords:
				'UCT Praga, Universidade Carolina, impressão 3D no ensino da química, materiais didáticos moleculares, ferramenta académica de código aberto',
			breadcrumb: 'Sobre'
		},
		examples: {
			title: `Modelos de moléculas impressos em 3D – STL e 3MF grátis | ${siteName}`,
			description:
				'Galeria de modelos moleculares impressos em 3D – adrenalina, ATP, glicose, índigo, calixareno, criptando e cinase TRK. Descarregue ficheiros gratuitos do Printables e do MakerWorld.',
			keywords:
				'moléculas impressas em 3D, descarregar STL de moléculas, modelo molecular 3MF, modelos de moléculas para imprimir, moléculas Printables, moléculas MakerWorld'
		},
		demonstrations: {
			title: `Exemplos | ${siteName}`,
			description: 'Exemplos de modelos moleculares impressos em 3D.',
			keywords: 'impressão 3D de moléculas, exemplos'
		}
	},
	faq: [
		{
			question: 'Que bases de dados moleculares e formatos de ficheiro são suportados?',
			answer:
				'Pode pesquisar moléculas diretamente por nome, CID ou número CAS no PubChem, pelo ID de entrada de 4 caracteres no RCSB PDB ou pelo ID do cristal na Crystallography Open Database (COD). Também pode carregar os seus próprios ficheiros de estrutura .sdf, .pdb e .cif.'
		},
		{
			question: 'Como imprimir modelos moleculares multicolores?',
			answer:
				'Para impressoras 3D multimaterial (AMS, MMU, trocadores de ferramenta), exporte diretamente para .3MF com as cores CPK dos átomos já atribuídas e geometria multipeça. Para impressoras de um só extrusor sem hardware multicolor, escolha o modo Spheres SPLIT FOR GLUING, que gera peças estanques separadas prontas a colar, com pinos de alinhamento opcionais de filamento de 1,75 mm.'
		},
		{
			question: 'Que slicers de impressão 3D são suportados?',
			answer:
				'Os ficheiros .3MF e .STL exportados funcionam sem problemas no PrusaSlicer, Bambu Studio, OrcaSlicer e Ultimaker Cura. Também pode abrir o modelo diretamente no slicer instalado no computador com o botão Fatiar integrado.'
		},
		{
			question: 'A Impressão 3D de Moléculas é gratuita para o ensino e a investigação?',
			answer:
				'Sim, esta aplicação web desenvolvida pela UCT Praga e pela Primeira Faculdade de Medicina da Universidade Carolina é totalmente gratuita e não requer conta – para professores, estudantes, investigadores e makers.'
		}
	],
	gallery: {
		heading: 'Modelos moleculares impressos em 3D',
		intro:
			'Moléculas que preparámos na aplicação e imprimimos. Descarregue gratuitamente os ficheiros 3MF e STL prontos a imprimir no Printables ou no MakerWorld, ou ajuste e gere o modelo você mesmo na nossa aplicação web.',
		channels: 'Coleção completa nos nossos perfis',
		aminoHeading: 'Aminoácidos',
		aminoMeta: (n) => `${n} aminoácidos proteinogénicos · impressão multicolor`,
		aminoIntro:
			'O conjunto completo de aminoácidos proteinogénicos, incluindo a selenocisteína, preparado para impressão multicolor (colorido por elemento).',
		searchLabel: 'Pesquisar modelos',
		searchPlaceholder: 'Pesquisar moléculas… (p. ex., glicina, ATP, Trp)',
		searchClear: 'Limpar pesquisa',
		searchResults: (n) => `${n} ${n === 1 ? 'modelo encontrado' : 'modelos encontrados'}`,
		searchEmpty: 'Nenhum modelo impresso corresponde à sua pesquisa.',
		ctaHeading: 'Falta alguma molécula?',
		ctaText: 'Gere o seu próprio modelo a partir do PubChem, PDB ou COD em segundos.',
		ctaButton: 'Abrir o gerador'
	},
	modelCard: {
		openEditor: 'Editar na aplicação',
		photoAlt: 'Modelo molecular impresso em 3D',
		makerworldPending: 'Em breve no MakerWorld'
	},
	models: {
		adrenaline: {
			name: 'Adrenalina (epinefrina)',
			description: 'Modelo de bolas e varetas da hormona e neurotransmissor da resposta de luta ou fuga.'
		},
		'trk-kinase': {
			name: 'Cinase do recetor TRK e inibidores dirigidos',
			description: 'Modelo de ligação ligando–proteína da cinase TRK com inibidores no centro ativo.'
		},
		atp: {
			name: 'ATP (adenosina trifosfato)',
			description: 'O transportador universal de energia da célula – um nucleótido com três grupos fosfato.'
		},
		glucose: {
			name: 'Glicose',
			description: 'O açúcar fundamental e principal fonte de energia dos seres vivos.'
		},
		indigo: {
			name: 'Índigo',
			description: 'O histórico corante azul que ainda hoje é usado para tingir a ganga (denim).'
		},
		calixarene: {
			name: 'Calixareno',
			description: 'Um macrociclo em forma de taça – um exemplo clássico de química supramolecular.'
		},
		'cryptand-222': {
			name: '[2.2.2]-Criptando (Cript-222)',
			description: 'Um ligando bicíclico que encapsula firmemente catiões metálicos na sua cavidade.'
		},
		alanine: {
			name: 'Alanina',
			description: 'Ala · C₃H₇NO₂ – cadeia lateral apolar, alifática.'
		},
		arginine: {
			name: 'Arginina',
			description: 'Arg · C₆H₁₄N₄O₂ – cadeia lateral básica, com carga positiva.'
		},
		asparagine: {
			name: 'Asparagina',
			description: 'Asn · C₄H₈N₂O₃ – cadeia lateral amida polar, sem carga.'
		},
		'aspartic-acid': {
			name: 'Ácido aspártico',
			description: 'Asp · C₄H₇NO₄ – cadeia lateral ácida, com carga negativa.'
		},
		cysteine: {
			name: 'Cisteína',
			description: 'Cys · C₃H₇NO₂S – tiol polar que forma pontes dissulfureto.'
		},
		'glutamic-acid': {
			name: 'Ácido glutâmico',
			description: 'Glu · C₅H₉NO₄ – cadeia lateral ácida, com carga negativa.'
		},
		glutamine: {
			name: 'Glutamina',
			description: 'Gln · C₅H₁₀N₂O₃ – cadeia lateral amida polar, sem carga.'
		},
		glycine: {
			name: 'Glicina',
			description: 'Gly · C₂H₅NO₂ – o aminoácido mais simples e o único aquiral.'
		},
		histidine: {
			name: 'Histidina',
			description: 'His · C₆H₉N₃O₂ – anel imidazol básico.'
		},
		isoleucine: {
			name: 'Isoleucina',
			description: 'Ile · C₆H₁₃NO₂ – cadeia lateral apolar, alifática ramificada.'
		},
		leucine: {
			name: 'Leucina',
			description: 'Leu · C₆H₁₃NO₂ – cadeia lateral apolar, alifática ramificada.'
		},
		lysine: {
			name: 'Lisina',
			description: 'Lys · C₆H₁₄N₂O₂ – cadeia lateral básica, com carga positiva.'
		},
		methionine: {
			name: 'Metionina',
			description: 'Met · C₅H₁₁NO₂S – apolar, contém enxofre; inicia a tradução das proteínas.'
		},
		phenylalanine: {
			name: 'Fenilalanina',
			description: 'Phe · C₉H₁₁NO₂ – apolar, anel benzénico aromático.'
		},
		proline: {
			name: 'Prolina',
			description: 'Pro · C₅H₉NO₂ – cadeia lateral cíclica que interrompe a estrutura secundária.'
		},
		selenocysteine: {
			name: 'Selenocisteína',
			description: 'Sec · C₃H₇NO₂Se – o “21.º aminoácido” – selénio em vez de enxofre.'
		},
		serine: {
			name: 'Serina',
			description: 'Ser · C₃H₇NO₃ – cadeia lateral hidroxilada polar.'
		},
		threonine: {
			name: 'Treonina',
			description: 'Thr · C₄H₉NO₃ – cadeia lateral hidroxilada polar.'
		},
		tryptophan: {
			name: 'Triptofano',
			description: 'Trp · C₁₁H₁₂N₂O₂ – anel indol aromático.'
		},
		tyrosine: {
			name: 'Tirosina',
			description: 'Tyr · C₉H₁₁NO₃ – cadeia lateral fenólica aromática.'
		},
		valine: {
			name: 'Valina',
			description: 'Val · C₅H₁₁NO₂ – cadeia lateral apolar, alifática ramificada.'
		}
	}
};

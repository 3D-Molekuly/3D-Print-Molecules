import type { LocaleContent } from './types';

const siteName = 'Impresión 3D de moléculas';

export const es: LocaleContent = {
	seo: {
		siteName,
		alternateName: '3D Printing Molecules',
		author: 'UCT Praga, Primera Facultad de Medicina – Universidad Carolina',
		ogImageAlt:
			'Interfaz de la aplicación web Impresión 3D de moléculas para generar modelos moleculares en 3MF y STL',
		orgUct: 'Universidad de Química y Tecnología de Praga (UCT Praga)',
		orgLf1: 'Primera Facultad de Medicina, Universidad Carolina',
		home: {
			title: 'Impresión 3D de moléculas – Generador gratuito de PubChem, PDB y CIF a 3MF/STL',
			description:
				'Aplicación web gratuita de la UCT Praga y la Universidad Carolina para visualizar y convertir moléculas de PubChem, PDB, COD, SDF y CIF en modelos 3MF y STL multicolor listos para imprimir en 3D.',
			keywords:
				'imprimir moléculas en 3D, impresión 3D de moléculas, modelos moleculares impresos en 3D, PubChem a STL, PDB a 3MF, CIF a STL, modelo molecular multicolor, maquetas moleculares para clase de química, PrusaSlicer, Bambu Studio',
			sharedOgTitle: (molecule) => `${molecule} – Modelo molecular para imprimir en 3D | ${siteName}`,
			featureList: [
				'Importación de estructuras moleculares de PubChem, RCSB PDB y Crystallography Open Database (COD)',
				'Carga de archivos propios .sdf, .pdb y .cif',
				'Exportación a .3MF multicolor y .STL multiparte',
				'Modos Spheres, Split for Gluing, Ball-and-Stick, Moving Joints (articulaciones móviles impresas en una pieza), Sticks y Minecraft',
				'Apertura directa con un clic en PrusaSlicer, Bambu Studio, OrcaSlicer y Ultimaker Cura'
			]
		},
		tutorials: {
			title: 'Tutorial: cómo preparar e imprimir en 3D modelos de moléculas | Impresión 3D de moléculas',
			description:
				'Guía paso a paso para importar moléculas de PubChem, PDB, COD o archivos SDF/CIF, personalizar la representación 3D y exportar modelos 3MF/STL multicolor para tu laminador.',
			keywords:
				'cómo imprimir moléculas en 3D, tutorial de modelos moleculares, guía de 3MF multicolor para laminador, objeto multiparte en PrusaSlicer, imprimir moléculas con Bambu Studio',
			howToName: 'Cómo preparar un modelo molecular para la impresión 3D',
			steps: [
				{
					name: 'Selecciona o sube una molécula',
					text: 'Busca un compuesto en PubChem, PDB o COD, o sube tu propio archivo .sdf, .pdb o .cif.'
				},
				{
					name: 'Elige la representación y los ajustes',
					text: 'Selecciona un estilo de modelo (Spheres, Split for Gluing, Ball-and-Stick, Moving Joints, Sticks) y ajusta la escala, la calidad de la malla o el diámetro de los enlaces.'
				},
				{
					name: 'Exporta a 3MF o STL y lamina',
					text: 'Descarga el archivo .3MF en color o un ZIP con las piezas STL por separado e importa el modelo en tu laminador 3D como objeto multiparte.'
				}
			],
			breadcrumb: 'Tutorial'
		},
		about: {
			title: 'Acerca del proyecto – UCT Praga y Universidad Carolina | Impresión 3D de moléculas',
			description:
				'Colaboración académica entre la UCT Praga y la Universidad Carolina que hace que la impresión 3D multicolor de modelos moleculares sea rápida y accesible para docentes, estudiantes e investigadores.',
			keywords:
				'UCT Praga, Universidad Carolina, impresión 3D en la enseñanza de la química, material didáctico molecular, herramienta académica de código abierto',
			breadcrumb: 'Acerca de'
		},
		examples: {
			title: `Modelos de moléculas impresos en 3D – Descarga gratis STL y 3MF | ${siteName}`,
			description:
				'Galería de modelos moleculares impresos en 3D: adrenalina, ATP, glucosa, índigo, calixareno, criptando y quinasa TRK. Descarga archivos gratuitos de Printables y MakerWorld.',
			keywords:
				'moléculas impresas en 3D, descargar STL de moléculas, modelo molecular 3MF, modelos de moléculas para imprimir, moléculas en Printables, moléculas en MakerWorld'
		},
		demonstrations: {
			title: `Ejemplos | ${siteName}`,
			description: 'Ejemplos de modelos moleculares impresos en 3D.',
			keywords: 'impresión 3D de moléculas, ejemplos'
		}
	},
	faq: [
		{
			question: '¿Qué bases de datos moleculares y formatos de archivo son compatibles?',
			answer:
				'Puedes buscar moléculas directamente por nombre, CID o número CAS en PubChem, por ID de entrada de 4 caracteres en RCSB PDB o por ID de cristal en la Crystallography Open Database (COD). También puedes subir tus propios archivos de estructura .sdf, .pdb y .cif.'
		},
		{
			question: '¿Cómo imprimo modelos moleculares en varios colores?',
			answer:
				'Para impresoras 3D multimaterial (AMS, MMU, cambiadores de herramienta), exporta directamente a .3MF con los colores CPK de los átomos ya asignados y la geometría dividida en partes. Para impresoras de un solo extrusor sin hardware multicolor, elige el modo Spheres SPLIT FOR GLUING, que genera piezas estancas separadas listas para pegar, con espigas de alineación opcionales de filamento de 1,75 mm.'
		},
		{
			question: '¿Qué laminadores de impresión 3D son compatibles?',
			answer:
				'Los archivos .3MF y .STL exportados funcionan sin problemas en PrusaSlicer, Bambu Studio, OrcaSlicer y Ultimaker Cura. También puedes abrir el modelo directamente en tu laminador de escritorio con el botón Laminar integrado.'
		},
		{
			question: '¿Es Impresión 3D de moléculas gratuita para la enseñanza y la investigación?',
			answer:
				'Sí. Esta aplicación web, desarrollada por la UCT Praga y la Primera Facultad de Medicina de la Universidad Carolina, es totalmente gratuita y no requiere cuenta, tanto para docentes como para estudiantes, investigadores y makers.'
		}
	],
	gallery: {
		heading: 'Modelos moleculares impresos en 3D',
		intro:
			'Moléculas que hemos preparado en la aplicación e impreso. Descarga gratis los archivos 3MF y STL listos para imprimir desde Printables o MakerWorld, o ajusta y genera el modelo tú mismo en nuestra aplicación web.',
		channels: 'Colección completa en nuestros perfiles',
		aminoHeading: 'Aminoácidos',
		aminoMeta: (n) => `${n} aminoácidos proteinogénicos · impresión multicolor`,
		aminoIntro:
			'El conjunto completo de aminoácidos proteinogénicos, incluida la selenocisteína, preparado para impresión multicolor (coloreado por elemento).',
		searchLabel: 'Buscar modelos',
		searchPlaceholder: 'Buscar moléculas… (p. ej., glicina, ATP, Trp)',
		searchClear: 'Borrar búsqueda',
		searchResults: (n) =>
			`${n} ${n === 1 ? 'modelo encontrado' : 'modelos encontrados'}`,
		searchEmpty: 'Ningún modelo impreso coincide con tu búsqueda.',
		ctaHeading: '¿Te falta alguna molécula?',
		ctaText: 'Genera tu propio modelo a partir de PubChem, PDB o COD en segundos.',
		ctaButton: 'Abrir el generador'
	},
	modelCard: {
		openEditor: 'Editar en la aplicación',
		photoAlt: 'Modelo molecular impreso en 3D',
		makerworldPending: 'Pronto en MakerWorld'
	},
	models: {
		adrenaline: {
			name: 'Adrenalina (epinefrina)',
			description:
				'Modelo de bolas y varillas de la hormona y neurotransmisor de la respuesta de lucha o huida.'
		},
		'trk-kinase': {
			name: 'Quinasa receptora TRK e inhibidores dirigidos',
			description:
				'Modelo de unión ligando–proteína de la quinasa TRK con inhibidores en el sitio activo.'
		},
		atp: {
			name: 'ATP (adenosín trifosfato)',
			description:
				'El transportador universal de energía de la célula: un nucleótido con tres grupos fosfato.'
		},
		glucose: {
			name: 'Glucosa',
			description: 'El azúcar fundamental y principal fuente de energía de los seres vivos.'
		},
		indigo: {
			name: 'Índigo',
			description: 'El histórico colorante azul que todavía hoy se usa para teñir la tela vaquera.'
		},
		calixarene: {
			name: 'Calixareno',
			description:
				'Un macrociclo en forma de copa: un ejemplo clásico de química supramolecular.'
		},
		'cryptand-222': {
			name: '[2.2.2]-Criptando (Crypt-222)',
			description:
				'Un ligando bicíclico que encapsula fuertemente cationes metálicos en su cavidad.'
		},
		alanine: {
			name: 'Alanina',
			description: 'Ala · C₃H₇NO₂ – cadena lateral alifática y apolar.'
		},
		arginine: {
			name: 'Arginina',
			description: 'Arg · C₆H₁₄N₄O₂ – cadena lateral básica con carga positiva.'
		},
		asparagine: {
			name: 'Asparagina',
			description: 'Asn · C₄H₈N₂O₃ – cadena lateral amídica polar sin carga.'
		},
		'aspartic-acid': {
			name: 'Ácido aspártico',
			description: 'Asp · C₄H₇NO₄ – cadena lateral ácida con carga negativa.'
		},
		cysteine: {
			name: 'Cisteína',
			description: 'Cys · C₃H₇NO₂S – tiol polar que forma puentes disulfuro.'
		},
		'glutamic-acid': {
			name: 'Ácido glutámico',
			description: 'Glu · C₅H₉NO₄ – cadena lateral ácida con carga negativa.'
		},
		glutamine: {
			name: 'Glutamina',
			description: 'Gln · C₅H₁₀N₂O₃ – cadena lateral amídica polar sin carga.'
		},
		glycine: {
			name: 'Glicina',
			description: 'Gly · C₂H₅NO₂ – el aminoácido más sencillo y el único aquiral.'
		},
		histidine: {
			name: 'Histidina',
			description: 'His · C₆H₉N₃O₂ – anillo de imidazol básico.'
		},
		isoleucine: {
			name: 'Isoleucina',
			description: 'Ile · C₆H₁₃NO₂ – cadena lateral alifática ramificada y apolar.'
		},
		leucine: {
			name: 'Leucina',
			description: 'Leu · C₆H₁₃NO₂ – cadena lateral alifática ramificada y apolar.'
		},
		lysine: {
			name: 'Lisina',
			description: 'Lys · C₆H₁₄N₂O₂ – cadena lateral básica con carga positiva.'
		},
		methionine: {
			name: 'Metionina',
			description:
				'Met · C₅H₁₁NO₂S – apolar y azufrada; inicia la traducción de las proteínas.'
		},
		phenylalanine: {
			name: 'Fenilalanina',
			description: 'Phe · C₉H₁₁NO₂ – apolar, con anillo aromático de benceno.'
		},
		proline: {
			name: 'Prolina',
			description: 'Pro · C₅H₉NO₂ – cadena lateral cíclica que rompe la estructura secundaria.'
		},
		selenocysteine: {
			name: 'Selenocisteína',
			description: 'Sec · C₃H₇NO₂Se – el «aminoácido 21»: selenio en lugar de azufre.'
		},
		serine: {
			name: 'Serina',
			description: 'Ser · C₃H₇NO₃ – cadena lateral hidroxílica polar.'
		},
		threonine: {
			name: 'Treonina',
			description: 'Thr · C₄H₉NO₃ – cadena lateral hidroxílica polar.'
		},
		tryptophan: {
			name: 'Triptófano',
			description: 'Trp · C₁₁H₁₂N₂O₂ – anillo aromático de indol.'
		},
		tyrosine: {
			name: 'Tirosina',
			description: 'Tyr · C₉H₁₁NO₃ – cadena lateral aromática de tipo fenol.'
		},
		valine: {
			name: 'Valina',
			description: 'Val · C₅H₁₁NO₂ – cadena lateral alifática ramificada y apolar.'
		}
	}
};

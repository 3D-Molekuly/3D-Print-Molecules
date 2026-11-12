import type { LocaleContent } from './types';

const siteName = 'Impression 3D de molécules';

export const fr: LocaleContent = {
	seo: {
		siteName,
		alternateName: '3D Printing Molecules',
		author: 'UCT Prague, Première faculté de médecine – Université Charles',
		ogImageAlt:
			"Interface de l’application web Impression 3D de molécules pour générer des modèles moléculaires 3MF et STL",
		orgUct: 'Université de chimie et de technologie de Prague (UCT Prague)',
		orgLf1: 'Première faculté de médecine, Université Charles',
		home: {
			title: 'Impression 3D de molécules – Générateur gratuit PubChem, PDB et CIF vers 3MF/STL',
			description:
				"Application web gratuite de l’UCT Prague et de l’Université Charles pour visualiser et convertir des molécules issues de PubChem, PDB, COD, SDF et CIF en modèles 3MF et STL multicolores imprimables en 3D.",
			keywords:
				'imprimer des molécules en 3D, impression 3D moléculaire, modèle moléculaire 3D, PubChem vers STL, PDB vers 3MF, CIF vers STL, modèle de molécule multicolore, modèles moléculaires pour l’enseignement de la chimie, PrusaSlicer, Bambu Studio',
			sharedOgTitle: (molecule) => `${molecule} – Modèle de molécule imprimable en 3D | ${siteName}`,
			featureList: [
				'Import de structures moléculaires depuis PubChem, RCSB PDB et la Crystallography Open Database (COD)',
				'Import de vos propres fichiers .sdf, .pdb et .cif',
				'Export .3MF multicolore et .STL en plusieurs pièces',
				'Modes Spheres, Split for Gluing, Ball-and-Stick, Moving Joints (articulations imprimées en place), Sticks et Minecraft',
				'Ouverture directe en un clic dans PrusaSlicer, Bambu Studio, OrcaSlicer et Ultimaker Cura'
			]
		},
		tutorials: {
			title: 'Tutoriel : préparer et imprimer en 3D des modèles de molécules | Impression 3D de molécules',
			description:
				'Guide pas à pas pour importer des molécules depuis PubChem, PDB, COD ou des fichiers SDF/CIF, personnaliser la représentation 3D et exporter des modèles 3MF/STL multicolores vers votre trancheur.',
			keywords:
				'comment imprimer une molécule en 3D, tutoriel modèle moléculaire, impression 3D multicolore 3MF, PrusaSlicer objet en plusieurs pièces, imprimer une molécule Bambu Studio',
			howToName: 'Comment préparer un modèle moléculaire pour l’impression 3D',
			steps: [
				{
					name: 'Choisir ou importer une molécule',
					text: 'Recherchez un composé dans PubChem, PDB ou COD, ou importez votre propre fichier .sdf, .pdb ou .cif.'
				},
				{
					name: 'Choisir la représentation et les réglages',
					text: 'Sélectionnez un style de modèle (Spheres, Split for Gluing, Ball-and-Stick, Moving Joints, Sticks) et ajustez l’échelle, la qualité du maillage ou le diamètre des liaisons.'
				},
				{
					name: 'Exporter en 3MF ou STL et trancher',
					text: 'Téléchargez le fichier .3MF en couleur ou une archive ZIP de pièces STL séparées, puis importez le modèle dans votre trancheur comme objet en plusieurs pièces.'
				}
			],
			breadcrumb: 'Tutoriel'
		},
		about: {
			title: 'À propos du projet – UCT Prague et Université Charles | Impression 3D de molécules',
			description:
				"Collaboration académique entre l’UCT Prague et l’Université Charles pour rendre l’impression 3D multicolore de modèles moléculaires rapide et accessible aux enseignants, étudiants et chercheurs.",
			keywords:
				'UCT Prague, Université Charles, impression 3D enseignement de la chimie, supports pédagogiques moléculaires, outil académique open source',
			breadcrumb: 'À propos'
		},
		examples: {
			title: `Modèles de molécules imprimés en 3D – Fichiers STL et 3MF gratuits | ${siteName}`,
			description:
				'Galerie de modèles moléculaires imprimés en 3D – adrénaline, ATP, glucose, indigo, calixarène, cryptand et kinase TRK. Téléchargez gratuitement les fichiers sur Printables et MakerWorld.',
			keywords:
				'molécules imprimées en 3D, télécharger STL molécule, modèle moléculaire 3MF, modèles de molécules à imprimer, molécules Printables, molécules MakerWorld'
		},
		demonstrations: {
			title: `Exemples | ${siteName}`,
			description: 'Exemples de modèles moléculaires imprimés en 3D.',
			keywords: 'impression 3D de molécules, exemples'
		}
	},
	faq: [
		{
			question: 'Quelles bases de données moléculaires et quels formats de fichiers sont pris en charge ?',
			answer:
				'Vous pouvez rechercher des molécules directement par nom, CID ou numéro CAS dans PubChem, par identifiant à 4 caractères dans RCSB PDB, ou par identifiant de cristal dans la Crystallography Open Database (COD). Vous pouvez aussi importer vos propres fichiers de structure .sdf, .pdb et .cif.'
		},
		{
			question: 'Comment imprimer des modèles moléculaires multicolores ?',
			answer:
				'Pour les imprimantes 3D multimatériaux (AMS, MMU, changeurs d’outils), exportez directement en .3MF avec les couleurs CPK des atomes déjà attribuées et une géométrie en plusieurs pièces. Pour les imprimantes à extrudeur unique sans matériel multicolore, choisissez le mode Spheres SPLIT FOR GLUING : il génère des pièces étanches séparées, prêtes à être collées, avec en option des goujons d’alignement en filament de 1,75 mm.'
		},
		{
			question: 'Quels trancheurs d’impression 3D sont pris en charge ?',
			answer:
				'Les fichiers .3MF et .STL exportés fonctionnent sans difficulté dans PrusaSlicer, Bambu Studio, OrcaSlicer et Ultimaker Cura. Vous pouvez aussi ouvrir le modèle directement dans votre trancheur de bureau grâce au bouton « Trancher » intégré.'
		},
		{
			question: 'Impression 3D de molécules est-il gratuit pour l’enseignement et la recherche ?',
			answer:
				'Oui. Cette application web développée par l’UCT Prague et la Première faculté de médecine de l’Université Charles est entièrement gratuite et ne nécessite aucun compte, que vous soyez enseignant, étudiant, chercheur ou maker.'
		}
	],
	gallery: {
		heading: 'Modèles moléculaires imprimés en 3D',
		intro:
			'Des molécules que nous avons préparées dans l’application puis imprimées. Téléchargez gratuitement les fichiers 3MF et STL prêts à imprimer sur Printables ou MakerWorld, ou ajustez et générez vous-même le modèle dans notre application web.',
		channels: 'Collection complète sur nos profils',
		aminoHeading: 'Acides aminés',
		aminoMeta: (n) => `${n} acides aminés protéinogènes · impression multicolore`,
		aminoIntro:
			'L’ensemble complet des acides aminés protéinogènes, sélénocystéine comprise, préparés pour l’impression multicolore (coloration par élément).',
		searchLabel: 'Rechercher des modèles',
		searchPlaceholder: 'Rechercher des molécules… (p. ex. glycine, ATP, Trp)',
		searchClear: 'Effacer la recherche',
		searchResults: (n) => `${n} ${n <= 1 ? 'modèle trouvé' : 'modèles trouvés'}`,
		searchEmpty: 'Aucun modèle imprimé ne correspond à votre recherche.',
		ctaHeading: 'Une molécule manque ?',
		ctaText: 'Générez votre propre modèle à partir de PubChem, PDB ou COD en quelques secondes.',
		ctaButton: 'Ouvrir le générateur'
	},
	modelCard: {
		openEditor: 'Modifier dans l’application',
		photoAlt: 'Modèle moléculaire imprimé en 3D',
		makerworldPending: 'MakerWorld bientôt'
	},
	models: {
		adrenaline: {
			name: 'Adrénaline (épinéphrine)',
			description:
				'Modèle boules et bâtonnets de l’hormone et neurotransmetteur de la réaction de lutte ou de fuite.'
		},
		'trk-kinase': {
			name: 'Kinase réceptrice TRK et inhibiteurs ciblés',
			description:
				'Modèle d’interaction ligand–protéine de la kinase TRK avec des inhibiteurs dans le site actif.'
		},
		atp: {
			name: 'ATP (adénosine triphosphate)',
			description:
				'Le transporteur d’énergie universel de la cellule – un nucléotide portant trois groupes phosphate.'
		},
		glucose: {
			name: 'Glucose',
			description: 'Le sucre fondamental et la principale source d’énergie des organismes vivants.'
		},
		indigo: {
			name: 'Indigo',
			description: 'Le colorant bleu historique, encore utilisé aujourd’hui pour teindre le denim.'
		},
		calixarene: {
			name: 'Calixarène',
			description:
				'Un macrocycle en forme de coupe – un exemple classique de chimie supramoléculaire.'
		},
		'cryptand-222': {
			name: '[2.2.2]-Cryptand (Crypt-222)',
			description:
				'Un ligand bicyclique qui encapsule étroitement des cations métalliques dans sa cavité.'
		},
		alanine: {
			name: 'Alanine',
			description: 'Ala · C₃H₇NO₂ – chaîne latérale aliphatique, apolaire.'
		},
		arginine: {
			name: 'Arginine',
			description: 'Arg · C₆H₁₄N₄O₂ – chaîne latérale basique, chargée positivement.'
		},
		asparagine: {
			name: 'Asparagine',
			description: 'Asn · C₄H₈N₂O₃ – chaîne latérale amide, polaire et non chargée.'
		},
		'aspartic-acid': {
			name: 'Acide aspartique',
			description: 'Asp · C₄H₇NO₄ – chaîne latérale acide, chargée négativement.'
		},
		cysteine: {
			name: 'Cystéine',
			description: 'Cys · C₃H₇NO₂S – thiol polaire qui forme des ponts disulfure.'
		},
		'glutamic-acid': {
			name: 'Acide glutamique',
			description: 'Glu · C₅H₉NO₄ – chaîne latérale acide, chargée négativement.'
		},
		glutamine: {
			name: 'Glutamine',
			description: 'Gln · C₅H₁₀N₂O₃ – chaîne latérale amide, polaire et non chargée.'
		},
		glycine: {
			name: 'Glycine',
			description: 'Gly · C₂H₅NO₂ – l’acide aminé le plus simple et le seul achiral.'
		},
		histidine: {
			name: 'Histidine',
			description: 'His · C₆H₉N₃O₂ – noyau imidazole basique.'
		},
		isoleucine: {
			name: 'Isoleucine',
			description: 'Ile · C₆H₁₃NO₂ – chaîne latérale aliphatique ramifiée, apolaire.'
		},
		leucine: {
			name: 'Leucine',
			description: 'Leu · C₆H₁₃NO₂ – chaîne latérale aliphatique ramifiée, apolaire.'
		},
		lysine: {
			name: 'Lysine',
			description: 'Lys · C₆H₁₄N₂O₂ – chaîne latérale basique, chargée positivement.'
		},
		methionine: {
			name: 'Méthionine',
			description:
				'Met · C₅H₁₁NO₂S – apolaire, soufrée ; initie la traduction des protéines.'
		},
		phenylalanine: {
			name: 'Phénylalanine',
			description: 'Phe · C₉H₁₁NO₂ – apolaire, noyau benzénique aromatique.'
		},
		proline: {
			name: 'Proline',
			description: 'Pro · C₅H₉NO₂ – chaîne latérale cyclique qui rompt la structure secondaire.'
		},
		selenocysteine: {
			name: 'Sélénocystéine',
			description: 'Sec · C₃H₇NO₂Se – le « 21e acide aminé » – du sélénium à la place du soufre.'
		},
		serine: {
			name: 'Sérine',
			description: 'Ser · C₃H₇NO₃ – chaîne latérale hydroxylée polaire.'
		},
		threonine: {
			name: 'Thréonine',
			description: 'Thr · C₄H₉NO₃ – chaîne latérale hydroxylée polaire.'
		},
		tryptophan: {
			name: 'Tryptophane',
			description: 'Trp · C₁₁H₁₂N₂O₂ – noyau indole aromatique.'
		},
		tyrosine: {
			name: 'Tyrosine',
			description: 'Tyr · C₉H₁₁NO₃ – chaîne latérale phénolique aromatique.'
		},
		valine: {
			name: 'Valine',
			description: 'Val · C₅H₁₁NO₂ – chaîne latérale aliphatique ramifiée, apolaire.'
		}
	}
};

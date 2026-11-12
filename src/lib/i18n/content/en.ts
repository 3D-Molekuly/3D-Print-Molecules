import type { LocaleContent } from './types';

const siteName = '3D Printing Molecules';

export const en: LocaleContent = {
	seo: {
		siteName,
		alternateName: '3D Tisk Molekul',
		author: 'UCT Prague, First Faculty of Medicine – Charles University',
		ogImageAlt:
			'3D Printing Molecules web application interface for generating 3MF and STL molecular models',
		orgUct: 'University of Chemistry and Technology, Prague (UCT Prague)',
		orgLf1: 'First Faculty of Medicine, Charles University',
		home: {
			title: '3D Printing Molecules – Free PubChem, PDB & CIF to 3MF/STL Generator',
			description:
				'Free web app by UCT Prague & Charles University to visualize and convert molecules from PubChem, PDB, COD, SDF, and CIF into multicolor 3D-printable 3MF and STL models.',
			keywords:
				'3D print molecules, molecular 3D printing, PubChem to STL, PDB to 3MF, CIF to STL, multicolor molecule model, chemistry teaching models, PrusaSlicer, Bambu Studio',
			sharedOgTitle: (molecule) => `${molecule} – 3D Printable Molecule Model | ${siteName}`,
			featureList: [
				'Import molecular structures from PubChem, RCSB PDB, and Crystallography Open Database (COD)',
				'Upload custom .sdf, .pdb, and .cif files',
				'Multicolor .3MF and multi-part .STL export',
				'Spheres, Split for Gluing, Ball-and-Stick, Print-in-Place Moving Joints, Sticks, and Minecraft modes',
				'Direct one-click launch in PrusaSlicer, Bambu Studio, OrcaSlicer, and Ultimaker Cura'
			]
		},
		tutorials: {
			title: 'Tutorial: How to Prepare & 3D Print Molecule Models | 3D Printing Molecules',
			description:
				'Step-by-step guide to importing molecules from PubChem, PDB, COD, or SDF/CIF files, customizing 3D representations, and exporting multicolor 3MF/STL models for your slicer.',
			keywords:
				'how to 3D print molecules, molecular model tutorial, multicolor 3MF slicer guide, PrusaSlicer multi-part object, Bambu Studio molecule print',
			howToName: 'How to prepare a molecular model for 3D printing',
			steps: [
				{
					name: 'Select or upload a molecule',
					text: 'Search for a compound in PubChem, PDB, or COD, or upload your own .sdf, .pdb, or .cif file.'
				},
				{
					name: 'Choose representation and settings',
					text: 'Select a model style (Spheres, Split for Gluing, Ball-and-Stick, Moving Joints, Sticks) and adjust scale, mesh quality, or bond diameter.'
				},
				{
					name: 'Export to 3MF or STL and slice',
					text: 'Download the colored .3MF file or ZIP of separate STL parts and import the model into your 3D slicer as a multi-part object.'
				}
			],
			breadcrumb: 'Tutorial'
		},
		about: {
			title: 'About the Project – UCT Prague & Charles University | 3D Printing Molecules',
			description:
				'Academic collaboration between UCT Prague and Charles University making multicolor 3D printing of molecular models fast and accessible for educators, students, and researchers.',
			keywords:
				'UCT Prague, Charles University, chemistry education 3D printing, molecular teaching aids, academic open-source tool',
			breadcrumb: 'About'
		},
		examples: {
			title: `3D Printed Molecule Models – Free STL & 3MF Downloads | ${siteName}`,
			description:
				'Gallery of 3D printed molecular models – adrenaline, ATP, glucose, indigo, calixarene, cryptand and TRK kinase. Download free files from Printables and MakerWorld.',
			keywords:
				'3D printed molecules, molecule STL download, molecular model 3MF, printable molecule models, Printables molecules, MakerWorld molecules'
		},
		demonstrations: {
			title: `Examples | ${siteName}`,
			description: 'Examples of 3D printed molecular models.',
			keywords: '3D printing molecules, examples'
		}
	},
	faq: [
		{
			question: 'Which molecular databases and file formats are supported?',
			answer:
				'You can search molecules directly by name, CID, or CAS number from PubChem, by 4-character entry ID from RCSB PDB, or by crystal ID from the Crystallography Open Database (COD). You can also upload custom .sdf, .pdb, and .cif structure files.'
		},
		{
			question: 'How do I print multicolor molecular models?',
			answer:
				'For multi-material 3D printers (AMS, MMU, toolchangers), export directly to .3MF with pre-assigned CPK atom colors and multi-part geometry. For single-extruder printers without multi-color hardware, choose the Spheres SPLIT FOR GLUING mode to generate separate watertight parts ready for gluing with optional 1.75 mm filament alignment pegs.'
		},
		{
			question: 'Which 3D printing slicers are supported?',
			answer:
				'Exported .3MF and .STL files work seamlessly in PrusaSlicer, Bambu Studio, OrcaSlicer, and Ultimaker Cura. You can also launch the model directly in your desktop slicer using the built-in Slice button.'
		},
		{
			question: 'Is 3D Printing Molecules free for education and research?',
			answer:
				'Yes, this web application developed by UCT Prague and the First Faculty of Medicine at Charles University is completely free to use with no account required for educators, students, researchers, and makers.'
		}
	],
	gallery: {
		heading: '3D Printed Molecular Models',
		intro:
			'Molecules we prepared in the app and printed. Download the ready-to-print 3MF and STL files for free from Printables or MakerWorld, or tweak and generate the model yourself in our web app.',
		channels: 'Full collection on our profiles',
		aminoHeading: 'Amino Acids',
		aminoMeta: (n) => `${n} proteinogenic amino acids · multi-color print`,
		aminoIntro:
			'The complete set of proteinogenic amino acids including selenocysteine, prepared for multi-color printing (colored by element).',
		searchLabel: 'Search models',
		searchPlaceholder: 'Search molecules… (e.g. glycine, ATP, Trp)',
		searchClear: 'Clear search',
		searchResults: (n) => `${n} ${n === 1 ? 'model' : 'models'} found`,
		searchEmpty: 'No printed model matches your search.',
		ctaHeading: 'Missing a molecule?',
		ctaText: 'Generate your own model from PubChem, PDB or COD in seconds.',
		ctaButton: 'Open the generator'
	},
	modelCard: {
		openEditor: 'Edit in the app',
		photoAlt: '3D printed molecular model',
		makerworldPending: 'MakerWorld soon'
	}
};

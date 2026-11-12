import type { LocaleContent } from './types';

const siteName = '3D-Druck von Molekülen';

export const de: LocaleContent = {
	seo: {
		siteName,
		alternateName: '3D Printing Molecules',
		author: 'UCT Prag, Erste Medizinische Fakultät – Karls-Universität',
		ogImageAlt:
			'Oberfläche der Web-App 3D-Druck von Molekülen zum Erzeugen von 3MF- und STL-Molekülmodellen',
		orgUct: 'Universität für Chemie und Technologie Prag (UCT Prag)',
		orgLf1: 'Erste Medizinische Fakultät, Karls-Universität',
		home: {
			title: '3D-Druck von Molekülen – kostenloser Generator von PubChem, PDB und CIF zu 3MF/STL',
			description:
				'Kostenlose Web-App der UCT Prag und der Karls-Universität zum Visualisieren und Umwandeln von Molekülen aus PubChem, PDB, COD, SDF und CIF in mehrfarbige, 3D-druckbare 3MF- und STL-Modelle.',
			keywords:
				'Moleküle 3D-drucken, 3D-Druck von Molekülen, Molekülmodell 3D-Druck, PubChem zu STL, PDB zu 3MF, CIF zu STL, mehrfarbiges Molekülmodell, Molekülmodelle für den Chemieunterricht, PrusaSlicer, Bambu Studio',
			sharedOgTitle: (molecule) => `${molecule} – 3D-druckbares Molekülmodell | ${siteName}`,
			featureList: [
				'Import von Molekülstrukturen aus PubChem, RCSB PDB und der Crystallography Open Database (COD)',
				'Hochladen eigener .sdf-, .pdb- und .cif-Dateien',
				'Mehrfarbiger .3MF-Export und mehrteiliger .STL-Export',
				'Modi Spheres, Split for Gluing, Ball-and-Stick, Moving Joints (in einem Stück gedruckte bewegliche Gelenke), Sticks und Minecraft',
				'Direktes Öffnen per Klick in PrusaSlicer, Bambu Studio, OrcaSlicer und Ultimaker Cura'
			]
		},
		tutorials: {
			title: 'Anleitung: Molekülmodelle vorbereiten und 3D-drucken | 3D-Druck von Molekülen',
			description:
				'Schritt-für-Schritt-Anleitung: Moleküle aus PubChem, PDB, COD oder SDF/CIF-Dateien importieren, die 3D-Darstellung anpassen und mehrfarbige 3MF/STL-Modelle für Ihren Slicer exportieren.',
			keywords:
				'Moleküle 3D-drucken Anleitung, Molekülmodell Tutorial, mehrfarbiger 3D-Druck 3MF, PrusaSlicer mehrteiliges Objekt, Molekül drucken Bambu Studio',
			howToName: 'So bereiten Sie ein Molekülmodell für den 3D-Druck vor',
			steps: [
				{
					name: 'Molekül auswählen oder hochladen',
					text: 'Suchen Sie eine Verbindung in PubChem, PDB oder COD, oder laden Sie eine eigene .sdf-, .pdb- oder .cif-Datei hoch.'
				},
				{
					name: 'Darstellung und Einstellungen wählen',
					text: 'Wählen Sie eine Modelldarstellung (Spheres, Split for Gluing, Ball-and-Stick, Moving Joints, Sticks) und passen Sie Maßstab, Netzqualität oder Bindungsdurchmesser an.'
				},
				{
					name: 'Als 3MF oder STL exportieren und slicen',
					text: 'Laden Sie die farbige .3MF-Datei oder ein ZIP mit separaten STL-Teilen herunter und importieren Sie das Modell als mehrteiliges Objekt in Ihren Slicer.'
				}
			],
			breadcrumb: 'Anleitung'
		},
		about: {
			title: 'Über das Projekt – UCT Prag und Karls-Universität | 3D-Druck von Molekülen',
			description:
				'Akademische Zusammenarbeit der UCT Prag und der Karls-Universität, die den mehrfarbigen 3D-Druck von Molekülmodellen für Lehrkräfte, Studierende und Forschende schnell und zugänglich macht.',
			keywords:
				'UCT Prag, Karls-Universität, 3D-Druck im Chemieunterricht, Molekülmodelle als Lehrmittel, akademisches Open-Source-Werkzeug',
			breadcrumb: 'Über uns'
		},
		examples: {
			title: `3D-gedruckte Molekülmodelle – kostenlose STL- und 3MF-Downloads | ${siteName}`,
			description:
				'Galerie 3D-gedruckter Molekülmodelle – Adrenalin, ATP, Glucose, Indigo, Calixaren, Kryptand und TRK-Kinase. Laden Sie die Dateien kostenlos von Printables und MakerWorld herunter.',
			keywords:
				'3D-gedruckte Moleküle, Molekül STL Download, Molekülmodell 3MF, druckbare Molekülmodelle, Moleküle Printables, Moleküle MakerWorld'
		},
		demonstrations: {
			title: `Beispiele | ${siteName}`,
			description: 'Beispiele für 3D-gedruckte Molekülmodelle.',
			keywords: '3D-Druck von Molekülen, Beispiele'
		}
	},
	faq: [
		{
			question: 'Welche Moleküldatenbanken und Dateiformate werden unterstützt?',
			answer:
				'Sie können Moleküle direkt nach Name, CID oder CAS-Nummer in PubChem suchen, nach der 4-stelligen Eintrags-ID in der RCSB PDB oder nach der Kristall-ID in der Crystallography Open Database (COD). Außerdem können Sie eigene Strukturdateien im Format .sdf, .pdb und .cif hochladen.'
		},
		{
			question: 'Wie drucke ich mehrfarbige Molekülmodelle?',
			answer:
				'Für Mehrmaterial-3D-Drucker (AMS, MMU, Werkzeugwechsler) exportieren Sie direkt als .3MF mit vorab zugewiesenen CPK-Atomfarben und mehrteiliger Geometrie. Für Drucker mit nur einem Extruder ohne Mehrfarbhardware wählen Sie den Modus Spheres SPLIT FOR GLUING: Er erzeugt separate, wasserdichte Teile zum Verkleben – optional mit Ausrichtungsstiften aus 1,75-mm-Filament.'
		},
		{
			question: 'Welche Slicer für den 3D-Druck werden unterstützt?',
			answer:
				'Die exportierten .3MF- und .STL-Dateien funktionieren problemlos in PrusaSlicer, Bambu Studio, OrcaSlicer und Ultimaker Cura. Über die integrierte Schaltfläche „Slicen“ können Sie das Modell auch direkt in Ihrem Desktop-Slicer öffnen.'
		},
		{
			question: 'Ist 3D-Druck von Molekülen für Lehre und Forschung kostenlos?',
			answer:
				'Ja. Diese Web-App, entwickelt von der UCT Prag und der Ersten Medizinischen Fakultät der Karls-Universität, ist für Lehrkräfte, Studierende, Forschende und Maker völlig kostenlos und ohne Registrierung nutzbar.'
		}
	],
	gallery: {
		heading: '3D-gedruckte Molekülmodelle',
		intro:
			'Moleküle, die wir in der App vorbereitet und gedruckt haben. Laden Sie die druckfertigen 3MF- und STL-Dateien kostenlos von Printables oder MakerWorld herunter – oder passen Sie das Modell in unserer Web-App an und erzeugen Sie es selbst.',
		channels: 'Die vollständige Sammlung auf unseren Profilen',
		aminoHeading: 'Aminosäuren',
		aminoMeta: (n) => `${n} proteinogene Aminosäuren · Mehrfarbendruck`,
		aminoIntro:
			'Der vollständige Satz proteinogener Aminosäuren einschließlich Selenocystein, vorbereitet für den Mehrfarbendruck (Färbung nach Element).',
		searchLabel: 'Modelle durchsuchen',
		searchPlaceholder: 'Moleküle suchen… (z. B. Glycin, ATP, Trp)',
		searchClear: 'Suche löschen',
		searchResults: (n) => `${n} ${n === 1 ? 'Modell' : 'Modelle'} gefunden`,
		searchEmpty: 'Kein gedrucktes Modell entspricht Ihrer Suche.',
		ctaHeading: 'Fehlt ein Molekül?',
		ctaText: 'Erzeugen Sie in Sekunden Ihr eigenes Modell aus PubChem, PDB oder COD.',
		ctaButton: 'Generator öffnen'
	},
	modelCard: {
		openEditor: 'In der App bearbeiten',
		photoAlt: '3D-gedrucktes Molekülmodell',
		makerworldPending: 'MakerWorld folgt'
	},
	models: {
		adrenaline: {
			name: 'Adrenalin (Epinephrin)',
			description: 'Kugel-Stab-Modell des Hormons und Neurotransmitters der Kampf-oder-Flucht-Reaktion.'
		},
		'trk-kinase': {
			name: 'TRK-Rezeptorkinase und zielgerichtete Inhibitoren',
			description:
				'Modell der Ligand-Protein-Bindung: TRK-Kinase mit Inhibitoren im aktiven Zentrum.'
		},
		atp: {
			name: 'ATP (Adenosintriphosphat)',
			description:
				'Der universelle Energieträger der Zelle – ein Nukleotid mit drei Phosphatgruppen.'
		},
		glucose: {
			name: 'Glucose',
			description: 'Der grundlegende Zucker und die wichtigste Energiequelle lebender Organismen.'
		},
		indigo: {
			name: 'Indigo',
			description: 'Der historische blaue Farbstoff, mit dem bis heute Denim gefärbt wird.'
		},
		calixarene: {
			name: 'Calixaren',
			description: 'Ein kelchförmiger Makrocyclus – ein klassisches Beispiel der supramolekularen Chemie.'
		},
		'cryptand-222': {
			name: '[2.2.2]-Kryptand (Crypt-222)',
			description: 'Ein bicyclischer Ligand, der Metallkationen fest in seinem Hohlraum einschließt.'
		},
		alanine: {
			name: 'Alanin',
			description: 'Ala · C₃H₇NO₂ – unpolare, aliphatische Seitenkette.'
		},
		arginine: {
			name: 'Arginin',
			description: 'Arg · C₆H₁₄N₄O₂ – basische, positiv geladene Seitenkette.'
		},
		asparagine: {
			name: 'Asparagin',
			description: 'Asn · C₄H₈N₂O₃ – polare, ungeladene Amid-Seitenkette.'
		},
		'aspartic-acid': {
			name: 'Asparaginsäure',
			description: 'Asp · C₄H₇NO₄ – saure, negativ geladene Seitenkette.'
		},
		cysteine: {
			name: 'Cystein',
			description: 'Cys · C₃H₇NO₂S – polares Thiol, das Disulfidbrücken bildet.'
		},
		'glutamic-acid': {
			name: 'Glutaminsäure',
			description: 'Glu · C₅H₉NO₄ – saure, negativ geladene Seitenkette.'
		},
		glutamine: {
			name: 'Glutamin',
			description: 'Gln · C₅H₁₀N₂O₃ – polare, ungeladene Amid-Seitenkette.'
		},
		glycine: {
			name: 'Glycin',
			description: 'Gly · C₂H₅NO₂ – die einfachste und einzige achirale Aminosäure.'
		},
		histidine: {
			name: 'Histidin',
			description: 'His · C₆H₉N₃O₂ – basischer Imidazolring.'
		},
		isoleucine: {
			name: 'Isoleucin',
			description: 'Ile · C₆H₁₃NO₂ – unpolare, verzweigte aliphatische Seitenkette.'
		},
		leucine: {
			name: 'Leucin',
			description: 'Leu · C₆H₁₃NO₂ – unpolare, verzweigte aliphatische Seitenkette.'
		},
		lysine: {
			name: 'Lysin',
			description: 'Lys · C₆H₁₄N₂O₂ – basische, positiv geladene Seitenkette.'
		},
		methionine: {
			name: 'Methionin',
			description: 'Met · C₅H₁₁NO₂S – unpolar, schwefelhaltig; startet die Proteintranslation.'
		},
		phenylalanine: {
			name: 'Phenylalanin',
			description: 'Phe · C₉H₁₁NO₂ – unpolar, aromatischer Benzolring.'
		},
		proline: {
			name: 'Prolin',
			description: 'Pro · C₅H₉NO₂ – cyclische Seitenkette, die die Sekundärstruktur unterbricht.'
		},
		selenocysteine: {
			name: 'Selenocystein',
			description: 'Sec · C₃H₇NO₂Se – die „21. Aminosäure“ – Selen anstelle von Schwefel.'
		},
		serine: {
			name: 'Serin',
			description: 'Ser · C₃H₇NO₃ – polare Hydroxy-Seitenkette.'
		},
		threonine: {
			name: 'Threonin',
			description: 'Thr · C₄H₉NO₃ – polare Hydroxy-Seitenkette.'
		},
		tryptophan: {
			name: 'Tryptophan',
			description: 'Trp · C₁₁H₁₂N₂O₂ – aromatischer Indolring.'
		},
		tyrosine: {
			name: 'Tyrosin',
			description: 'Tyr · C₉H₁₁NO₃ – aromatische Phenol-Seitenkette.'
		},
		valine: {
			name: 'Valin',
			description: 'Val · C₅H₁₁NO₂ – unpolare, verzweigte aliphatische Seitenkette.'
		}
	}
};

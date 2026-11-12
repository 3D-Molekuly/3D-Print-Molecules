import type { LocaleContent } from './types';

const siteName = '3D Tisk Molekul';

export const cs: LocaleContent = {
	seo: {
		siteName,
		alternateName: '3D Printing Molecules',
		author: 'VŠCHT Praha, 1. lékařská fakulta UK',
		ogImageAlt: 'Ukázka webové aplikace 3D Tisk Molekul pro přípravu 3MF a STL modelů molekul',
		orgUct: 'Ústav učitelství chemie a humanitních věd VŠCHT Praha',
		orgLf1: '1. lékařská fakulta Univerzity Karlovy',
		home: {
			title: '3D Tisk Molekul – Generátor 3MF a STL modelů z PubChem, PDB a CIF',
			description:
				'Bezplatná webová aplikace VŠCHT Praha a 1. LF UK pro přípravu vícebarevných 3D modelů molekul k tisku. Převeďte struktury z PubChem, PDB, COD, SDF a CIF do 3MF nebo STL.',
			keywords:
				'3D tisk molekul, 3D modely molekul, chemie 3D tisk, PubChem do STL, PDB do 3MF, vícebarevný 3D tisk, molekulové modely, PrusaSlicer, Bambu Studio, VŠCHT Praha',
			sharedOgTitle: (molecule) => `${molecule} – 3D model molekuly k tisku | ${siteName}`,
			featureList: [
				'Import struktur z PubChem, RCSB PDB a Crystallography Open Database (COD)',
				'Nahrání vlastních souborů .sdf, .pdb a .cif',
				'Vícebarevný export do .3MF a oddělených .STL souborů',
				'Režimy Spheres, Split for Gluing, Ball-and-Stick, Print-in-Place Moving Joints, Sticks a Minecraft',
				'Přímé otevření v PrusaSlicer, Bambu Studio, OrcaSlicer a Ultimaker Cura'
			]
		},
		tutorials: {
			title: 'Návod: Jak připravit a vytisknout 3D model molekuly | 3D Tisk Molekul',
			description:
				'Podrobný návod krok za krokem: import molekul z PubChem, PDB, COD nebo souborů SDF/CIF, volba reprezentace a export barevného 3MF či STL modelu do sliceru.',
			keywords:
				'návod 3D tisk molekul, jak vytisknout molekulu, vícebarevný tisk 3MF, PrusaSlicer multi-part object, Bambu Studio molekuly, PubChem STL návod',
			howToName: 'Jak připravit 3D model molekuly pro tisk',
			steps: [
				{
					name: 'Výběr nebo nahrání molekuly',
					text: 'Vyhledejte sloučeninu v databázi PubChem, PDB či COD nebo nahrajte vlastní soubor .sdf, .pdb nebo .cif.'
				},
				{
					name: 'Volba reprezentace a parametrů',
					text: 'Vyberte styl modelu (Spheres, Split for Gluing, Ball-and-Stick, Moving Joints, Sticks) a upravte měřítko, kvalitu sítě nebo tloušťku vazeb.'
				},
				{
					name: 'Export do 3MF nebo STL a slicing',
					text: 'Stáhněte barevný .3MF soubor nebo ZIP s oddělenými STL díly a otevřete model ve sliceru jako vícedílný objekt.'
				}
			],
			breadcrumb: 'Návod'
		},
		about: {
			title: 'O projektu VŠCHT Praha a 1. LF UK | 3D Tisk Molekul',
			description:
				'Akademický projekt VŠCHT Praha a 1. lékařské fakulty UK zpřístupňující rychlou přípravu a vícebarevný 3D tisk modelů bioorganických i anorganických molekul.',
			keywords:
				'VŠCHT Praha, 1. LF UK, výuka chemie 3D tisk, didaktické pomůcky chemie, modely molekul pro školy',
			breadcrumb: 'O nás'
		},
		examples: {
			title: `Vytištěné 3D modely molekul ke stažení (STL, 3MF) | ${siteName}`,
			description:
				'Galerie vytištěných 3D modelů molekul – adrenalin, ATP, glukóza, indigo, kalixaren, kryptand a protein TRK. Stáhněte si soubory zdarma z Printables a MakerWorld.',
			keywords:
				'3D modely molekul ke stažení, STL molekula, 3MF molekula, vytištěné molekuly, Printables molekuly, MakerWorld molekuly'
		},
		demonstrations: {
			title: `Příklady | ${siteName}`,
			description: 'Ukázky vytištěných 3D modelů molekul.',
			keywords: '3D tisk molekul, příklady'
		}
	},
	faq: [
		{
			question: 'Jaké zdroje dat a formáty souborů aplikace podporuje?',
			answer:
				'Molekuly můžete vyhledat přímo podle názvu, CID nebo CAS čísla v databázi PubChem, pomocí 4místného kódu proteinu v RCSB PDB, případně přes ID v Crystallography Open Database (COD). Nahrát lze i vlastní soubory ve formátech .sdf, .pdb a .cif.'
		},
		{
			question: 'Jak vytisknout molekulu vícebarevně na 3D tiskárně?',
			answer:
				'Pro tiskárny s vícemateriálovou jednotkou (AMS, MMU, více extruderů) stáhněte přímo soubor .3MF, který již obsahuje rozdělené části a přiřazené barvy atomů (CPK). Pro běžné jednobarevné tiskárny využijte režim Spheres SPLIT FOR GLUING, který vygeneruje samostatné vodotěsné díly s plochami pro slepení či kolíky z 1,75mm filamentu.'
		},
		{
			question: 'Se kterými slicery jsou exportované modely kompatibilní?',
			answer:
				'Exportované soubory .3MF a .STL fungují v programech PrusaSlicer, Bambu Studio, OrcaSlicer i Ultimaker Cura. Tlačítko Slice navíc umožňuje otevřít vygenerovaný .3MF model přímo ve zvoleném desktopovém sliceru.'
		},
		{
			question: 'Je aplikace 3D Tisk Molekul zdarma pro školy a výuku?',
			answer:
				'Ano, nástroj vyvinutý ve spolupráci VŠCHT Praha a 1. lékařské fakulty Univerzity Karlovy je zcela zdarma bez registrace pro studenty, pedagogy, vědce i nadšence do 3D tisku.'
		}
	],
	gallery: {
		heading: 'Vytištěné 3D modely molekul',
		intro:
			'Ukázky molekul, které jsme připravili v aplikaci a vytiskli. Hotové soubory 3MF a STL si můžete zdarma stáhnout z Printables nebo MakerWorld, nebo si model upravit a vygenerovat přímo v naší aplikaci.',
		channels: 'Celá sbírka na našich profilech',
		aminoHeading: 'Aminokyseliny',
		aminoMeta: (n) => `${n} proteinogenních aminokyselin · vícebarevný tisk`,
		aminoIntro:
			'Kompletní sada proteinogenních aminokyselin včetně selenocysteinu, připravená pro vícebarevný tisk (barvy podle prvků).',
		searchLabel: 'Hledat model',
		searchPlaceholder: 'Hledat molekulu… (např. glycin, ATP, Trp)',
		searchClear: 'Vymazat hledání',
		searchResults: (n) => `Nalezeno modelů: ${n}`,
		searchEmpty: 'Žádný vytištěný model neodpovídá hledání.',
		ctaHeading: 'Chybí vám tu molekula?',
		ctaText: 'Vygenerujte si vlastní model z PubChem, PDB nebo COD během pár vteřin.',
		ctaButton: 'Otevřít generátor'
	},
	modelCard: {
		openEditor: 'Upravit v aplikaci',
		photoAlt: 'Vytištěný 3D model molekuly',
		makerworldPending: 'Brzy na MakerWorld'
	}
};

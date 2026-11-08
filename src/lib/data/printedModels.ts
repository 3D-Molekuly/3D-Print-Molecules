import type { SupportedLocale } from '$lib/functions/language';

export const PRINTABLES_PROFILE_URL = 'https://www.printables.com/@3DPMol_5381976/models';
export const MAKERWORLD_PROFILE_URL = 'https://makerworld.com/en/@3DPMol';

export interface PrintedModel {
	id: string;
	name: Record<SupportedLocale, string>;
	description: Record<SupportedLocale, string>;
	/** Photo of the printed model (Printables CDN, 640×480 webp). */
	image: string;
	printablesUrl: string;
	makerworldUrl: string;
	/** Query for the generator (`/?mol=…`); omitted when the structure is not a single PubChem compound. */
	editorQuery?: string;
}

const PRINTABLES_MEDIA = 'https://media.printables.com/media/prints';

export const PRINTED_MODELS: PrintedModel[] = [
	{
		id: 'adrenaline',
		name: { cs: 'Adrenalin (epinefrin)', en: 'Adrenaline (Epinephrine)' },
		description: {
			cs: 'Kuličkový model hormonu a neurotransmiteru reakce „bojuj, nebo uteč“.',
			en: 'Ball-and-stick model of the fight-or-flight hormone and neurotransmitter.'
		},
		image: `${PRINTABLES_MEDIA}/3be33779-659e-4a2b-9a90-6f12db54f578/images/13811967_65f04c7e-b204-45c9-8180-705846e9f999_43accdf3-a246-470a-8ecc-d789a61d8f73/thumbs/inside/640x480/jpg/dsc_8163.webp`,
		printablesUrl: 'https://www.printables.com/model/1842488-adrenaline-epinephrine-molecular-model-ball-stick',
		makerworldUrl: 'https://makerworld.com/en/models/3562559-adrenaline-epinephrine-model-ball-stick',
		editorQuery: 'epinephrine'
	},
	{
		id: 'trk-kinase',
		name: {
			cs: 'TRK receptorová kináza a cílené inhibitory',
			en: 'TRK Receptor Kinase & Targeted Inhibitors'
		},
		description: {
			cs: 'Model vazby ligandu na protein – kináza TRK s inhibitory v aktivním místě.',
			en: 'Ligand–protein binding model of the TRK kinase with inhibitors in the active site.'
		},
		image: `${PRINTABLES_MEDIA}/ec94c547-e226-4ff3-98a6-5d0ff41268b1/images/13811807_1c345228-961a-477b-bacf-8b3c3daf9f0b_e4a7f098-85ba-4c5b-a6b1-79f316f11348/thumbs/inside/640x480/jpeg/dsc_5951jpg_compressed.webp`,
		printablesUrl: 'https://www.printables.com/model/1842477-trk-receptor-kinase-targeted-inhibitors-ligand-pro',
		makerworldUrl: 'https://makerworld.com/en/models/3562585-trk-receptor-kinase-targeted-inhibitors'
	},
	{
		id: 'atp',
		name: { cs: 'ATP (adenosintrifosfát)', en: 'ATP (Adenosine Triphosphate)' },
		description: {
			cs: 'Univerzální přenašeč energie v buňce – nukleotid se třemi fosfátovými skupinami.',
			en: 'The universal energy carrier of the cell – a nucleotide with three phosphate groups.'
		},
		image: `${PRINTABLES_MEDIA}/1b126957-d20d-4115-9b2a-7e25d5fc58f8/images/14055904_f4a60c17-e519-44fe-9f9e-786b4b6e4d54_ab5d3052-08e3-4281-81a7-6329b982ca95/thumbs/inside/640x480/jpg/img_0201.webp`,
		printablesUrl: 'https://www.printables.com/model/1872496-atp-adenosine-triphosphate-molecular-model',
		makerworldUrl: 'https://makerworld.com/en/models/3563512-atp-adenosine-triphosphate-molecular-model',
		editorQuery: 'adenosine triphosphate'
	},
	{
		id: 'glucose',
		name: { cs: 'Glukóza', en: 'Glucose' },
		description: {
			cs: 'Základní cukr a hlavní zdroj energie živých organismů.',
			en: 'The fundamental sugar and main energy source of living organisms.'
		},
		image: `${PRINTABLES_MEDIA}/60f84c03-fb36-4244-8887-2b3fc13d51b4/images/14063034_b12b0066-da13-4244-8db0-2ca5e535f38f_e12d835a-0690-43b2-a5b3-90fc90f8b93c/thumbs/inside/640x480/jpg/img_0202.webp`,
		printablesUrl: 'https://www.printables.com/model/1873410-glucose-molecular-model-fundamental-energy-sugar',
		makerworldUrl: 'https://makerworld.com/en/models/3563564-glucose-molecular-model-fundamental-energy-sugar',
		editorQuery: 'glucose'
	},
	{
		id: 'indigo',
		name: { cs: 'Indigo', en: 'Indigo' },
		description: {
			cs: 'Historické modré barvivo, kterým se dodnes barví džínovina.',
			en: 'The historic blue dye still used to colour denim today.'
		},
		image: `${PRINTABLES_MEDIA}/75f91239-8efe-4d27-8b0b-cc9c4f60dd44/images/14091145_4a84d670-5be7-41b0-ad8c-0bdec9744f65_2df212ce-98f8-4a91-badf-8846e71d715a/thumbs/inside/640x480/jpg/img_0199.webp`,
		printablesUrl: 'https://www.printables.com/model/1877083-indigo-molecular-model',
		makerworldUrl: 'https://makerworld.com/en/models/3563592-indigo-molecular-model',
		editorQuery: 'indigo'
	},
	{
		id: 'calixarene',
		name: { cs: 'Kalixaren', en: 'Calixarene' },
		description: {
			cs: 'Makrocyklus ve tvaru kalichu, typický příklad supramolekulární chemie.',
			en: 'A cup-shaped macrocycle – a classic example of supramolecular chemistry.'
		},
		image: `${PRINTABLES_MEDIA}/41ff8aa9-556a-499b-b494-58278c2b932a/images/14055873_8f8b72a3-399f-4a2a-b111-42f370f78504_561e44c4-67bd-4ced-a1a3-b260c56073d9/thumbs/inside/640x480/jpeg/img_0198.webp`,
		printablesUrl: 'https://www.printables.com/model/1872493-calixarene-molecular-model',
		makerworldUrl: 'https://makerworld.com/en/models/3563469-calixarene-molecular-model'
	},
	{
		id: 'cryptand-222',
		name: { cs: '[2.2.2]-Kryptand', en: '[2.2.2]-Cryptand (Crypt-222)' },
		description: {
			cs: 'Bicyklický ligand, který pevně uzavírá kationty kovů do své dutiny.',
			en: 'A bicyclic ligand that tightly encapsulates metal cations in its cavity.'
		},
		image: `${PRINTABLES_MEDIA}/133aded2-3a0f-4981-bcea-2a6a2f8424b4/images/14055959_7ed00023-6dd8-435a-acee-e4309686b235_13a94094-a5f7-4b22-b63d-cbd50622fe7a/thumbs/inside/640x480/jpg/img_0214.webp`,
		printablesUrl: 'https://www.printables.com/model/1872502-222-cryptand-crypt-222-molecular-model',
		makerworldUrl: 'https://makerworld.com/en/models/3563631-2-2-2-cryptand-crypt-222-molecular-model',
		editorQuery: 'Kryptofix 222'
	}
];

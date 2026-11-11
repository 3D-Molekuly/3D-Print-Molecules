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
	/** Omitted while the MakerWorld upload is still awaiting approval. */
	makerworldUrl?: string;
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

/** Proteinogenic amino acids (20 + selenocysteine), multi-colour prints. */
export const AMINO_ACIDS: PrintedModel[] = [
	{
		id: 'alanine',
		name: { cs: 'Alanin', en: 'Alanine' },
		description: {
			cs: 'Ala · C₃H₇NO₂ – nepolární, alifatický postranní řetězec.',
			en: 'Ala · C₃H₇NO₂ – nonpolar, aliphatic side chain.'
		},
		image: `${PRINTABLES_MEDIA}/1c1f25b4-cf6a-46a0-b907-7efc29b14fe8/images/14409023_dc534cc2-5623-4512-8920-ea21abbdd5d2_8ee889c7-7fa6-4b28-871e-35759756c09b/thumbs/inside/640x480/jpg/alanine_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907563-alanine-c3h7no2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583019-alanine-c3h7no2-multi-color-3d-molecule-model',
		editorQuery: 'L-alanine'
	},
	{
		id: 'arginine',
		name: { cs: 'Arginin', en: 'Arginine' },
		description: {
			cs: 'Arg · C₆H₁₄N₄O₂ – bazický, kladně nabitý postranní řetězec.',
			en: 'Arg · C₆H₁₄N₄O₂ – basic, positively charged side chain.'
		},
		image: `${PRINTABLES_MEDIA}/dafd9650-d2db-40e6-8cab-40487b02541b/images/14409097_abb60775-dbe5-48c0-9a97-3ff93578eef0_5d71fca0-2c0b-46a2-8bab-2190209d6300/thumbs/inside/640x480/jpg/arginine-2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907575-arginine-c6h14n4o2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583172-arginine-c6h14n4o2-multi-color-3d-molecule',
		editorQuery: 'L-arginine'
	},
	{
		id: 'asparagine',
		name: { cs: 'Asparagin', en: 'Asparagine' },
		description: {
			cs: 'Asn · C₄H₈N₂O₃ – polární amid, bez náboje.',
			en: 'Asn · C₄H₈N₂O₃ – polar, uncharged amide side chain.'
		},
		image: `${PRINTABLES_MEDIA}/e983b2af-291f-4e71-907e-66c100768870/images/14409127_cc830697-c502-4651-bbb9-9903d8fffca1_d3baee33-8139-454a-9019-c7e9a55c19be/thumbs/inside/640x480/jpg/asparagine-1_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907578-asparagine-c4h8n2o3-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583166-asparagine-c4h8n2o3-multi-color-3d-molecule',
		editorQuery: 'L-asparagine'
	},
	{
		id: 'aspartic-acid',
		name: { cs: 'Kyselina asparagová', en: 'Aspartic Acid' },
		description: {
			cs: 'Asp · C₄H₇NO₄ – kyselý, záporně nabitý postranní řetězec.',
			en: 'Asp · C₄H₇NO₄ – acidic, negatively charged side chain.'
		},
		image: `${PRINTABLES_MEDIA}/6daa96bf-3963-4172-8d8d-1f9255987b21/images/14409147_0aa53a20-684d-4bfd-9175-97c9d63d82df_6fd235f9-c8fc-4992-96d1-7a909ec71e4a/thumbs/inside/640x480/jpg/aspartic-acid-2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907581-aspartic-acid-c4h7no4-multi-color-3d-molecule-mode',
		makerworldUrl: 'https://makerworld.com/en/models/3589640-aspartic-acid-c4h7no4-multi-color-3d-molecule',
		editorQuery: 'L-aspartic acid'
	},
	{
		id: 'cysteine',
		name: { cs: 'Cystein', en: 'Cysteine' },
		description: {
			cs: 'Cys · C₃H₇NO₂S – polární, thiolová skupina tvoří disulfidové můstky.',
			en: 'Cys · C₃H₇NO₂S – polar thiol that forms disulfide bridges.'
		},
		image: `${PRINTABLES_MEDIA}/19916028-1730-4047-9239-78e4ada32dfe/images/14437881_f0b67be4-78bf-4b11-ac54-f4643a466985_85f8fcb3-292b-4e01-8ae3-d86de27a8769/thumbs/inside/640x480/jpg/cysteine-2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1910293-cysteine-c3h7no2s-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3593160-cysteine-c3h7no2s-multi-color-3d-molecule',
		editorQuery: 'L-cysteine'
	},
	{
		id: 'glutamic-acid',
		name: { cs: 'Kyselina glutamová', en: 'Glutamic Acid' },
		description: {
			cs: 'Glu · C₅H₉NO₄ – kyselý, záporně nabitý postranní řetězec.',
			en: 'Glu · C₅H₉NO₄ – acidic, negatively charged side chain.'
		},
		image: `${PRINTABLES_MEDIA}/8e22d739-009a-406e-afc8-cdcd97b5c24c/images/14409156_638263b2-b4a5-4fc3-a42a-383c9d2ab125_456db1ea-fab5-48d3-8b78-debd3a40c08e/thumbs/inside/640x480/jpg/glutamic-acid-1_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907587-glutamic-acid-c5h9no4-multi-color-3d-molecule-mode',
		makerworldUrl: 'https://makerworld.com/en/models/3583210-glutamic-acid-c5h9no4-multi-color-3d-molecule',
		editorQuery: 'L-glutamic acid'
	},
	{
		id: 'glutamine',
		name: { cs: 'Glutamin', en: 'Glutamine' },
		description: {
			cs: 'Gln · C₅H₁₀N₂O₃ – polární amid, bez náboje.',
			en: 'Gln · C₅H₁₀N₂O₃ – polar, uncharged amide side chain.'
		},
		image: `${PRINTABLES_MEDIA}/bb62eb48-21e0-4d2c-82e3-1a1df63eb88d/images/14409172_152b3d16-3d3d-42b6-92fd-5bd4e8d80521_03962a29-9148-462b-868a-3f3b983bb6d2/thumbs/inside/640x480/jpg/glutamine_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907589-glutamine-c5h10n2o3-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583208-glutamine-c5h10n2o3-multi-color-3d-molecule',
		editorQuery: 'L-glutamine'
	},
	{
		id: 'glycine',
		name: { cs: 'Glycin', en: 'Glycine' },
		description: {
			cs: 'Gly · C₂H₅NO₂ – nejjednodušší aminokyselina, jediná achirální.',
			en: 'Gly · C₂H₅NO₂ – the simplest amino acid and the only achiral one.'
		},
		image: `${PRINTABLES_MEDIA}/46361748-083e-4628-a2d1-e1249fc92026/images/14409183_cdc9306f-3f79-43fa-bf13-207f19a7201a_1cc339c8-b45d-4952-8dd5-c21d28cc3f4f/thumbs/inside/640x480/jpg/glycine_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907591-glycine-c2h5no2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583207-glycine-c2h5no2-multi-color-3d-molecule',
		editorQuery: 'glycine'
	},
	{
		id: 'histidine',
		name: { cs: 'Histidin', en: 'Histidine' },
		description: {
			cs: 'His · C₆H₉N₃O₂ – bazický imidazolový kruh.',
			en: 'His · C₆H₉N₃O₂ – basic imidazole ring.'
		},
		image: `${PRINTABLES_MEDIA}/94aacd21-f823-4007-af79-ca9dfd0410b1/images/14409520_828680c5-4905-430f-b022-4614a7df2cb1_dee03272-0d59-4490-9a8e-7ec12bffcbbf/thumbs/inside/640x480/jpg/histidine_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907618-histidine-c6h9n3o2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583250-histidine-c6h9n3o2-multi-color-3d-molecule',
		editorQuery: 'L-histidine'
	},
	{
		id: 'isoleucine',
		name: { cs: 'Isoleucin', en: 'Isoleucine' },
		description: {
			cs: 'Ile · C₆H₁₃NO₂ – nepolární, větvený alifatický řetězec.',
			en: 'Ile · C₆H₁₃NO₂ – nonpolar, branched aliphatic side chain.'
		},
		image: `${PRINTABLES_MEDIA}/93992012-eef1-4da2-ba2e-be6bfe90b0dd/images/14409545_95893338-d089-4250-924b-114d460dab15_f9fd0f08-2b44-400d-9cc7-6b581f90897e/thumbs/inside/640x480/jpg/isoleucine-1_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907620-isoleucine-c6h13no2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583248-isoleucine-c6h13no2-multi-color-3d-molecule',
		editorQuery: 'L-isoleucine'
	},
	{
		id: 'leucine',
		name: { cs: 'Leucin', en: 'Leucine' },
		description: {
			cs: 'Leu · C₆H₁₃NO₂ – nepolární, větvený alifatický řetězec.',
			en: 'Leu · C₆H₁₃NO₂ – nonpolar, branched aliphatic side chain.'
		},
		image: `${PRINTABLES_MEDIA}/128117bc-2c93-440f-885a-e84a1ea8c1a5/images/14409579_9b806bf9-9b4c-4bdb-9663-a7d157311457_974490d4-9354-420d-8e55-a3274ad50a37/thumbs/inside/640x480/jpg/leucine-1_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907624-leucine-c6h13no2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583247-leucine-c6h13no2-multi-color-3d-molecule',
		editorQuery: 'L-leucine'
	},
	{
		id: 'lysine',
		name: { cs: 'Lysin', en: 'Lysine' },
		description: {
			cs: 'Lys · C₆H₁₄N₂O₂ – bazický, kladně nabitý postranní řetězec.',
			en: 'Lys · C₆H₁₄N₂O₂ – basic, positively charged side chain.'
		},
		image: `${PRINTABLES_MEDIA}/73d69e93-c574-4493-9387-f261efbd8594/images/14409595_1e15c0c4-3709-4216-bcdb-700678de0eb1_3f72bb61-cd6d-437a-b34a-cf2d20f9c74b/thumbs/inside/640x480/jpg/lysine-2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907625-lysine-c6h14n2o2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583309-lysine-c6h14n2o2-multi-color-3d-molecule',
		editorQuery: 'L-lysine'
	},
	{
		id: 'methionine',
		name: { cs: 'Methionin', en: 'Methionine' },
		description: {
			cs: 'Met · C₅H₁₁NO₂S – nepolární, obsahuje síru; startovní aminokyselina translace.',
			en: 'Met · C₅H₁₁NO₂S – nonpolar, sulfur-containing; starts protein translation.'
		},
		image: `${PRINTABLES_MEDIA}/b8b74eae-ed19-47ee-be08-03d9962bb938/images/14438015_6902d3cc-4107-4113-9305-e33f54bb3159_b512aebc-1834-43d5-bd35-a3eace3efd96/thumbs/inside/640x480/jpg/methionine-3_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1910307-methionine-c5h11no2s-multi-color-3d-molecule-model',
		editorQuery: 'L-methionine'
	},
	{
		id: 'phenylalanine',
		name: { cs: 'Fenylalanin', en: 'Phenylalanine' },
		description: {
			cs: 'Phe · C₉H₁₁NO₂ – nepolární, aromatický benzenový kruh.',
			en: 'Phe · C₉H₁₁NO₂ – nonpolar, aromatic benzene ring.'
		},
		image: `${PRINTABLES_MEDIA}/b13b354b-52df-4fa5-a466-76beb67f135e/images/14409620_79a48f64-3d77-4284-9474-4eca82b0b2a9_cca6e7cc-7fb2-4561-9cb8-18c4a5ee083c/thumbs/inside/640x480/jpg/phenylalanine-2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907630-phenylalanine-c9h11no2-multi-color-3d-molecule-mod',
		makerworldUrl: 'https://makerworld.com/en/models/3583307-phenylalanine-c9h11no2-multi-color-3d-molecule',
		editorQuery: 'L-phenylalanine'
	},
	{
		id: 'proline',
		name: { cs: 'Prolin', en: 'Proline' },
		description: {
			cs: 'Pro · C₅H₉NO₂ – cyklický postranní řetězec, láme sekundární strukturu.',
			en: 'Pro · C₅H₉NO₂ – cyclic side chain that breaks secondary structure.'
		},
		image: `${PRINTABLES_MEDIA}/6371f3e2-2558-4349-8432-8e1e29405d6e/images/14409641_4a241055-4c34-4ff5-a66a-015bd7f07b5b_44de5c30-02ce-4c9f-8b3b-37a76d0ac986/thumbs/inside/640x480/jpg/proline-2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907632-proline-c5h9no2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583305-proline-c5h9no2-multi-color-3d-molecule',
		editorQuery: 'L-proline'
	},
	{
		id: 'selenocysteine',
		name: { cs: 'Selenocystein', en: 'Selenocysteine' },
		description: {
			cs: 'Sec · C₃H₇NO₂Se – „21. aminokyselina“ – obsahuje selen místo síry.',
			en: 'Sec · C₃H₇NO₂Se – the “21st amino acid” – selenium in place of sulfur.'
		},
		image: `${PRINTABLES_MEDIA}/be86bb78-cc2b-4b43-a828-594741c78754/images/14437982_4fdbaa42-c44c-4640-a246-588ede242ecf_2f620067-f7ff-4474-92bf-af96cd126880/thumbs/inside/640x480/jpg/selenocysteine-12_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1910305-selenocysteine-c3h7no2se-multi-color-3d-molecule-m',
		editorQuery: 'L-selenocysteine'
	},
	{
		id: 'serine',
		name: { cs: 'Serin', en: 'Serine' },
		description: {
			cs: 'Ser · C₃H₇NO₃ – polární, hydroxylová skupina.',
			en: 'Ser · C₃H₇NO₃ – polar hydroxyl side chain.'
		},
		image: `${PRINTABLES_MEDIA}/0667dda0-7e47-43de-a5d0-2e7f9d71ab51/images/14409694_0c32fe08-d78f-405e-8899-136c51de709a_7644cff9-0c97-4fb9-9b90-7ea57379fa62/thumbs/inside/640x480/jpg/serine-2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907636-serine-c3h7no3-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583306-serine-c3h7no3-multi-color-3d-molecule',
		editorQuery: 'L-serine'
	},
	{
		id: 'threonine',
		name: { cs: 'Threonin', en: 'Threonine' },
		description: {
			cs: 'Thr · C₄H₉NO₃ – polární, hydroxylová skupina.',
			en: 'Thr · C₄H₉NO₃ – polar hydroxyl side chain.'
		},
		image: `${PRINTABLES_MEDIA}/e7cee411-7cae-4b19-82e4-74f5e6005f23/images/14409711_e2b92c9a-3695-40dd-bb94-dc9b4ea6282d_dbb78d0c-9252-4998-a813-e9d3b9b4142e/thumbs/inside/640x480/jpg/threonine-1_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907638-threonine-c4h9no3-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583310-threonine-c4h9no3-multi-color-3d-molecule',
		editorQuery: 'L-threonine'
	},
	{
		id: 'tryptophan',
		name: { cs: 'Tryptofan', en: 'Tryptophan' },
		description: {
			cs: 'Trp · C₁₁H₁₂N₂O₂ – aromatický indolový kruh.',
			en: 'Trp · C₁₁H₁₂N₂O₂ – aromatic indole ring.'
		},
		image: `${PRINTABLES_MEDIA}/9980850a-3ba0-4fb2-a536-066c4be7573b/images/14409721_0db41866-7049-49ab-8df3-e8b2e6957e08_399790b8-891d-4742-83f8-21b085c8f9a7/thumbs/inside/640x480/jpg/tryptophan2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907640-tryptophan-c11h12n2o2-multi-color-3d-molecule-mode',
		makerworldUrl: 'https://makerworld.com/en/models/3583336-tryptophan-c11h12n2o2-multi-color-3d-molecule',
		editorQuery: 'L-tryptophan'
	},
	{
		id: 'tyrosine',
		name: { cs: 'Tyrosin', en: 'Tyrosine' },
		description: {
			cs: 'Tyr · C₉H₁₁NO₃ – aromatický, fenolová hydroxylová skupina.',
			en: 'Tyr · C₉H₁₁NO₃ – aromatic phenol side chain.'
		},
		image: `${PRINTABLES_MEDIA}/89f6e40d-81f1-4e63-846b-273c5740548b/images/14409735_533ca292-8c60-46d0-8369-294e0dfbecc2_96e71eee-e9b9-48e1-b84d-37b2a3b3c85c/thumbs/inside/640x480/jpg/tyrosine-2_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907641-tyrosine-c9h11no3-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583334-tyrosine-c9h11no3-multi-color-3d-molecule',
		editorQuery: 'L-tyrosine'
	},
	{
		id: 'valine',
		name: { cs: 'Valin', en: 'Valine' },
		description: {
			cs: 'Val · C₅H₁₁NO₂ – nepolární, větvený alifatický řetězec.',
			en: 'Val · C₅H₁₁NO₂ – nonpolar, branched aliphatic side chain.'
		},
		image: `${PRINTABLES_MEDIA}/80533d01-1c1f-4c51-9983-451a540f6796/images/14409756_403c881f-2611-4cf0-af4e-58b3fa424f8d_7e5680d8-9ad0-492e-86dd-5437919f32a6/thumbs/inside/640x480/jpg/valine-1_mw-4x3_promo.webp`,
		printablesUrl: 'https://www.printables.com/model/1907643-valine-c5h11no2-multi-color-3d-molecule-model',
		makerworldUrl: 'https://makerworld.com/en/models/3583345-valine-c5h11no2-multi-color-3d-molecule',
		editorQuery: 'L-valine'
	}
];

import type { LocaleContent } from './types';

const siteName = '分子 3D 打印';

export const zh: LocaleContent = {
	seo: {
		siteName,
		alternateName: '3D Printing Molecules',
		author: '布拉格化工大学（UCT Prague）、查理大学第一医学院',
		ogImageAlt: '分子 3D 打印网页应用界面，用于生成 3MF 和 STL 分子模型',
		orgUct: '布拉格化工大学（UCT Prague）',
		orgLf1: '查理大学第一医学院',
		home: {
			title: '分子 3D 打印 – 免费将 PubChem、PDB 和 CIF 转换为 3MF/STL',
			description:
				'由布拉格化工大学与查理大学开发的免费网页应用：可视化来自 PubChem、PDB、COD、SDF 和 CIF 的分子，并将其转换为可 3D 打印的多色 3MF 和 STL 模型。',
			keywords:
				'分子 3D 打印, 3D 打印分子模型, PubChem 转 STL, PDB 转 3MF, CIF 转 STL, 多色分子模型, 化学教学模型, 分子模型 STL 下载, PrusaSlicer, Bambu Studio',
			sharedOgTitle: (molecule) => `${molecule} – 可 3D 打印的分子模型 | ${siteName}`,
			featureList: [
				'从 PubChem、RCSB PDB 和晶体学开放数据库（COD）导入分子结构',
				'上传自己的 .sdf、.pdb 和 .cif 文件',
				'导出多色 .3MF 和多部件 .STL',
				'Spheres（空间填充）、Split for Gluing（拆分粘合）、Ball-and-Stick（球棍）、Moving Joints（免组装活动关节）、Sticks（棒状）和 Minecraft 模式',
				'一键直接在 PrusaSlicer、Bambu Studio、OrcaSlicer 和 Ultimaker Cura 中打开'
			]
		},
		tutorials: {
			title: '教程：如何准备并 3D 打印分子模型 | 分子 3D 打印',
			description:
				'分步指南：从 PubChem、PDB、COD 或 SDF/CIF 文件导入分子，调整 3D 表示方式，并为切片软件导出多色 3MF/STL 模型。',
			keywords:
				'如何 3D 打印分子, 分子模型教程, 多色 3MF 切片指南, PrusaSlicer 多部件对象, Bambu Studio 打印分子',
			howToName: '如何准备用于 3D 打印的分子模型',
			steps: [
				{
					name: '选择或上传分子',
					text: '在 PubChem、PDB 或 COD 中搜索化合物，或上传自己的 .sdf、.pdb 或 .cif 文件。'
				},
				{
					name: '选择表示方式和设置',
					text: '选择模型样式（Spheres、Split for Gluing、Ball-and-Stick、Moving Joints、Sticks），并调整比例、网格质量或化学键直径。'
				},
				{
					name: '导出为 3MF 或 STL 并切片',
					text: '下载彩色 .3MF 文件或包含各个 STL 部件的 ZIP，并将模型作为多部件对象导入 3D 切片软件。'
				}
			],
			breadcrumb: '教程'
		},
		about: {
			title: '关于项目 – 布拉格化工大学与查理大学 | 分子 3D 打印',
			description:
				'布拉格化工大学与查理大学的学术合作项目，让教师、学生和研究人员能够快速、便捷地多色 3D 打印分子模型。',
			keywords: '布拉格化工大学, 查理大学, 化学教育 3D 打印, 分子教具, 学术开源工具',
			breadcrumb: '关于'
		},
		examples: {
			title: `3D 打印分子模型 – 免费下载 STL 和 3MF | ${siteName}`,
			description:
				'3D 打印分子模型展示：肾上腺素、ATP、葡萄糖、靛蓝、杯芳烃、穴醚和 TRK 激酶。可从 Printables 和 MakerWorld 免费下载文件。',
			keywords:
				'3D 打印分子, 分子模型 STL 下载, 分子模型 3MF, 可打印分子模型, Printables 分子, MakerWorld 分子'
		},
		demonstrations: {
			title: `示例 | ${siteName}`,
			description: '3D 打印分子模型示例。',
			keywords: '分子 3D 打印, 示例'
		}
	},
	faq: [
		{
			question: '支持哪些分子数据库和文件格式？',
			answer:
				'您可以按名称、CID 或 CAS 号直接在 PubChem 中搜索分子，按 4 位条目 ID 在 RCSB PDB 中搜索，或按晶体 ID 在晶体学开放数据库（COD）中搜索。也可以上传自己的 .sdf、.pdb 和 .cif 结构文件。'
		},
		{
			question: '如何打印多色分子模型？',
			answer:
				'对于多材料 3D 打印机（AMS、MMU、换头系统），可直接导出带有预设 CPK 原子配色和多部件几何体的 .3MF 文件。对于没有多色硬件的单喷头打印机，请选择 Spheres SPLIT FOR GLUING（拆分粘合）模式，生成可单独打印、再粘合在一起的封闭（水密）部件，并可选用 1.75 mm 耗材作为定位销。'
		},
		{
			question: '支持哪些 3D 打印切片软件？',
			answer:
				'导出的 .3MF 和 .STL 文件可直接用于 PrusaSlicer、Bambu Studio、OrcaSlicer 和 Ultimaker Cura。您还可以通过内置的「切片」按钮直接在桌面切片软件中打开模型。'
		},
		{
			question: '分子 3D 打印可以免费用于教学和科研吗？',
			answer:
				'可以。本网页应用由布拉格化工大学和查理大学第一医学院开发，教师、学生、研究人员和创客均可完全免费使用，无需注册账号。'
		}
	],
	gallery: {
		heading: '3D 打印分子模型',
		intro:
			'这些是我们用本应用准备并打印出来的分子。可从 Printables 或 MakerWorld 免费下载可直接打印的 3MF 和 STL 文件，也可以在我们的网页应用中自行调整并生成模型。',
		channels: '完整合集见我们的主页',
		aminoHeading: '氨基酸',
		aminoMeta: (n) => `${n} 种蛋白质氨基酸 · 多色打印`,
		aminoIntro: '包括硒代半胱氨酸在内的全套蛋白质氨基酸，已为多色打印准备好（按元素着色）。',
		searchLabel: '搜索模型',
		searchPlaceholder: '搜索分子…（例如 glycine、ATP、Trp）',
		searchClear: '清除搜索',
		searchResults: (n) => `找到 ${n} 个模型`,
		searchEmpty: '没有与搜索匹配的打印模型。',
		ctaHeading: '没有找到想要的分子？',
		ctaText: '几秒钟内即可从 PubChem、PDB 或 COD 生成您自己的模型。',
		ctaButton: '打开生成器'
	},
	modelCard: {
		openEditor: '在应用中编辑',
		photoAlt: '3D 打印的分子模型',
		makerworldPending: 'MakerWorld 即将上线'
	},
	models: {
		adrenaline: {
			name: '肾上腺素',
			description: '这种参与「战斗或逃跑」反应的激素和神经递质的球棍模型。'
		},
		'trk-kinase': {
			name: 'TRK 受体激酶与靶向抑制剂',
			description: '配体–蛋白质结合模型：活性位点中结合了抑制剂的 TRK 激酶。'
		},
		atp: {
			name: 'ATP（腺苷三磷酸）',
			description: '细胞的通用能量载体——带有三个磷酸基团的核苷酸。'
		},
		glucose: {
			name: '葡萄糖',
			description: '最基本的糖，也是生物体的主要能量来源。'
		},
		indigo: {
			name: '靛蓝',
			description: '历史悠久的蓝色染料，至今仍用于牛仔布染色。'
		},
		calixarene: {
			name: '杯芳烃',
			description: '杯状大环化合物——超分子化学的经典实例。'
		},
		'cryptand-222': {
			name: '[2.2.2]-穴醚（Crypt-222）',
			description: '一种双环配体，能将金属阳离子紧密包裹在其空腔内。'
		},
		alanine: { name: '丙氨酸', description: 'Ala · C₃H₇NO₂ – 非极性脂肪族侧链。' },
		arginine: { name: '精氨酸', description: 'Arg · C₆H₁₄N₄O₂ – 碱性、带正电荷的侧链。' },
		asparagine: { name: '天冬酰胺', description: 'Asn · C₄H₈N₂O₃ – 极性、不带电荷的酰胺侧链。' },
		'aspartic-acid': {
			name: '天冬氨酸',
			description: 'Asp · C₄H₇NO₄ – 酸性、带负电荷的侧链。'
		},
		cysteine: { name: '半胱氨酸', description: 'Cys · C₃H₇NO₂S – 极性巯基，可形成二硫键。' },
		'glutamic-acid': {
			name: '谷氨酸',
			description: 'Glu · C₅H₉NO₄ – 酸性、带负电荷的侧链。'
		},
		glutamine: { name: '谷氨酰胺', description: 'Gln · C₅H₁₀N₂O₃ – 极性、不带电荷的酰胺侧链。' },
		glycine: {
			name: '甘氨酸',
			description: 'Gly · C₂H₅NO₂ – 最简单的氨基酸，也是唯一没有手性的氨基酸。'
		},
		histidine: { name: '组氨酸', description: 'His · C₆H₉N₃O₂ – 碱性咪唑环。' },
		isoleucine: { name: '异亮氨酸', description: 'Ile · C₆H₁₃NO₂ – 非极性、带支链的脂肪族侧链。' },
		leucine: { name: '亮氨酸', description: 'Leu · C₆H₁₃NO₂ – 非极性、带支链的脂肪族侧链。' },
		lysine: { name: '赖氨酸', description: 'Lys · C₆H₁₄N₂O₂ – 碱性、带正电荷的侧链。' },
		methionine: {
			name: '甲硫氨酸',
			description: 'Met · C₅H₁₁NO₂S – 非极性、含硫；蛋白质翻译的起始氨基酸。'
		},
		phenylalanine: { name: '苯丙氨酸', description: 'Phe · C₉H₁₁NO₂ – 非极性芳香苯环。' },
		proline: { name: '脯氨酸', description: 'Pro · C₅H₉NO₂ – 环状侧链，会破坏二级结构。' },
		selenocysteine: {
			name: '硒代半胱氨酸',
			description: 'Sec · C₃H₇NO₂Se – “第 21 种氨基酸”——以硒取代硫。'
		},
		serine: { name: '丝氨酸', description: 'Ser · C₃H₇NO₃ – 极性羟基侧链。' },
		threonine: { name: '苏氨酸', description: 'Thr · C₄H₉NO₃ – 极性羟基侧链。' },
		tryptophan: { name: '色氨酸', description: 'Trp · C₁₁H₁₂N₂O₂ – 芳香吲哚环。' },
		tyrosine: { name: '酪氨酸', description: 'Tyr · C₉H₁₁NO₃ – 芳香酚侧链。' },
		valine: { name: '缬氨酸', description: 'Val · C₅H₁₁NO₂ – 非极性、带支链的脂肪族侧链。' }
	}
};

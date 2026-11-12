import type { LocaleContent } from './types';

const siteName = '分子の3Dプリント';

export const ja: LocaleContent = {
	seo: {
		siteName,
		alternateName: '3D Printing Molecules',
		author: 'プラハ化学技術大学（UCT Prague）、カレル大学第一医学部',
		ogImageAlt: '3MF・STL 分子モデルを生成するウェブアプリ「分子の3Dプリント」の画面',
		orgUct: 'プラハ化学技術大学（UCT Prague）',
		orgLf1: 'カレル大学第一医学部',
		home: {
			title: '分子の3Dプリント – PubChem・PDB・CIF から 3MF/STL を生成する無料ツール',
			description:
				'プラハ化学技術大学とカレル大学による無料ウェブアプリ。PubChem、PDB、COD、SDF、CIF の分子を可視化し、マルチカラー3Dプリント用の 3MF・STL モデルに変換します。',
			keywords:
				'分子模型 3Dプリント, 分子 3Dプリント, PubChem STL 変換, PDB 3MF 変換, CIF STL 変換, マルチカラー 分子模型, 化学 教材 模型, 分子模型 作り方, PrusaSlicer, Bambu Studio',
			sharedOgTitle: (molecule) => `${molecule} – 3Dプリント用分子モデル | ${siteName}`,
			featureList: [
				'PubChem、RCSB PDB、Crystallography Open Database（COD）から分子構造をインポート',
				'独自の .sdf、.pdb、.cif ファイルをアップロード',
				'マルチカラー .3MF とマルチパーツ .STL の出力',
				'Spheres（空間充填）、Split for Gluing（接着用分割）、Ball-and-Stick（球棒）、プリント・イン・プレイスの Moving Joints（可動ジョイント）、Sticks（棒）、Minecraft の各モード',
				'PrusaSlicer、Bambu Studio、OrcaSlicer、Ultimaker Cura でワンクリックで直接開く'
			]
		},
		tutorials: {
			title: 'チュートリアル：分子模型を準備して3Dプリントする方法 | 分子の3Dプリント',
			description:
				'PubChem、PDB、COD、SDF/CIF ファイルから分子をインポートし、3D表示を調整して、スライサー用のマルチカラー 3MF/STL モデルを出力するまでのステップごとのガイドです。',
			keywords:
				'分子 3Dプリント 方法, 分子模型 チュートリアル, マルチカラー 3MF スライサー, PrusaSlicer マルチパーツ, Bambu Studio 分子 印刷',
			howToName: '分子模型を3Dプリント用に準備する方法',
			steps: [
				{
					name: '分子を選択またはアップロード',
					text: 'PubChem、PDB、COD で化合物を検索するか、ご自身の .sdf、.pdb、.cif ファイルをアップロードします。'
				},
				{
					name: '表示方法と設定を選択',
					text: 'モデルのスタイル（Spheres、Split for Gluing、Ball-and-Stick、Moving Joints、Sticks）を選び、縮尺、メッシュ品質、結合の太さを調整します。'
				},
				{
					name: '3MF または STL に出力してスライス',
					text: '色付きの .3MF ファイル、または個別の STL パーツを含む ZIP をダウンロードし、マルチパーツオブジェクトとしてスライサーにインポートします。'
				}
			],
			breadcrumb: 'チュートリアル'
		},
		about: {
			title: 'プロジェクトについて – プラハ化学技術大学とカレル大学 | 分子の3Dプリント',
			description:
				'プラハ化学技術大学とカレル大学の共同学術プロジェクト。教育者、学生、研究者が分子模型をすばやく手軽にマルチカラー3Dプリントできるようにします。',
			keywords:
				'プラハ化学技術大学, カレル大学, 化学教育 3Dプリント, 分子模型 教材, 学術 オープンソース ツール',
			breadcrumb: '概要'
		},
		examples: {
			title: `3Dプリントした分子模型 – STL・3MF 無料ダウンロード | ${siteName}`,
			description:
				'3Dプリントした分子模型のギャラリー：アドレナリン、ATP、グルコース、インジゴ、カリックスアレーン、クリプタンド、TRK キナーゼ。Printables と MakerWorld から無料でダウンロードできます。',
			keywords:
				'3Dプリント 分子, 分子 STL ダウンロード, 分子模型 3MF, 分子模型 データ 無料, Printables 分子, MakerWorld 分子'
		},
		demonstrations: {
			title: `作例 | ${siteName}`,
			description: '3Dプリントした分子模型の作例。',
			keywords: '分子 3Dプリント, 作例'
		}
	},
	faq: [
		{
			question: 'どの分子データベースとファイル形式に対応していますか？',
			answer:
				'PubChem からは化合物名（英語）、CID、CAS 番号で、RCSB PDB からは4文字のエントリ ID で、Crystallography Open Database（COD）からは結晶 ID で分子を直接検索できます。独自の .sdf、.pdb、.cif 構造ファイルをアップロードすることもできます。'
		},
		{
			question: 'マルチカラーの分子模型はどうやって印刷しますか？',
			answer:
				'マルチマテリアル対応の3Dプリンター（AMS、MMU、ツールチェンジャー）では、CPK 配色の原子色とマルチパーツ形状を割り当て済みの .3MF に直接出力してください。マルチカラー機構のない単一エクストルーダーのプリンターでは、Spheres SPLIT FOR GLUING モードを選ぶと、接着用の水密パーツを個別に生成できます。位置合わせ用に 1.75 mm フィラメントのピンを使うこともできます。'
		},
		{
			question: 'どのスライサーに対応していますか？',
			answer:
				'出力した .3MF と .STL ファイルは、PrusaSlicer、Bambu Studio、OrcaSlicer、Ultimaker Cura でそのまま使えます。内蔵の「スライス」ボタンから、デスクトップのスライサーでモデルを直接開くこともできます。'
		},
		{
			question: '教育・研究目的で無料で使えますか？',
			answer:
				'はい。プラハ化学技術大学とカレル大学第一医学部が開発したこのウェブアプリは完全に無料で、アカウント登録も不要です。教育者、学生、研究者、メイカーの皆さまにご利用いただけます。'
		}
	],
	gallery: {
		heading: '3Dプリントした分子模型',
		intro:
			'このアプリで準備して印刷した分子です。すぐに印刷できる 3MF・STL ファイルを Printables または MakerWorld から無料でダウンロードできます。また、ウェブアプリでモデルを調整して自分で生成することもできます。',
		channels: '全コレクションは各プロフィールで',
		aminoHeading: 'アミノ酸',
		aminoMeta: (n) => `タンパク質を構成するアミノ酸 ${n} 種 · マルチカラー印刷`,
		aminoIntro:
			'セレノシステインを含む、タンパク質を構成するアミノ酸の全セット。マルチカラー印刷用に準備しています（元素ごとに色分け）。',
		searchLabel: 'モデルを検索',
		searchPlaceholder: '分子を検索…（例：グリシン、ATP、Trp）',
		searchClear: '検索をクリア',
		searchResults: (n) => `${n} 件のモデルが見つかりました`,
		searchEmpty: '検索に一致する印刷モデルはありません。',
		ctaHeading: 'お探しの分子がありませんか？',
		ctaText: 'PubChem、PDB、COD から数秒で独自のモデルを生成できます。',
		ctaButton: 'ジェネレーターを開く'
	},
	modelCard: {
		openEditor: 'アプリで編集',
		photoAlt: '3Dプリントした分子模型',
		makerworldPending: 'MakerWorld 近日公開'
	},
	models: {
		adrenaline: {
			name: 'アドレナリン（エピネフリン）',
			description: '「闘争・逃走反応」に関わるホルモン・神経伝達物質の球棒モデル。'
		},
		'trk-kinase': {
			name: 'TRK 受容体キナーゼと分子標的阻害剤',
			description: 'リガンドとタンパク質の結合モデル – 活性部位に阻害剤が結合した TRK キナーゼ。'
		},
		atp: {
			name: 'ATP（アデノシン三リン酸）',
			description: '細胞の普遍的なエネルギー担体 – 3つのリン酸基を持つヌクレオチド。'
		},
		glucose: {
			name: 'グルコース',
			description: '基本的な糖であり、生物の主要なエネルギー源。'
		},
		indigo: {
			name: 'インジゴ',
			description: '現在もデニムの染色に使われている歴史ある青色染料。'
		},
		calixarene: {
			name: 'カリックスアレーン',
			description: '杯の形をした大環状化合物 – 超分子化学の代表例。'
		},
		'cryptand-222': {
			name: '[2.2.2]クリプタンド（Crypt-222）',
			description: '金属カチオンを空洞内にしっかりと取り込む二環式配位子。'
		},
		alanine: {
			name: 'アラニン',
			description: 'Ala · C₃H₇NO₂ – 非極性の脂肪族側鎖。'
		},
		arginine: {
			name: 'アルギニン',
			description: 'Arg · C₆H₁₄N₄O₂ – 塩基性で正に帯電した側鎖。'
		},
		asparagine: {
			name: 'アスパラギン',
			description: 'Asn · C₄H₈N₂O₃ – 極性で電荷を持たないアミド側鎖。'
		},
		'aspartic-acid': {
			name: 'アスパラギン酸',
			description: 'Asp · C₄H₇NO₄ – 酸性で負に帯電した側鎖。'
		},
		cysteine: {
			name: 'システイン',
			description: 'Cys · C₃H₇NO₂S – ジスルフィド結合を形成する極性のチオール基。'
		},
		'glutamic-acid': {
			name: 'グルタミン酸',
			description: 'Glu · C₅H₉NO₄ – 酸性で負に帯電した側鎖。'
		},
		glutamine: {
			name: 'グルタミン',
			description: 'Gln · C₅H₁₀N₂O₃ – 極性で電荷を持たないアミド側鎖。'
		},
		glycine: {
			name: 'グリシン',
			description: 'Gly · C₂H₅NO₂ – 最も単純なアミノ酸で、唯一キラルでないアミノ酸。'
		},
		histidine: {
			name: 'ヒスチジン',
			description: 'His · C₆H₉N₃O₂ – 塩基性のイミダゾール環。'
		},
		isoleucine: {
			name: 'イソロイシン',
			description: 'Ile · C₆H₁₃NO₂ – 非極性で分岐した脂肪族側鎖。'
		},
		leucine: {
			name: 'ロイシン',
			description: 'Leu · C₆H₁₃NO₂ – 非極性で分岐した脂肪族側鎖。'
		},
		lysine: {
			name: 'リシン',
			description: 'Lys · C₆H₁₄N₂O₂ – 塩基性で正に帯電した側鎖。'
		},
		methionine: {
			name: 'メチオニン',
			description: 'Met · C₅H₁₁NO₂S – 非極性で硫黄を含む。タンパク質翻訳の開始アミノ酸。'
		},
		phenylalanine: {
			name: 'フェニルアラニン',
			description: 'Phe · C₉H₁₁NO₂ – 非極性で芳香族のベンゼン環。'
		},
		proline: {
			name: 'プロリン',
			description: 'Pro · C₅H₉NO₂ – 二次構造を壊す環状の側鎖。'
		},
		selenocysteine: {
			name: 'セレノシステイン',
			description: 'Sec · C₃H₇NO₂Se – 「21番目のアミノ酸」– 硫黄の代わりにセレンを含む。'
		},
		serine: {
			name: 'セリン',
			description: 'Ser · C₃H₇NO₃ – 極性のヒドロキシ基を持つ側鎖。'
		},
		threonine: {
			name: 'トレオニン',
			description: 'Thr · C₄H₉NO₃ – 極性のヒドロキシ基を持つ側鎖。'
		},
		tryptophan: {
			name: 'トリプトファン',
			description: 'Trp · C₁₁H₁₂N₂O₂ – 芳香族のインドール環。'
		},
		tyrosine: {
			name: 'チロシン',
			description: 'Tyr · C₉H₁₁NO₃ – 芳香族のフェノール側鎖。'
		},
		valine: {
			name: 'バリン',
			description: 'Val · C₅H₁₁NO₂ – 非極性で分岐した脂肪族側鎖。'
		}
	}
};

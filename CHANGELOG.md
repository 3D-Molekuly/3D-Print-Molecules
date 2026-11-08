# Vývoj projektu 3D Tisk Molekul

Přehled toho, jak se projekt vyvíjel a kdy přibyly jednotlivé funkce: od prvního skriptu pro PyMOL (2023) přes desktopové aplikace v Pythonu až po současnou webovou aplikaci.

- **Python verze (2023–2024):** [KubiV/3D-Print-Molecules](https://github.com/KubiV/3D-Print-Molecules)
- **Webová aplikace (od 2024):** tento repozitář

[← Zpět na README](README.md)

---

## Fáze 1: Python skripty a desktopové aplikace (2023–2024)

### Říjen 2023: version0, skript pro PyMOL
- **První skript** `MultiMaterial_STL_Molecules.py`: po zadání **PubChem CID** stáhne strukturu, nechá ji vykreslit v **PyMOL** a exportuje **samostatné STL pro atomy C, O, H, N** plus STL celé molekuly.
- Převody formátů přes **Open Babel** (SDF → PDB, SMILES → PDB).
- Výstup se importoval do **PrusaSlicer** jako „Multi part object“ a každá část dostala vlastní barvu filamentu.
- **Balení výstupu do ZIP.**
- **Načtení struktury podle PDB kódu**, nejen podle PubChem CID.
- Pomocné pokusné skripty: povrch proteinu do STL, oprava STL, převod WRL → STP, vyhledávání v PDB, webový vyhledávač CID.

### Říjen–listopad 2023: version1, první GUI (tkinter)
- **Návrhy GUI** a **první verze grafického rozhraní** v tkinter.
- **Otevření výsledku ve sliceru** přímo z aplikace.
- **Vyhledávání molekuly přímo podle CID.**
- **Generování do dočasných souborů.**
- **Volba operačního systému** (cesty k PyMOL a Open Babel pro macOS a Windows).
- **Načtení vlastního PDB souboru.**
- **Vyhledávání PDB kódu v GUI.**
- **Výběr výstupní složky.**
- Příprava jednosouborového programu (setup.py, `.spec`) a **dialog pro instalaci závislostí**.

### Prosinec 2023 – září 2024: version2, vlastní generátor geometrie (PyQt5)
- **Nové jádro bez PyMOL:** koule atomů se generují přímo v Pythonu (numpy, numpy-stl) z vlastního parseru PDB a SDF.
- **Vyhledávání pomocí regulárních výrazů** a **tabulka s údaji o molekule z PubChem**.
- **Nové rozhraní v PyQt5** (návrh v Qt Designeru).
- **Export do ZIP.**
- **Ochrana proti velkým souborům:** u velkých proteinů se automaticky sníží kvalita.
- Oprava molekul, které mají v PubChem jen 2D strukturu.
- **Sestavení spustitelné aplikace přes PyInstaller** pro macOS a Windows.
- **Vyhledávání podle CAS čísla.**
- **Zapínání a vypínání vodíků** a jejich generování.
- **Okno nastavení** uložené v JSON, včetně **faktoru poloměru atomů**.
- Nové hlavní okno a **výpočty v pracovním vlákně** (worker thread), aby GUI nezamrzalo.

---

## Fáze 2: Webová aplikace (od září 2024)

### Září 2024: základ webu
- **Založení webové aplikace** ve SvelteKit.
- **Podpora více jazyků** (čeština a angličtina) a přepínání jazyka na všech stránkách.
- Rozvržení stránky, prohlížeč, písma, patička.

### Říjen 2024: vstupy a 3D náhled
- **Zpracování vstupu** (název, CID, kód) a **parser PDB**.
- **3D vizualizace molekuly** (Three.js) a jeho vylepšení.
- **Historie vyhledávání.**
- **Drag & drop** souborů do aplikace.
- Lepší zobrazení chyb a formátování tabulek.

### Listopad 2024: mobilní zařízení
- **Oprava nahrávání souborů na iOS.**
- **Sbalitelné menu.**
- **Tlačítka pro mazání** (historie, načtené soubory).

### Prosinec 2024: export a PWA
- **Výběr reprezentace modelu.**
- **Zapínání a vypínání vodíků.**
- **Stažení celé molekuly**, **STL pro jednotlivé atomy** a **ZIP se všemi díly**.
- **Tmavý režim.**
- **Informační tlačítko a infobox** s nápovědou.
- **Metadata** a smysluplné názvy stahovaných souborů.
- **PWA:** aplikaci lze nainstalovat a funguje i offline (service worker).
- **Nový parser SDF.**

### Leden–březen 2025
- **Reprezentace Ball-and-Stick** (kuličky a tyčinky).
- **Obrázek molekuly** (2D náhled).
- Lepší chování okna s 3D náhledem.
- **Šablona pro stažení.**
- **Podpora článků v Markdownu**, včetně načítání z URL.

### Červenec–říjen 2025
- **Upozornění, když chybí data molekuly.**
- **Opravený Ball-and-Stick:** vazby rozdělené na poloviny podle barvy atomů.
- **Vazby jako samostatná skupina** (Group Bonds Separately).
- **Tlačítko pro obnovení výchozího nastavení.**
- **Jednotný průměr atomů** a **ukládání nastavení** mezi návštěvami.
- **Reprezentace Sticks** (jen tyčinky).
- **Našeptávání názvů z PubChem.**
- **Násobné vazby** (dvojné, trojné) v Ball-and-Stick.
- **Okno pokročilého vyhledávání** a **podpora formátu .CIF** (krystalové struktury).
- **Název molekuly v metadatech.**
- **Stránka O projektu** a nové rozvržení.
- Samostatné nastavení **multiplikačního faktoru** vazeb.

### Červenec 2026
- **Stránka Návody (Tutorials)** v CZ i EN: postup tisku v 5 krocích s obrázky a ukázky vlivu nastavení (kvalita koulí, průměr vazeb, multiplicita vazeb, skupiny, jednotná barva).

### Září 2026
- **Lepší lokalizace:** jazyk se určuje na serveru a v hlavičce je přepínač jazyka.
- **Sekce Printables** v návodech.

### Říjen 2026
- **Export do barevného .3MF** s metadaty a automaticky přiřazenými CPK barvami. Jako záloha zůstává **ZIP se samostatnými STL**.
- **Sitemap.xml.**
- **Otočné klouby (Ball-and-Stick MOVING JOINTS, BETA):**
  - print-in-place klouby přímo ve vazbách molekuly;
  - předvolby FDM a SLA/MSLA, měřítko (mm/Å), vůle a poloha kloubu na vazbě;
  - volba vynechat koncové vazby a volba kloubů v kruzích;
  - pokročilé parametry (R, rs, rh, krk, stěna, přesah rotoru, segmenty);
  - SVG schéma řezu kloubem, statistiky a varování vyrobitelnosti;
  - stažení testovacího kloubu jako STL a návod k tisku.
- **Otevření ve sliceru:** tlačítka pro PrusaSlicer, OrcaSlicer, Ultimaker Cura a Bambu Studio, k tomu API endpoint `/api/slicer`.
- **Koule rozdělené pro lepení (Spheres SPLIT FOR GLUING, BETA):**
  - každý atom je samostatné vodotěsné (manifold) těleso pro vícebarevný tisk bez AMS/MMU;
  - režim A (radikální roviny) a režim B (odečítání podle priority prvků);
  - nastavitelná vůle (gap), spojení sousedních atomů stejného prvku a díry pro kolík z filamentu 1,75 mm;
  - export „složeno“ nebo „rozloženo na podložku“, rozložený náhled (exploded view) a popisky dílů;
  - výpočet běží ve **Web Workeru** a ukazuje průběh.
- Lepší vykreslení popisků dílů a nastavení pořizování snímku.

### Listopad 2026
- **Pokročilé vyhledávání** se záložkami:
  - PubChem: název, CID nebo CAS;
  - PDB / Ligandy: CCD kódy i celé PDB struktury;
  - SMILES → 3D (Cactus);
  - COD (krystaly).
- **Sdílení přes URL:** odkaz nese model i nastavení a tlačítko Sdílet ho zkopíruje do schránky.
- **Ovládání 3D náhledu:**
  - vycentrování dvojklikem, automatické otáčení, zobrazení tiskové podložky 250 × 210 mm;
  - přepínání světlého a tmavého pozadí, snímek s průhledným pozadím, celá obrazovka;
  - rozměry modelu s varováním, když přesahuje tiskový prostor;
  - interaktivní legenda pro skrývání skupin;
  - prázdný stav s ukázkami (kofein, aspirin, voda).
- **API pro externí struktury** (`/api/external-structure`).
- **SEO:** meta a OG tagy, úvodní sekce s FAQ, `robots.txt`, přesměrování 301 u stránky demonstrations a rozšířené stránky O projektu.
- **Kreslení molekul (Kekule.js):**
  - editor strukturního vzorce s vazbami, kruhy, prvky, zpět/znovu a gumou;
  - převod nakreslené molekuly do 3D, při offline režimu lokálně přes OpenBabel.
- **Offline režim:** vylepšený service worker (cache) a upozornění, že vyhledávání potřebuje internet.
- **Nahrávání do Vercel Blob** (`/api/slicer/upload`) s automatickým mazáním po expiraci.
- **PrusaSlicer plugin** s CPK párováním filamentů, importem V3000 a dvojjazyčným menu. Přesunul se do samostatného repozitáře a na webu na něj odkazuje nová komponenta.
- **Import ChemDraw souborů (.cdx, .cdxml)** převodem na molfile a lepší detekce formátu souborů.
- **Vyhledávání podle vzorce** (např. H2O, H2SO4) se seznamem odpovídajících sloučenin a **rozpoznávání SMILES** přímo ve vyhledávání.
- **Výběr 3D konformeru z PubChem** s energiemi MMFF94.
- **Fonty hostované přímo na webu**, optimalizace načítání stránky a oprava loga v tmavém režimu.

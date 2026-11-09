// Client-only helpers around Kekule.js for the "Draw" tab of the advanced search dialog.
// Kekule needs DOM + canvas, so it is only ever loaded through a dynamic import in the browser.

// Kekule ships without TypeScript types; its namespace is used dynamically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KekuleNS = any;

/** Base URL where vite.config.ts copies OpenBabel (WASM) + Kekule's worker script. */
const OPENBABEL_BASE_URL = '/kekule/extra/';

/** Id of the custom interaction controller registered by {@link registerElementTool}. */
export const ELEMENT_TOOL_ID = 'PmElementIaController';

/** Id of the custom interaction controller registered by {@link registerTemplateTool}. */
export const TEMPLATE_TOOL_ID = 'PmRingTemplateIaController';

/**
 * A monocyclic ring template: `atoms[i]` is bonded to `atoms[(i + 1) % n]` with order `bonds[i]`.
 * Aromatic rings are given in a Kekulé form so every writer (SMILES, molfile) understands them.
 */
export interface RingTemplate {
  atoms: string[];
  bonds: number[];
}

export const RING_TEMPLATES: Record<string, RingTemplate> = {
  pyridine: { atoms: ['N', 'C', 'C', 'C', 'C', 'C'], bonds: [2, 1, 2, 1, 2, 1] },
  pyrimidine: { atoms: ['N', 'C', 'N', 'C', 'C', 'C'], bonds: [2, 1, 2, 1, 2, 1] },
  piperidine: { atoms: ['N', 'C', 'C', 'C', 'C', 'C'], bonds: [1, 1, 1, 1, 1, 1] },
  morpholine: { atoms: ['N', 'C', 'C', 'O', 'C', 'C'], bonds: [1, 1, 1, 1, 1, 1] },
  pyrrole: { atoms: ['N', 'C', 'C', 'C', 'C'], bonds: [1, 2, 1, 2, 1] },
  furan: { atoms: ['O', 'C', 'C', 'C', 'C'], bonds: [1, 2, 1, 2, 1] },
  thiophene: { atoms: ['S', 'C', 'C', 'C', 'C'], bonds: [1, 2, 1, 2, 1] },
  imidazole: { atoms: ['N', 'C', 'N', 'C', 'C'], bonds: [1, 2, 1, 2, 1] }
};

let kekulePromise: Promise<KekuleNS> | null = null;

/** Lazily loads Kekule (and its widget theme) in the browser. Safe to call repeatedly. */
export function loadKekule(): Promise<KekuleNS> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kekule.js can only be loaded in the browser.'));
  }
  if (!kekulePromise) {
    kekulePromise = (async () => {
      const [mod] = await Promise.all([import('kekule'), import('kekule/theme')]);
      const Kekule = mod.Kekule;
      Kekule.environment.setEnvVar('openbabel.path', OPENBABEL_BASE_URL);
      Kekule.environment.setEnvVar('openbabel.scriptSrc', `${OPENBABEL_BASE_URL}openbabel.js`);
      registerElementTool(Kekule, mod.Class);
      registerTemplateTool(Kekule, mod.Class);
      patchSmilesBracketHydrogens(Kekule);
      return Kekule;
    })().catch((err) => {
      kekulePromise = null;
      throw err;
    });
  }
  return kekulePromise;
}

/**
 * Registers an interaction controller that places atoms of a chosen element:
 * clicking an existing atom changes its element, clicking blank space adds a new atom.
 * (Kekule's own atom tool opens a text/periodic-table popup instead.)
 */
function registerElementTool(Kekule: KekuleNS, Class: KekuleNS) {
  if (Kekule.Editor[ELEMENT_TOOL_ID]) return;

  const ElementController = Class.create(Kekule.Editor.MolAtomIaController, {
    CLASS_NAME: `Kekule.Editor.${ELEMENT_TOOL_ID}`,
    elementSymbol: 'C',
    react_pointerup(this: KekuleNS, e: KekuleNS) {
      if (e.getButton() !== Kekule.X.Event.MouseButton.LEFT) return;
      const editor = this.getEditor();
      const symbol: string = this.elementSymbol || 'C';
      editor.setSelection(null);
      const coord = this._getEventMouseCoord(e);
      const obj = this.getTopmostInteractableObjAtScreenCoord(coord);

      if (obj && this.isValidNode(obj)) {
        e.preventDefault();
        e.stopPropagation();
        if (obj.getSymbol?.() !== symbol) {
          editor.execOperation(new Kekule.ChemObjOperation.Modify(obj, { symbol }, editor));
        }
        return true;
      }

      if (!obj && editor.canAddUnconnectedStructFragment()) {
        const mol = new Kekule.Molecule();
        const atom = new Kekule.Atom(null, symbol);
        mol.appendNode(atom);
        atom.setAbsCoordOfMode(editor.screenCoordToObj(coord), editor.getCoordMode());
        editor.execOperation(new Kekule.ChemObjOperation.Add(mol, editor.getChemObj(), null, editor));
        e.preventDefault();
        return true;
      }
    }
  });

  Kekule.Editor[ELEMENT_TOOL_ID] = ElementController;
  Kekule.Editor.IaControllerManager.register(ElementController, Kekule.Editor.ChemSpaceEditor);
}

/**
 * Registers an interaction controller that drops a whole ring template (e.g. pyridine)
 * centred on the clicked point of the empty canvas. Set `template` to a {@link RingTemplate}.
 */
function registerTemplateTool(Kekule: KekuleNS, Class: KekuleNS) {
  if (Kekule.Editor[TEMPLATE_TOOL_ID]) return;

  const TemplateController = Class.create(Kekule.Editor.MolAtomIaController, {
    CLASS_NAME: `Kekule.Editor.${TEMPLATE_TOOL_ID}`,
    template: null as RingTemplate | null,
    react_pointerup(this: KekuleNS, e: KekuleNS) {
      if (e.getButton() !== Kekule.X.Event.MouseButton.LEFT) return;
      const template: RingTemplate | null = this.template;
      const editor = this.getEditor();
      if (!template || !editor.canAddUnconnectedStructFragment()) return;

      const coord = this._getEventMouseCoord(e);
      if (this.getTopmostInteractableObjAtScreenCoord(coord)) return;

      editor.setSelection(null);
      const center = editor.screenCoordToObj(coord);
      let bondLength = 0.8;
      try {
        bondLength = editor.getEditorConfigs().getStructureConfigs().getDefBondLength() || bondLength;
      } catch {
        // keep default
      }
      const n = template.atoms.length;
      const radius = bondLength / (2 * Math.sin(Math.PI / n));

      const mol = new Kekule.Molecule();
      const atoms = template.atoms.map((symbol, i) => {
        const atom = new Kekule.Atom(null, symbol);
        const angle = Math.PI / 2 + (2 * Math.PI * i) / n; // heteroatom on top
        mol.appendNode(atom);
        atom.setAbsCoordOfMode(
          { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) },
          editor.getCoordMode()
        );
        return atom;
      });
      template.bonds.forEach((order, i) => {
        mol.appendConnector(new Kekule.Bond(null, [atoms[i], atoms[(i + 1) % n]], order));
      });
      editor.execOperation(new Kekule.ChemObjOperation.Add(mol, editor.getChemObj(), null, editor));
      e.preventDefault();
      return true;
    }
  });

  Kekule.Editor[TEMPLATE_TOOL_ID] = TemplateController;
  Kekule.Editor.IaControllerManager.register(TemplateController, Kekule.Editor.ChemSpaceEditor);
}

/**
 * Kekule's SMILES writer drops implicit hydrogens on bracket atoms when it decides the H count is
 * "normal", e.g. pyridinium is written as `[N+]` instead of `[NH+]`. Inside brackets SMILES has no
 * implicit hydrogens, so that silently changes the molecule. Re-insert the H count in that case.
 */
function patchSmilesBracketHydrogens(Kekule: KekuleNS) {
  const proto = Kekule.IO?.SmilesMolWriter?.prototype;
  if (!proto || proto.__pmBracketHPatched) return;
  const original = proto._outputNodeStr;
  if (typeof original !== 'function') return;

  proto._outputNodeStr = function (this: KekuleNS, node: KekuleNS, ...rest: unknown[]) {
    const result: string = original.call(this, node, ...rest);
    if (!(node instanceof Kekule.Atom) || !result.startsWith('[')) return result;
    const m = /^\[(\d*)([A-Za-z][a-z]?)(@{0,2})(H\d*)?(.*)\]$/.exec(result);
    if (!m || m[4]) return result;
    const options = (rest[3] as Record<string, unknown>) || {};
    const hCount = Math.round(Number(this._getNodeHydrogenCount?.(node, options)) || 0);
    if (hCount <= 0) return result;
    return `[${m[1]}${m[2]}${m[3]}H${hCount > 1 ? hCount : ''}${m[5]}]`;
  };
  proto.__pmBracketHPatched = true;
}

/** True when `symbol` is a real chemical element known to Kekule (case-sensitive, e.g. "Se"). */
export function isKnownElement(Kekule: KekuleNS, symbol: string): boolean {
  if (!/^[A-Z][a-z]?$/.test(symbol)) return false;
  try {
    const info = Kekule.ChemicalElementsDataUtil.getElementInfo(symbol);
    return !!info && info.atomicNumber > 0;
  } catch {
    return false;
  }
}

/**
 * Hill-order molecular formula (implicit hydrogens included) and net charge of a molecule.
 * Returns null when the structure contains anything other than plain atoms.
 */
export function describeMolecule(mol: KekuleNS): { formula: string; charge: number } | null {
  const counts = new Map<string, number>();
  let charge = 0;
  const add = (symbol: string, count: number) => {
    if (count > 0) counts.set(symbol, (counts.get(symbol) ?? 0) + count);
  };
  try {
    const nodes: KekuleNS[] = mol.getLeafNodes?.() ?? [];
    for (const node of nodes) {
      const symbol: string | undefined = node.getSymbol?.();
      if (!symbol) return null;
      add(symbol, 1);
      add('H', Number(node.getImplicitHydrogenCount?.() ?? 0) || 0);
      charge += Number(node.getCharge?.() ?? 0) || 0;
    }
  } catch {
    return null;
  }
  if (counts.size === 0) return null;

  const part = (symbol: string) => {
    const n = counts.get(symbol) ?? 0;
    return n === 0 ? '' : n === 1 ? symbol : `${symbol}${n}`;
  };
  const hasCarbon = counts.has('C');
  const head = hasCarbon ? ['C', 'H'] : [];
  const rest = [...counts.keys()].filter((s) => !head.includes(s)).sort();
  const formula = [...head, ...rest].map(part).join('');
  return { formula, charge };
}

/**
 * Creates a bare 2D chem-space editor (no Kekule toolbars) inside `host`.
 * Kekule's Composer normally registers the interaction controllers; without it we do so here.
 */
export function createEditor(Kekule: KekuleNS, host: HTMLElement): KekuleNS {
  // Kekule binds to (and restyles) the element it is given, so hand it a dedicated child node.
  const editorEl = document.createElement('div');
  host.appendChild(editorEl);
  const editor = new Kekule.Editor.ChemSpaceEditor(editorEl, null, Kekule.Render.RendererType.R2D);
  const controllerClasses = Kekule.Editor.IaControllerManager.getAvailableControllerClasses(editor.getClass());
  for (const ControllerClass of controllerClasses) {
    const controller = new ControllerClass(editor);
    editor.addIaController(controller.getDefId(), controller);
  }
  // Kekule's defaults (1px lines) look faint inside the dialog
  editor.getRenderConfigs().getLengthConfigs().setBondLineWidth(1.6);
  editor.newDoc();
  editor.setZoom(2);
  return editor;
}

/** Returns all drawn structures merged into one fragment, or null when the canvas is empty. */
export function getDrawnMolecule(Kekule: KekuleNS, editor: KekuleNS): KekuleNS | null {
  const doc = editor.getChemObj();
  if (!doc) return null;
  const mol = Kekule.ChemStructureUtils.getTotalStructFragment(doc);
  if (!mol || mol.getNodeCount() === 0) return null;
  return mol;
}

/**
 * Returns a PNG data URI of the drawing, cropped to the structure and rendered as dark ink
 * on white (independent of the current theme). Returns '' if nothing can be captured.
 */
export function exportStructureImage(editor: KekuleNS, padding = 16): string {
  try {
    const source: HTMLCanvasElement | null = editor.getElement().querySelector('canvas');
    const srcCtx = source?.getContext('2d');
    if (!source || !srcCtx) return '';

    const { width, height } = source;
    const data = srcCtx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return '';

    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    const out = document.createElement('canvas');
    out.width = cropW;
    out.height = cropH;
    const ctx = out.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(source, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    // Recolour strokes to dark ink, then put a white background behind them
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#212529';
    ctx.fillRect(0, 0, cropW, cropH);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cropW, cropH);
    return out.toDataURL('image/png');
  } catch {
    return '';
  }
}

/** Exports a molecule as SMILES; returns '' if Kekule cannot write it. */
export function toSmiles(Kekule: KekuleNS, mol: KekuleNS): string {
  try {
    return String(Kekule.IO.saveFormatData(mol, 'smi') ?? '').trim();
  } catch {
    return '';
  }
}

/**
 * Generates 3D coordinates locally with OpenBabel (WASM, run in a web worker by Kekule)
 * and returns them as an MDL molfile (V2000), which the app's SDF parser accepts.
 */
export function generate3DLocally(Kekule: KekuleNS, mol: KekuleNS, timeoutMs = 60000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local 3D generation timed out.')), timeoutMs);
    try {
      Kekule.Calculator.generate3D(
        mol,
        { forceField: 'MMFF94' },
        (generatedMol: KekuleNS) => {
          clearTimeout(timer);
          try {
            const molfile = String(Kekule.IO.saveFormatData(generatedMol, 'mol') ?? '');
            if (!molfile.trim()) throw new Error('Local 3D generation returned no structure.');
            resolve(molfile);
          } catch (err) {
            reject(err);
          }
        },
        (err: unknown) => {
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error(String(err ?? 'Local 3D generation failed.')));
        }
      );
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

/**
 * Warms the cache with OpenBabel's runtime files while online, so the offline fallback
 * keeps working later (the service worker stores everything under /kekule/).
 */
export function prefetchOpenBabelAssets(): void {
  if (typeof navigator === 'undefined' || !navigator.onLine) return;
  for (const file of ['openbabel.js', 'openbabel.wasm', 'openbabel.data', 'kekule.worker.obStructureGenerator.js']) {
    fetch(`${OPENBABEL_BASE_URL}${file}`).catch(() => {});
  }
}

let openBabelPromise: Promise<void> | null = null;

/** Loads OpenBabel (WASM) into the page so Kekule can read SMILES. Safe to call repeatedly. */
export function ensureOpenBabel(Kekule: KekuleNS): Promise<void> {
  if (!openBabelPromise) {
    openBabelPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('OpenBabel failed to load.')), 30000);
      try {
        Kekule.OpenBabel.enable(() => {
          clearTimeout(timer);
          resolve();
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    }).catch((err) => {
      openBabelPromise = null;
      throw err;
    });
  }
  return openBabelPromise;
}

/**
 * Parses a SMILES string and lays it out in 2D with OpenBabel (WASM, main thread; fast for
 * drawing-sized molecules). Resolves to null when the text is not a readable SMILES (e.g. a
 * compound name or InChI). Coordinates use a bond length of ~1.
 *
 * Everything up to the molfile stays inside OpenBabel: Kekule's own OpenBabel bridge drops
 * stereochemistry for 0D input, whereas OpenBabel's molfile writer turns the SMILES chirality into
 * wedge/hash bonds that Kekule reads back (and writes out again as @/@@).
 */
export async function smilesToMolecule2D(Kekule: KekuleNS, smiles: string): Promise<KekuleNS | null> {
  const text = smiles.trim();
  if (!text || /\s/.test(text) || /^inchi=/i.test(text)) return null;
  await ensureOpenBabel(Kekule);

  const OB = Kekule.OpenBabel;
  const conv = new (OB.getClassCtor('ObConversionWrapper'))();
  const obMol = new (OB.getClassCtor('OBMol'))();
  try {
    conv.setInFormat('', 'smi');
    if (!conv.readString(obMol, text) || obMol.NumAtoms() === 0) return null;
    const gen2D = OB.getModule()['OBOp'].FindType('Gen2D');
    if (!gen2D) throw new Error('OpenBabel 2D layout is unavailable.');
    gen2D.Do(obMol, '');
    conv.setOutFormat('', 'mol');
    const molfile: string = conv.writeString(obMol, false);
    const mol = Kekule.IO.loadFormatData(molfile, 'mol');
    return mol && mol.getNodeCount?.() ? mol : null;
  } finally {
    obMol['delete']();
    conv['delete']();
  }
}

/** Bounding box of a molecule's 2D node coordinates (in molecule units). */
function bounds2D(mol: KekuleNS) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0, n = mol.getNodeCount(); i < n; i++) {
    const c = mol.getNodeAt(i).getCoord2D?.() ?? { x: 0, y: 0 };
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y);
    maxY = Math.max(maxY, c.y);
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

/** Creates a read-only 2D structure viewer (no toolbar, no interaction) inside `host`. */
export function createStructureViewer(Kekule: KekuleNS, host: HTMLElement): KekuleNS {
  const el = document.createElement('div');
  el.style.width = '100%';
  el.style.height = '100%';
  host.appendChild(el);
  const viewer = new Kekule.ChemWidget.Viewer(el, null, Kekule.Render.RendererType.R2D);
  viewer.setEnableToolbar(false);
  viewer.setEnableDirectInteraction?.(false);
  viewer.setEnableGesture?.(false);
  viewer.setAutoSize(false);
  viewer.setAutofit(false);
  viewer.setAutoShrink(false);
  viewer.setPadding?.(0);
  viewer.getRenderConfigs().getLengthConfigs().setBondLineWidth?.(1.4);
  return viewer;
}

/** Shows `mol` in a viewer from {@link createStructureViewer}, zoomed to fit its box. */
export function showInViewer(viewer: KekuleNS, mol: KekuleNS | null, padding = 28) {
  viewer.setChemObj(mol);
  if (!mol) return;
  const el: HTMLElement = viewer.getElement();
  const { minX, minY, maxX, maxY } = bounds2D(mol);
  // Kekule scales the median bond to `defBondLength` px at zoom 1; OpenBabel lays bonds out at ~1.
  let bondPx = 25;
  try {
    bondPx = viewer.getRenderConfigs().getLengthConfigs().getDefBondLength() || bondPx;
  } catch {
    // keep default
  }
  const w = Math.max(maxX - minX, 1) * bondPx + padding * 2;
  const h = Math.max(maxY - minY, 1) * bondPx + padding * 2;
  const zoom = Math.min(el.clientWidth / w, el.clientHeight / h, 1.8);
  viewer.setZoom(Math.max(zoom, 0.25));
}

/**
 * Adds `mol` (2D layout with bond length ~1, e.g. from {@link smilesToMolecule2D}) to the editor,
 * scaled to the editor's bond length and centred in the visible canvas. Undoable.
 */
export function addMoleculeToEditor(Kekule: KekuleNS, editor: KekuleNS, mol: KekuleNS) {
  let bondLength = 0.8;
  try {
    bondLength = editor.getEditorConfigs().getStructureConfigs().getDefBondLength() || bondLength;
  } catch {
    // keep default
  }
  const { minX, minY, maxX, maxY } = bounds2D(mol);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (let i = 0, n = mol.getNodeCount(); i < n; i++) {
    const node = mol.getNodeAt(i);
    const c = node.getCoord2D?.() ?? { x: 0, y: 0 };
    node.setCoord2D({ x: (c.x - cx) * bondLength, y: (c.y - cy) * bondLength });
  }
  // The editor's client area is larger than the viewport and may be scrolled: centre on what is visible.
  const el: HTMLElement = editor.getElement();
  const box = editor.getVisibleClientScreenBox?.();
  const screenCenter = box
    ? { x: (box.x1 + box.x2) / 2, y: (box.y1 + box.y2) / 2 }
    : { x: el.clientWidth / 2, y: el.clientHeight / 2 };
  mol.setCoord2D(editor.screenCoordToObj(screenCenter));
  editor.execOperation(new Kekule.ChemObjOperation.Add(mol, editor.getChemObj(), null, editor));
  try {
    editor.scrollClientToObject?.([mol]);
  } catch {
    // scrolling is cosmetic
  }
}

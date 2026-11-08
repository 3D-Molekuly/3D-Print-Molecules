// Client-only helpers around Kekule.js for the "Draw" tab of the advanced search dialog.
// Kekule needs DOM + canvas, so it is only ever loaded through a dynamic import in the browser.

// Kekule ships without TypeScript types; its namespace is used dynamically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KekuleNS = any;

/** Base URL where vite.config.ts copies OpenBabel (WASM) + Kekule's worker script. */
const OPENBABEL_BASE_URL = '/kekule/extra/';

/** Id of the custom interaction controller registered by {@link registerElementTool}. */
export const ELEMENT_TOOL_ID = 'PmElementIaController';

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

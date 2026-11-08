// Reader for binary ChemDraw documents (.cdx). It walks the documented CDX object tree and
// re-emits the structural part (fragments, nodes, bonds) as CDXML text, so both ChemDraw
// formats share one converter (./cdxml.ts).
// Format reference: ChemDraw CDX specification (objects with 0x8000-bit tags, tagged properties).

const CDX_MAGIC = 'VjCD0100';
const CDX_HEADER_LENGTH = 22;

const OBJ_FRAGMENT = 0x8003;
const OBJ_NODE = 0x8004;
const OBJ_BOND = 0x8005;

const PROP_2D_POSITION = 0x0200;
const PROP_NODE_TYPE = 0x0400;
const PROP_NODE_ELEMENT = 0x0402;
const PROP_ATOM_CHARGE = 0x0421;
const PROP_BOND_ORDER = 0x0600;
const PROP_BOND_DISPLAY = 0x0603;
const PROP_BOND_BEGIN = 0x0604;
const PROP_BOND_END = 0x0605;

const NODE_TYPES = [
  'Unspecified', 'Element', 'ElementList', 'ElementListNickname', 'Nickname', 'Fragment', 'Formula',
  'GenericNickname', 'AnonymousAlternativeGroup', 'NamedAlternativeGroup', 'MultiAttachment',
  'VariableAttachment', 'ExternalConnectionPoint', 'LinkNode'
];

const BOND_DISPLAYS = [
  'Solid', 'Dash', 'Hash', 'WedgedHashBegin', 'WedgedHashEnd', 'Bold', 'WedgeBegin', 'WedgeEnd', 'Wavy',
  'HollowWedgeBegin', 'HollowWedgeEnd', 'WavyWedgeBegin', 'WavyWedgeEnd', 'Dot', 'DashDot', 'DashDotDot'
];

function bondOrderFromFlags(flags: number): string {
  if (flags & 0x0004) return '3';
  if (flags & 0x0002) return '2';
  if (flags & 0x0080) return '1.5';
  if (flags & 0x0001) return '1';
  if (flags & 0x1000) return 'dative';
  if (flags & 0x2000) return 'ionic';
  if (flags & 0x4000) return 'hydrogen';
  return '1';
}

function readSigned(view: DataView, offset: number, length: number): number {
  if (length >= 4) return view.getInt32(offset, true);
  if (length >= 2) return view.getInt16(offset, true);
  return view.getInt8(offset);
}

function escapeAttr(value: string | number): string {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Converts a binary CDX document into equivalent (structure-only) CDXML text. */
export function cdxToCdxml(bytes: Uint8Array): string {
  for (let i = 0; i < CDX_MAGIC.length; i++) {
    if (bytes[i] !== CDX_MAGIC.charCodeAt(i)) throw new Error('Not a ChemDraw CDX document.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // The header is followed by the Document object (tag 0x8000 + 4-byte id). Some writers
  // (e.g. ChemDoodle) leave that tag zeroed, so the 6 bytes are consumed unconditionally.
  let pos = CDX_HEADER_LENGTH + 6;

  const out: string[] = ['<?xml version="1.0" encoding="UTF-8" ?>', '<CDXML><page>'];
  // Stack of open objects; only fragments, nodes and bonds are written out
  const stack: { tag: number; attrs: Record<string, string>; emitted: boolean }[] = [
    { tag: 0x8000, attrs: {}, emitted: false }
  ];

  const openElement = (entry: (typeof stack)[number]) => {
    if (entry.emitted) return;
    entry.emitted = true;
    if (entry.tag === OBJ_NODE) out.push(`<n${attrsToString(entry.attrs)}>`);
    else if (entry.tag === OBJ_FRAGMENT) out.push('<fragment>');
  };
  const attrsToString = (attrs: Record<string, string>) =>
    Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
      .join('');

  while (pos + 2 <= bytes.length) {
    const tag = view.getUint16(pos, true);
    pos += 2;

    if (tag === 0) {
      // End of the current object
      const entry = stack.pop();
      if (!entry) break;
      if (entry.tag === OBJ_NODE) {
        if (entry.emitted) out.push('</n>');
        else out.push(`<n${attrsToString(entry.attrs)}/>`);
      } else if (entry.tag === OBJ_FRAGMENT) {
        openElement(entry);
        out.push('</fragment>');
      } else if (entry.tag === OBJ_BOND) {
        const parent = stack[stack.length - 1];
        if (parent && parent.tag === OBJ_FRAGMENT) openElement(parent);
        out.push(`<b${attrsToString(entry.attrs)}/>`);
      }
      if (stack.length === 0) break; // end of the document object
      continue;
    }

    if (tag & 0x8000) {
      if (pos + 4 > bytes.length) break;
      const id = view.getUint32(pos, true);
      pos += 4;
      // A nested fragment (nickname expansion) forces its parent node open as <n>...</n>
      const parent = stack[stack.length - 1];
      if (tag === OBJ_FRAGMENT && parent && parent.tag === OBJ_NODE) openElement(parent);
      if (tag === OBJ_NODE && parent && parent.tag === OBJ_FRAGMENT) openElement(parent);
      stack.push({ tag, attrs: tag === OBJ_NODE || tag === OBJ_BOND ? { id: String(id) } : {}, emitted: false });
      continue;
    }

    // Property: tag, uint16 length (0xFFFF -> uint32 length follows), data
    if (pos + 2 > bytes.length) break;
    let length = view.getUint16(pos, true);
    pos += 2;
    if (length === 0xffff) {
      if (pos + 4 > bytes.length) break;
      length = view.getUint32(pos, true);
      pos += 4;
    }
    const dataStart = pos;
    pos += length;
    if (pos > bytes.length) break;

    const current = stack[stack.length - 1];
    if (!current) continue;
    if (current.tag === OBJ_NODE) {
      if (tag === PROP_2D_POSITION && length >= 8) {
        // CDXPoint2D: y then x, fixed point 1/65536 pt
        const y = view.getInt32(dataStart, true) / 65536;
        const x = view.getInt32(dataStart + 4, true) / 65536;
        current.attrs.p = `${x.toFixed(4)} ${y.toFixed(4)}`;
      } else if (tag === PROP_NODE_ELEMENT && length >= 2) {
        current.attrs.Element = String(view.getUint16(dataStart, true));
      } else if (tag === PROP_ATOM_CHARGE && length >= 1) {
        current.attrs.Charge = String(readSigned(view, dataStart, length));
      } else if (tag === PROP_NODE_TYPE && length >= 2) {
        const type = NODE_TYPES[view.getUint16(dataStart, true)];
        if (type && type !== 'Unspecified') current.attrs.NodeType = type;
      }
    } else if (current.tag === OBJ_BOND) {
      if (tag === PROP_BOND_BEGIN && length >= 4) current.attrs.B = String(view.getUint32(dataStart, true));
      else if (tag === PROP_BOND_END && length >= 4) current.attrs.E = String(view.getUint32(dataStart, true));
      else if (tag === PROP_BOND_ORDER && length >= 2) current.attrs.Order = bondOrderFromFlags(view.getUint16(dataStart, true));
      else if (tag === PROP_BOND_DISPLAY && length >= 2) {
        const display = BOND_DISPLAYS[view.getUint16(dataStart, true)];
        if (display && display !== 'Solid') current.attrs.Display = display;
      }
    }
  }

  out.push('</page></CDXML>');
  return out.join('\n');
}

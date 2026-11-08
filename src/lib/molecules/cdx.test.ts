// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { cdxToCdxml } from './cdx';
import { cdxmlToMolfile } from './cdxml';

const parser = new DOMParser();

/** Tiny CDX writer for tests: objects are [tag, id, props, children]. */
type Obj = [number, number, [number, number[]][], Obj[]];
function u16(v: number) {
  return [v & 0xff, (v >> 8) & 0xff];
}
function u32(v: number) {
  return [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff];
}
function writeObj([tag, id, props, children]: Obj): number[] {
  const out = [...u16(tag), ...u32(id)];
  for (const [ptag, data] of props) out.push(...u16(ptag), ...u16(data.length), ...data);
  for (const child of children) out.push(...writeObj(child));
  out.push(0, 0);
  return out;
}
function cdx(doc: Obj): Uint8Array {
  const header = [...'VjCD0100'].map((c) => c.charCodeAt(0)).concat([4, 3, 2, 1], new Array(10).fill(0));
  return Uint8Array.from([...header, ...writeObj(doc)]);
}
const pos = (x: number, y: number) => [...u32(y * 65536), ...u32(x * 65536)];

describe('cdxToCdxml', () => {
  it('reads nodes, elements, charges and bond orders (acetate)', () => {
    const doc: Obj = [0x8000, 1, [], [
      [0x8001, 2, [], [
        [0x8003, 3, [], [
          [0x8004, 10, [[0x0200, pos(100, 100)]], []],
          [0x8004, 11, [[0x0200, pos(114.4, 100)]], [[0x8006, 50, [[0x0700, [1, 2, 3]]], []]]],
          [0x8004, 12, [[0x0200, pos(128.8, 100)], [0x0402, u16(8)], [0x0421, [0xff]]], []],
          [0x8004, 13, [[0x0200, pos(114.4, 85.6)], [0x0402, u16(8)]], []],
          [0x8005, 20, [[0x0604, u32(10)], [0x0605, u32(11)]], []],
          [0x8005, 21, [[0x0604, u32(11)], [0x0605, u32(12)], [0x0600, u16(1)]], []],
          [0x8005, 22, [[0x0604, u32(11)], [0x0605, u32(13)], [0x0600, u16(2)]], []]
        ]]
      ]]
    ]];
    const cdxml = cdxToCdxml(cdx(doc));
    expect(cdxml).toContain('<n id="12" p="128.8000 100.0000" Element="8" Charge="-1"/>');
    expect(cdxml).toContain('<b id="22" B="11" E="13" Order="2"/>');

    const mol = cdxmlToMolfile(cdxml, parser).split('\n');
    expect(mol[3]).toMatch(/^ {2}4 {2}3/);
    expect(mol).toContain('  2  4  2  0  0  0  0');
    expect(mol).toContain('M  CHG  1   3  -1');
  });

  it('keeps wedge bonds as MDL stereo', () => {
    const doc: Obj = [0x8000, 1, [], [
      [0x8003, 3, [], [
        [0x8004, 10, [[0x0200, pos(0, 0)]], []],
        [0x8004, 11, [[0x0200, pos(14.4, 0)]], []],
        [0x8005, 20, [[0x0604, u32(10)], [0x0605, u32(11)], [0x0603, u16(7)]], []] // WedgeEnd
      ]]
    ]];
    const mol = cdxmlToMolfile(cdxToCdxml(cdx(doc)), parser).split('\n');
    expect(mol).toContain('  2  1  1  1  0  0  0');
  });

  it('rejects non-CDX data', () => {
    expect(() => cdxToCdxml(new TextEncoder().encode('hello world, not cdx'))).toThrow();
  });
});

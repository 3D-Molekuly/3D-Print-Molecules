// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { cdxmlToMolfile } from './cdxml';
import { molfileIsFlat } from './structureImport';

const parser = new DOMParser();

const header = '<?xml version="1.0" encoding="UTF-8" ?>\n<!DOCTYPE CDXML SYSTEM "http://www.cambridgesoft.com/xml/cdxml.dtd" >\n';

describe('cdxmlToMolfile', () => {
  it('converts atoms, bond orders and charges', () => {
    const cdxml = `${header}<CDXML><page id="1"><fragment id="2">
      <n id="3" p="100 100"/>
      <n id="4" p="114.4 100"/>
      <n id="5" p="128.8 100" Element="8" Charge="-1"/>
      <b id="6" B="3" E="4" Order="2"/>
      <b id="7" B="4" E="5"/>
    </fragment></page></CDXML>`;
    const mol = cdxmlToMolfile(cdxml, parser);
    const lines = mol.split('\n');
    expect(lines[3]).toMatch(/^ {2}3 {2}2/);
    expect(lines[4]).toContain(' C ');
    expect(lines[6]).toContain(' O ');
    expect(lines[7]).toBe('  1  2  2  0  0  0  0');
    expect(lines[8]).toBe('  2  3  1  0  0  0  0');
    expect(mol).toContain('M  CHG  1   3  -1');
    expect(molfileIsFlat(mol)).toBe(true);
    // 14.4 pt bond -> 1.5 units, y axis flipped
    expect(Number(lines[5].slice(0, 10)) - Number(lines[4].slice(0, 10))).toBeCloseTo(1.5, 3);
    expect(Number(lines[4].slice(10, 20))).toBeLessThan(0);
  });

  it('inlines nickname abbreviations at their connection point', () => {
    const cdxml = `${header}<CDXML><page id="1"><fragment id="2">
      <n id="3" p="100 100"/>
      <n id="4" p="114.4 100" NodeType="Nickname">
        <fragment id="10">
          <n id="11" p="0 0" NodeType="ExternalConnectionPoint"/>
          <n id="12" p="10 0" Element="8"/>
          <n id="13" p="20 0"/>
          <b id="14" B="11" E="12"/>
          <b id="15" B="12" E="13"/>
        </fragment>
      </n>
      <b id="6" B="3" E="4"/>
    </fragment></page></CDXML>`;
    const lines = cdxmlToMolfile(cdxml, parser).split('\n');
    // C-OMe: C, O, C with bonds C1-O2 and O2-C3
    expect(lines[3]).toMatch(/^ {2}3 {2}2/);
    expect(lines.slice(7, 9).sort()).toEqual(['  1  2  1  0  0  0  0', '  2  3  1  0  0  0  0'].sort());
  });

  it('rejects documents without structures', () => {
    expect(() => cdxmlToMolfile(`${header}<CDXML><page id="1"><t id="2"><s>text</s></t></page></CDXML>`, parser)).toThrow();
  });
});

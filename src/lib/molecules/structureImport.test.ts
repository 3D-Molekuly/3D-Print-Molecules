import { describe, expect, it } from 'vitest';
import { isCdxBinary, isCdxml, molfileIsFlat } from './structureImport';

const chemDraw2D = [
  '',
  '  ChemDraw11082617052D',
  '',
  '  3  2  0  0  0  0  0  0  0  0999 V2000',
  '   -0.7145    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0',
  '    0.0000   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0',
  '    0.7145    0.2062    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0',
  '  1  2  1  0',
  '  2  3  1  0',
  'M  END'
].join('\n');

describe('molfileIsFlat', () => {
  it('detects ChemDraw 2D molfiles by header', () => {
    expect(molfileIsFlat(chemDraw2D)).toBe(true);
  });

  it('detects headerless files whose z coordinates are all zero', () => {
    expect(molfileIsFlat(chemDraw2D.replace('2D', '  '))).toBe(true);
  });

  it('keeps 3D structures as they are', () => {
    const threeD = chemDraw2D.replace('2D', '3D');
    expect(molfileIsFlat(threeD)).toBe(false);
    const withZ = chemDraw2D.replace('2D', '  ').replace('0.2062    0.0000 O', '0.2062    0.5000 O');
    expect(molfileIsFlat(withZ)).toBe(false);
  });

  it('reads V3000 coordinates', () => {
    const v3000 = [
      '',
      '  ChemDraw11082617052D',
      '',
      '  0  0  0     0  0            999 V3000',
      'M  V30 BEGIN CTAB',
      'M  V30 COUNTS 2 1 0 0 0',
      'M  V30 BEGIN ATOM',
      'M  V30 1 C -0.7145 0.2062 0 0',
      'M  V30 2 O 0.7145 0.2062 0 0',
      'M  V30 END ATOM',
      'M  END'
    ].join('\n');
    expect(molfileIsFlat(v3000)).toBe(true);
  });
});

describe('ChemDraw detection', () => {
  it('recognises CDXML text and CDX bytes', () => {
    expect(isCdxml('<?xml version="1.0"?><!DOCTYPE CDXML SYSTEM "cdxml.dtd"><CDXML>')).toBe(true);
    expect(isCdxml('<svg></svg>')).toBe(false);
    expect(isCdxBinary(new TextEncoder().encode('VjCD0100abc'))).toBe(true);
    expect(isCdxBinary(new TextEncoder().encode('hello'))).toBe(false);
  });
});

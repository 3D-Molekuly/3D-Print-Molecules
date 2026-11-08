import { describe, expect, it } from 'vitest';
import {
  detectFormulaQuery,
  formatConformerQuery,
  looksLikeSimpleSmiles,
  looksLikeSmiles,
  parseConformerQuery
} from './queryDetection';

describe('detectFormulaQuery', () => {
  it.each([
    ['H2O', 'H2O'],
    ['CO2', 'CO2'],
    ['H2SO4', 'H2SO4'],
    ['C6H12O6', 'C6H12O6'],
    ['Ca(OH)2', 'Ca(OH)2'],
    ['H₂O', 'H2O'],
    [' C2H6O ', 'C2H6O'],
    ['formula: NaCl', 'NaCl']
  ])('recognises %s as a confident formula', (input, formula) => {
    expect(detectFormulaQuery(input)).toEqual({ formula, confident: true });
  });

  it.each([
    ['h2o', 'H2O'],
    ['co2', 'CO2'],
    ['h2so4', 'H2SO4'],
    ['nh3', 'NH3'],
    ['ch4', 'CH4'],
    ['c6h6', 'C6H6'],
    ['nacl2', 'NaCl2']
  ])('re-capitalises lowercase %s', (input, formula) => {
    expect(detectFormulaQuery(input)?.formula).toBe(formula);
  });

  it('treats digit-free formulas as non-confident (name lookup first)', () => {
    expect(detectFormulaQuery('NaCl')).toEqual({ formula: 'NaCl', confident: false });
    expect(detectFormulaQuery('HCl')).toEqual({ formula: 'HCl', confident: false });
  });

  it.each(['aspirin', 'caffeine', 'Fe', 'coin', '50-78-2', '2244', 'C1CCCCC1', 'water', 'Benzene', ''])(
    'does not treat %s as a formula',
    (input) => {
      expect(detectFormulaQuery(input)).toBeNull();
    }
  );
});

describe('looksLikeSmiles', () => {
  it.each(['C1=CC=CC=C1', 'CC(=O)OC1=CC=CC=C1C(=O)O', 'C1CCCCC1', 'O=C=O', '[Na+].[Cl-]', 'C#N', 'c1ccccc1', 'F/C=C/F'])(
    'accepts %s',
    (input) => expect(looksLikeSmiles(input)).toBe(true)
  );

  it.each(['CO2', 'C60', 'H2O', 'aspirin', '(R)-limonene', '(+)-camphor', 'CCO', '2-propanol', 'N2', '1CRN'])(
    'rejects %s',
    (input) => expect(looksLikeSmiles(input)).toBe(false)
  );

  it('flags plain chain SMILES separately', () => {
    expect(looksLikeSimpleSmiles('CCO')).toBe(true);
    expect(looksLikeSimpleSmiles('CCCC')).toBe(true);
    expect(looksLikeSimpleSmiles('CO')).toBe(false);
    expect(looksLikeSimpleSmiles('ATP')).toBe(false);
  });
});

describe('conformer queries', () => {
  it('round-trips conformer IDs', () => {
    const q = formatConformerQuery('000008c40000000b');
    expect(q).toBe('conformer:000008C40000000B');
    expect(parseConformerQuery(q)).toBe('000008C40000000B');
    expect(parseConformerQuery('aspirin')).toBeNull();
  });
});

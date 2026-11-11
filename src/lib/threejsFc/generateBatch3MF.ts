import fs from 'node:fs';
import path from 'node:path';
import {
  buildMoleculeGroup,
  createSphereMesh,
  generateModel3MFBlob,
  showAllElementGroups
} from './threejsMolecules3';
import { parseSDF } from '$lib/molecules/molecularDataParser';
import { autoOrientCoordinates } from '../../../publishing/scripts/autoOrientHelper.mjs';

export async function runBatch3MFGeneration() {
  const sdfDir = path.resolve('publishing/resources/sdf');
  const moleculesDir = path.resolve('publishing/molecules');
  const sdfFiles = fs.readdirSync(sdfDir).filter(f => f.endsWith('.sdf'));

  console.log(`================================================================`);
  console.log(`🚀 Generating ${sdfFiles.length} Multi-Color 3MFs (850% Scale, Auto-Oriented, Tree Supports)...`);
  console.log(`================================================================`);

  for (const file of sdfFiles) {
    const id = path.basename(file, '.sdf');
    const sdfPath = path.join(sdfDir, file);
    const sdfContent = fs.readFileSync(sdfPath, 'utf-8');

    // 1. Parse SDF
    const rawCoords = await parseSDF(sdfContent);
    if (!rawCoords || rawCoords.length === 0) {
      console.warn(`[skip] No coordinates in ${file}`);
      continue;
    }

    // 2. Auto-orient coordinates for 3D printing (flattest on Z, lowest center of gravity)
    const coords = autoOrientCoordinates(rawCoords);

    // 3. Build Three.js scene scaled to 850% (mmPerUnit: 8.5)
    showAllElementGroups();
    buildMoleculeGroup({
      coordinates: coords,
      quality: 32,
      showHydrogens: true,
      multiplicationFactor: 1.0,
      selectedGenerator: createSphereMesh,
      mmPerUnit: 8.5 // 850% scale
    });

    // 4. Generate Bambu Studio Multi-Color 3MF
    const blob3mf = await generateModel3MFBlob(id, {
      author: '3D Print Molecules',
      institution: 'UCT Prague / VŠCHT Praha',
      generator: '3D Print Molecules (3dmolekuly.vscht.cz)',
      scale: '850%',
      support_type: 'tree(auto)',
      orientation: 'auto-flat-pca'
    }, 'cs');

    if (!blob3mf) {
      console.error(`[error] Failed to generate 3MF for ${id}`);
      continue;
    }

    // 5. Save directly into publishing/molecules/<id>/3mf/<id>.3mf
    const targetDir = path.join(moleculesDir, id, '3mf');
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, `${id}.3mf`);

    const arrayBuf = await blob3mf.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    fs.writeFileSync(targetPath, buffer);

    console.log(`✓ [850% + Auto-Oriented] ${id} -> ${targetPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`================================================================`);
  console.log(`🎉 All Multi-Color 3MF files successfully generated!`);
  console.log(`================================================================`);
}

#!/usr/bin/env node
/**
 * Génère icon.png (512×512) pour build-resources.
 * Couleur PedaClic : #2563eb
 * Utilise jimp (pure JS, pas de bindings natifs).
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../build-resources');
const outPath = path.join(outDir, 'icon.png');
// PedaClic bleu : #2563eb
const COLOR = 0x2563ebff;

async function main() {
  let Jimp;
  try {
    Jimp = (await import('jimp')).default;
  } catch {
    console.warn('[icons] jimp non installé. Exécutez: npm install jimp --save-dev');
    process.exit(0);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const img = new Jimp(512, 512, COLOR);
  await img.writeAsync(outPath);
  console.log('[icons] icon.png généré (512×512).');
}

main().catch((err) => {
  console.error('[icons] Erreur:', err.message);
  process.exit(1);
});

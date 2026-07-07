import { copyFile, readFile, writeFile } from 'fs/promises';

const DIST_FOLDER = './dist';
const PACKAGE = 'package.json';
const PACKAGE_LOCK = 'package-lock.json';
const README = 'README.md';
const LICENSE = 'LICENSE';

async function preparePublishFiles() {
  try {
    // 1. Copiar package.json y package-lock.json a dist
    await copyFile(PACKAGE, `${DIST_FOLDER}/${PACKAGE}`);
    await copyFile(PACKAGE_LOCK, `${DIST_FOLDER}/${PACKAGE_LOCK}`);

    // 2. Leer el nuevo package.json y modificarlo
    const content = await readFile(`${DIST_FOLDER}/${PACKAGE}`);
    const packageJson = JSON.parse(content);

    // Eliminar claves de desarrollo
    delete packageJson.devDependencies;
    delete packageJson.repository;
    packageJson.scripts = {
      start: 'node start.js'
    };

    // 3. Guardar el package.json modificado
    await writeFile(`${DIST_FOLDER}/${PACKAGE}`, JSON.stringify(packageJson, null, 2));
    console.log(`Processed and wrote ${PACKAGE} file`);

    // 4. Copiar otros ficheros
    await copyFile(README, `${DIST_FOLDER}/${README}`);
    console.log(`Copied ${README} file`);

    await copyFile(LICENSE, `${DIST_FOLDER}/${LICENSE}`);
    console.log(`Copied ${LICENSE} file`);
  } catch (err) {
    console.error('Error preparing publish files:', err);
    process.exit(1);
  }
}

preparePublishFiles();

import fs from 'fs';
import { argv } from 'process';

const BUMP_TYPE = argv[2];
const VALID_BUMP_TYPES = ['major', 'minor', 'patch'];
const PACKAGE = './package.json';
const SWAGGER = './src/apps/mybandnow/backend/config/swagger/definition.json';

if (!BUMP_TYPE || !VALID_BUMP_TYPES.includes(BUMP_TYPE)) {
    throw new Error(
        `Tipo de incremento de versión inválido o no especificado. Usa: "node update-version.js [${VALID_BUMP_TYPES.join(
            ' | '
        )}]"`
    );
}

// Leer la versión actual desde package.json
const packageFile = fs.readFileSync(PACKAGE);
const packageData = JSON.parse(packageFile);
const currentVersion = packageData.version;

// Calcular la nueva versión
const versionParts = currentVersion.split('.').map(Number);
let [major, minor, patch] = versionParts;

switch (BUMP_TYPE) {
    case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
    case 'minor':
        minor++;
        patch = 0;
        break;
    case 'patch':
        patch++;
        break;
}

const newVersion = `${major}.${minor}.${patch}`;

// Actualizar la versión del archivo package.json
packageData.version = newVersion;
fs.writeFileSync(PACKAGE, JSON.stringify(packageData, null, 4));
console.log(`Updated ${PACKAGE} file to version ${newVersion}`);

// Actualizar la versión del archivo definition.yaml de Swagger
const swaggerFile = fs.readFileSync(SWAGGER);
const swaggerData = JSON.parse(swaggerFile);
swaggerData.info.version = newVersion;
fs.writeFileSync(SWAGGER, JSON.stringify(swaggerData, null, 4));
console.log(`Updated ${SWAGGER} file to version ${newVersion}`);

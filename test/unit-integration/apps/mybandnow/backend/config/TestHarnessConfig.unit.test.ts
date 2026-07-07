import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = fileURLToPath(new URL('../../../../../..', import.meta.url));
const bootstrapPath = join(rootDir, 'test/acceptance/config/bootstrap.ts');
const envConfigPath = join(rootDir, 'src/Contexts/Shared/infrastructure/config/env.ts');
const packageJsonPath = join(rootDir, 'package.json');
const dockerfilePath = join(rootDir, 'Dockerfile');

describe('test harness logging config', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalLogTypes = process.env.LOG_TYPES;

  afterEach(() => {
    restoreEnv('NODE_ENV', originalNodeEnv);
    restoreEnv('LOG_TYPES', originalLogTypes);
  });

  it('keeps production LOG_TYPES default as file and console', () => {
    // Arrange
    const envConfigSource = readFileSync(envConfigPath, 'utf8');

    // Act & Assert
    expect(envConfigSource).toContain(".default('file,console')");
  });

  it('forces console-only logging in the shared Vitest harness', async () => {
    const vitestConfig = await loadDefaultExport<{ test?: { env?: Record<string, string> } }>('vitest.config.ts');

    // Assert
    expect(vitestConfig.test?.env).toEqual({
      LOG_TYPES: 'console',
      NODE_ENV: 'test'
    });
  });

  it('defines a unit project and a non-parallel integration project sharing that harness', async () => {
    const vitestConfig = await loadDefaultExport<{
      test?: { projects?: Array<{ extends?: boolean; test?: Record<string, unknown> }> };
    }>('vitest.config.ts');

    // Assert
    const projects = vitestConfig.test?.projects ?? [];
    const unitProject = projects.find((project) => project.test?.name === 'unit');
    const integrationProject = projects.find((project) => project.test?.name === 'integration');

    expect(unitProject).toMatchObject({ extends: true, test: { include: ['**/*.unit.test.ts'] } });
    expect(integrationProject).toMatchObject({
      extends: true,
      test: { include: ['**/*.integration.test.ts'], fileParallelism: false }
    });
  });

  it('loads the acceptance bootstrap before the step definitions', async () => {
    const cucumberConfig = await loadDefaultExport<{ import: string[] }>('cucumber.js');

    // Assert
    expect(cucumberConfig.import).toEqual([
      'test/acceptance/config/bootstrap.ts',
      'test/acceptance/step_definitions/**/*.ts'
    ]);
  });

  it('sets acceptance bootstrap env overrides before support modules load', async () => {
    // Arrange
    delete process.env.NODE_ENV;
    delete process.env.LOG_TYPES;

    // Act
    await import(`${pathToFileURL(bootstrapPath).href}?t=${Date.now()}`);

    // Assert
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.LOG_TYPES).toBe('console');
  });

  it('runs acceptance tests without inline environment injection in package.json', () => {
    // Arrange
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts: Record<string, string>;
    };

    // Assert
    expect(packageJson.scripts['tests:acceptance']).toBe('cucumber-js');
  });

  it('starts the runtime container without the npm lifecycle banner', () => {
    const dockerfileSource = readFileSync(dockerfilePath, 'utf8');

    expect(dockerfileSource).toContain('CMD [ "node", "start.js" ]');
    expect(dockerfileSource).not.toContain('CMD [ "npm", "start" ]');
  });
});

function restoreEnv(key: 'NODE_ENV' | 'LOG_TYPES', value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

async function loadDefaultExport<T>(relativePath: string): Promise<T> {
  const absolutePath = join(rootDir, relativePath);
  const modulePath = `${pathToFileURL(absolutePath).href}?t=${Date.now()}`;
  const loadedModule: unknown = await import(modulePath);

  if (typeof loadedModule !== 'object' || loadedModule === null || !('default' in loadedModule)) {
    throw new Error(`Unable to resolve cached module: ${modulePath}`);
  }

  return loadedModule.default as T;
}

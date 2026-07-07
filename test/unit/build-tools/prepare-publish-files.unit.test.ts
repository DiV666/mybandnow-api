import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const TEST_FILE_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(TEST_FILE_PATH), '..', '..', '..');
const SCRIPT_PATH = join(REPO_ROOT, 'build-tools', 'prepare-publish-files.js');

describe('build-tools/prepare-publish-files.js', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    tempDirs.forEach((path) => rmSync(path, { recursive: true, force: true }));
    tempDirs.length = 0;
  });

  it('copies the runtime lockfile and strips development-only package metadata', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'prepare-publish-files-'));
    tempDirs.push(tempDir);

    mkdirSync(join(tempDir, 'dist'), { recursive: true });
    writeFileSync(
      join(tempDir, 'package.json'),
      `${JSON.stringify(
        {
          name: 'mybandnow-api',
          version: '1.0.0',
          scripts: { start: 'node dist/start.js', test: 'vitest run' },
          repository: { type: 'git', url: 'https://example.test/repo.git' },
          dependencies: { express: '5.2.1' },
          devDependencies: { vitest: '4.1.8' }
        },
        null,
        2
      )}\n`
    );
    writeFileSync(join(tempDir, 'package-lock.json'), '{\n  "name": "mybandnow-api"\n}\n');
    writeFileSync(join(tempDir, 'README.md'), '# Readme\n');
    writeFileSync(join(tempDir, 'LICENSE'), 'license\n');

    // eslint-disable-next-line sonarjs/no-os-command-from-path -- test executes the local Node binary intentionally
    const result = spawnSync('node', [SCRIPT_PATH], {
      cwd: tempDir,
      encoding: 'utf-8'
    });

    expect(result.status).toBe(0);
    expect(existsSync(join(tempDir, 'dist', 'package-lock.json'))).toBe(true);

    const distPackageJson = JSON.parse(readFileSync(join(tempDir, 'dist', 'package.json'), 'utf-8'));

    expect(distPackageJson.devDependencies).toBeUndefined();
    expect(distPackageJson.repository).toBeUndefined();
    expect(distPackageJson.scripts).toEqual({ start: 'node start.js' });
  });
});

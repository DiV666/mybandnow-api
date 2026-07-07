import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const TEST_FILE_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(TEST_FILE_PATH), '..', '..', '..');
const SCRIPT_PATH = join(REPO_ROOT, 'build-tools', 'make-upgrade-version.sh');
// eslint-disable-next-line sonarjs/no-os-command-from-path -- test resolves the system git binary once to proxy non-ls-remote calls in the fake wrapper
const GIT_BIN_PATH = spawnSync('bash', ['-lc', 'command -v git'], { encoding: 'utf-8' }).stdout.trim();

describe('build-tools/make-upgrade-version.sh and Makefile release flow', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    tempDirs.forEach((path) => rmSync(path, { recursive: true, force: true }));
    tempDirs.length = 0;
  });

  it('exposes an exec-no-deps target for containerized release commands', () => {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- test executes the system make binary from PATH
    const result = spawnSync('make', ['-n', 'exec-no-deps', 'c=printf ok', 'EXEC_NO_DEPS_CMD=container-runner'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('container-runner printf ok');
  });

  it('does not resolve the remote target branch when unrelated targets are evaluated', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'make-upgrade-version-'));
    tempDirs.push(tempDir);

    const fakeBinDir = join(tempDir, 'bin');
    mkdirSync(fakeBinDir, { recursive: true });

    writeFileSync(
      join(fakeBinDir, 'git'),
      `#!/bin/sh
if [ "$1" = "ls-remote" ]; then
  sleep 10
  exit 1
fi

exec "${process.execPath}" -e "const { spawnSync } = require('node:child_process'); const result = spawnSync(process.argv[1], process.argv.slice(2), { stdio: 'inherit' }); if (result.error) throw result.error; process.exit(result.status ?? 1);" "${GIT_BIN_PATH}" "$@"
`,
      { mode: 0o755 }
    );

    // eslint-disable-next-line sonarjs/no-os-command-from-path -- test injects a fake git binary via PATH to prove Makefile parsing stays local
    const result = spawnSync('make', ['-n', 'exec-no-deps', 'c=printf ok', 'EXEC_NO_DEPS_CMD=container-runner'], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`
      },
      encoding: 'utf-8',
      timeout: 1_000
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('container-runner printf ok');
  });

  it('runs the container prepare step before the host finalize step', () => {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- test executes the system make binary from PATH
    const result = spawnSync('make', ['-n', 'upgrade-version', 'v=patch', 'EXEC_NO_DEPS_CMD=container-runner'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('make exec-no-deps c="./build-tools/make-upgrade-version.sh prepare patch"');
    expect(result.stdout).toContain('./build-tools/make-upgrade-version.sh finalize');
  });

  it('limits the prepare step to npm work during dry-run release', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'make-upgrade-version-'));
    tempDirs.push(tempDir);

    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ version: '1.2.3' }, null, 2));

    const fakeBinDir = join(tempDir, 'bin');
    mkdirSync(fakeBinDir, { recursive: true });

    writeFileSync(
      join(fakeBinDir, 'node'),
      `#!/bin/sh
printf '1.2.3\n'
`,
      { mode: 0o755 }
    );

    writeFileSync(
      join(fakeBinDir, 'npx'),
      `#!/bin/sh
printf '1.2.4\n'
`,
      { mode: 0o755 }
    );

    // eslint-disable-next-line sonarjs/no-os-command-from-path -- test injects fake node/npx binaries via PATH on purpose
    const result = spawnSync('bash', [SCRIPT_PATH, 'prepare', 'patch'], {
      cwd: tempDir,
      env: {
        ...process.env,
        DRY_RUN: '1',
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`
      },
      encoding: 'utf-8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[dry-run] npm run development:update-version -- patch');
    expect(result.stdout).toContain('[dry-run] npm i');
    expect(result.stdout).not.toContain('git add');
  });

  it('keeps git staging and publishing in the finalize step during dry-run release', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'make-upgrade-version-'));
    tempDirs.push(tempDir);

    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ version: '1.2.4' }, null, 2));

    // eslint-disable-next-line sonarjs/no-os-command-from-path -- test executes bash from PATH to run the script in a temp workspace
    const result = spawnSync('bash', [SCRIPT_PATH, 'finalize'], {
      cwd: tempDir,
      env: {
        ...process.env,
        DRY_RUN: '1'
      },
      encoding: 'utf-8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      '[dry-run] git add package.json package-lock.json src/apps/mybandnow/backend/config/swagger/definition.json'
    );
    expect(result.stdout).toContain('[dry-run] git commit -m chore(release): Bump version to v1.2.4');
    expect(result.stdout).toContain('[dry-run] git tag -a v1.2.4 -m v1.2.4');
    expect(result.stdout).toContain('[dry-run] git push origin --tags');
    expect(result.stdout).toContain('[dry-run] git push origin master');
    expect(result.stdout).not.toContain('npm run development:update-version');
  });
});

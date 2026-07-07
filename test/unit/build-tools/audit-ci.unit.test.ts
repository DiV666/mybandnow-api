import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const TEST_FILE_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(TEST_FILE_PATH), '..', '..', '..');
const SCRIPT_PATH = join(REPO_ROOT, 'build-tools', 'audit-ci.sh');

const auditJson = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {
    anymatch: {
      name: 'anymatch',
      severity: 'moderate',
      via: ['micromatch']
    },
    braces: {
      name: 'braces',
      severity: 'high',
      via: [
        {
          url: 'https://github.com/advisories/GHSA-grv7-fg5c-xmjg',
          severity: 'high'
        }
      ]
    },
    micromatch: {
      name: 'micromatch',
      severity: 'high',
      via: [
        {
          url: 'https://github.com/advisories/GHSA-952p-6rrq-rcjv',
          severity: 'moderate'
        },
        'braces'
      ]
    },
    readdirp: {
      name: 'readdirp',
      severity: 'moderate',
      via: ['micromatch']
    }
  },
  metadata: {
    vulnerabilities: {
      moderate: 2,
      high: 2,
      critical: 0
    }
  }
});

describe('build-tools/audit-ci.sh', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    tempDirs.forEach((path) => rmSync(path, { recursive: true, force: true }));
    tempDirs.length = 0;
  });

  it('passes when every advisory is allowlisted by GHSA id', () => {
    const result = runAuditScript({
      config: {
        'advisory-allowlist': {
          'GHSA-grv7-fg5c-xmjg': {
            expiresOn: '2099-07-15',
            reason: 'Waiting for upstream fix in cpx dependency tree'
          },
          'GHSA-952p-6rrq-rcjv': {
            expiresOn: '2099-07-15'
          }
        }
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('GHSA-grv7-fg5c-xmjg');
    expect(result.stdout).toContain('GHSA-952p-6rrq-rcjv');
  });

  it('fails when a GHSA allowlist entry is expired', () => {
    const result = runAuditScript({
      config: {
        'advisory-allowlist': {
          'GHSA-grv7-fg5c-xmjg': {
            expiresOn: '2000-01-01'
          },
          'GHSA-952p-6rrq-rcjv': {
            expiresOn: '2099-07-15'
          }
        }
      }
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('GHSA-grv7-fg5c-xmjg');
    expect(result.stdout).toContain('expired');
  });

  it('keeps backward compatibility for package allowlist entries', () => {
    const result = runAuditScript({
      config: {
        'package-allowlist': {
          anymatch: {
            expiresOn: '2099-07-15'
          },
          braces: {
            expiresOn: '2099-07-15'
          },
          micromatch: {
            expiresOn: '2099-07-15'
          },
          readdirp: {
            expiresOn: '2099-07-15'
          }
        }
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('package allowlist');
  });

  function runAuditScript({ config }: { config: object }) {
    const tempDir = mkdtempSync(join(tmpdir(), 'audit-ci-'));
    tempDirs.push(tempDir);

    writeFileSync(join(tempDir, '.audit-ci.json'), `${JSON.stringify(config, null, 2)}\n`);

    const fakeBinDir = join(tempDir, 'bin');
    mkdirSync(fakeBinDir, { recursive: true });
    writeFileSync(
      join(fakeBinDir, 'npm'),
      `#!/bin/sh
if printf '%s ' "$@" | grep -q -- '--json'; then
  cat <<'EOF'
${auditJson}
EOF
  exit 1
fi

printf 'Mock npm audit report\nGHSA-grv7-fg5c-xmjg\nGHSA-952p-6rrq-rcjv\n'
exit 1
`,
      { mode: 0o755 }
    );

    // eslint-disable-next-line sonarjs/no-os-command-from-path -- test injects a fake npm binary via PATH on purpose
    return spawnSync('bash', [SCRIPT_PATH], {
      cwd: tempDir,
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`
      },
      encoding: 'utf-8'
    });
  }
});

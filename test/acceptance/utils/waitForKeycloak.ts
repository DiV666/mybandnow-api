import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_INTERVAL_MS = 1_000;

export type KeycloakProbe = (url: string) => Promise<void>;

interface WaitForKeycloakOptions {
  origin: string;
  timeoutMs?: number;
  intervalMs?: number;
  probe?: KeycloakProbe;
}

export async function waitForKeycloak({
  origin,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  intervalMs = DEFAULT_INTERVAL_MS,
  probe = defaultProbe
}: WaitForKeycloakOptions): Promise<void> {
  const readinessUrl = `${origin}/realms/master/.well-known/openid-configuration`;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    try {
      await probe(readinessUrl);
      return;
    } catch (error) {
      lastError = error;
    }

    if (Date.now() > deadline) {
      break;
    }

    await sleep(intervalMs);
  }

  const message = `Timed out waiting for Keycloak readiness at ${readinessUrl} after ${timeoutMs}ms`;

  throw new Error(lastError instanceof Error ? `${message}. Last error: ${lastError.message}` : message);
}

async function defaultProbe(url: string): Promise<void> {
  await axios.get(url);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

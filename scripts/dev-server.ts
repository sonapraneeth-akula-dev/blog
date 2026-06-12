import { spawn, type ChildProcess } from 'node:child_process';

/**
 * Supervises the Astro dev server inside the dev container.
 *
 * Astro restarts its dev server in-process whenever it believes a config file
 * changed. Under Docker bind-mount polling (Windows/macOS), that in-process
 * restart can hang and never rebind the port, leaving the container "up" but
 * unreachable (so Caddy returns 502). This watchdog probes the HTTP port and,
 * if the server exits or stops responding, kills its process group and
 * relaunches it — so the dev site recovers without a manual `docker restart`.
 */

const PORT = Number(process.env.PORT ?? 4322);
const PROBE_URL = `http://127.0.0.1:${PORT}/`;
const PROBE_INTERVAL_MS = 5_000;
const STARTUP_GRACE_MS = 30_000; // first boot + Vite dependency optimisation
const MAX_FAILED_PROBES = 3; // ~15s unresponsive ⇒ treat as hung
const RESTART_BACKOFF_MS = 1_000;

let child: ChildProcess | null = null;
let startedAt = 0;
let failedProbes = 0;
let shuttingDown = false;

function start(): void {
  failedProbes = 0;
  startedAt = Date.now();
  console.log('[dev-server] Starting Astro dev server…');
  // `detached` puts the server in its own process group so we can reliably kill
  // the whole tree (bun → node astro) when it hangs, avoiding orphans.
  const c = spawn('bun', ['run', 'dev'], { stdio: 'inherit', detached: true });
  child = c;
  c.on('exit', (code, signal) => {
    if (child !== c || shuttingDown) return; // superseded by a restart / shutting down
    child = null;
    console.error(
      `[dev-server] Astro dev exited (code=${code ?? '-'} signal=${signal ?? '-'}); restarting…`,
    );
    setTimeout(start, RESTART_BACKOFF_MS);
  });
}

function restart(reason: string): void {
  const old = child;
  child = null; // detach first so its exit handler becomes a no-op
  console.error(`[dev-server] ${reason} — restarting dev server.`);
  if (old?.pid) {
    try {
      process.kill(-old.pid, 'SIGKILL'); // kill the whole process group
    } catch {
      try {
        old.kill('SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
  setTimeout(start, RESTART_BACKOFF_MS);
}

async function probe(): Promise<void> {
  if (!child) return;
  if (Date.now() - startedAt < STARTUP_GRACE_MS) return; // still booting
  try {
    await fetch(PROBE_URL, { signal: AbortSignal.timeout(4_000) });
    failedProbes = 0; // any HTTP response means the port is bound and serving
  } catch {
    failedProbes += 1;
    console.warn(`[dev-server] Health probe failed (${failedProbes}/${MAX_FAILED_PROBES}).`);
    if (failedProbes >= MAX_FAILED_PROBES) {
      restart('Dev server is unresponsive');
    }
  }
}

function shutdown(): void {
  shuttingDown = true;
  if (child?.pid) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  }
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
setInterval(probe, PROBE_INTERVAL_MS);

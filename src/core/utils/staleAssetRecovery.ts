const RELOAD_KEY = 'lago_chunk_reload'
const RELOAD_COOLDOWN_MS = 10_000

export function hasReloadedRecently(): boolean {
  try {
    const timestamp = sessionStorage.getItem(RELOAD_KEY)

    if (!timestamp) return false

    return Date.now() - parseInt(timestamp, 10) < RELOAD_COOLDOWN_MS
  } catch {
    // Storage unavailable (blocked, partitioned, sandboxed iframe)
    // Assume already reloaded to avoid infinite reload loop
    return true
  }
}

export function markReloaded(): void {
  try {
    sessionStorage.setItem(RELOAD_KEY, Date.now().toString())
  } catch {
    // Storage became unavailable after hasReloadedRecently() check.
    // In environments where sessionStorage is always unavailable,
    // hasReloadedRecently() returns true and we never reach the reload path.
  }
}

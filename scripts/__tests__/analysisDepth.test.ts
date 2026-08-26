import { execFileSync } from 'child_process'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const SCRIPT = join(__dirname, '..', 'analysis-depth.sh')

type Result = { stdout: string; stderr: string; status: number }

let stateDir: string

/**
 * The latch exists to make de-escalation impossible rather than merely discouraged, so the
 * assertions below drive it through the executable the way the skill does.
 */
const run = (args: string[]): Result => {
  try {
    const stdout = execFileSync(SCRIPT, args, {
      encoding: 'utf8',
      env: { ...process.env, ITER_STATE_DIR: stateDir },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    return { stdout: stdout.trim(), stderr: '', status: 0 }
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; status?: number }

    return {
      stdout: (failure.stdout || '').trim(),
      stderr: (failure.stderr || '').trim(),
      status: failure.status ?? 1,
    }
  }
}

const set = (tier: string): Result => run(['TICKET-1', 'set', tier])

beforeEach(() => {
  stateDir = mkdtempSync(join(tmpdir(), 'analysis-depth-'))
})

afterEach(() => {
  rmSync(stateDir, { recursive: true, force: true })
})

describe('analysis-depth.sh', () => {
  it('reports "unset" before anything is recorded', () => {
    expect(run(['TICKET-1', 'get'])).toMatchObject({ stdout: 'unset', status: 0 })
  })

  it.each(['skip', 'shallow', 'full'])('records %s', (tier) => {
    expect(set(tier)).toMatchObject({ stdout: tier, status: 0 })
    expect(run(['TICKET-1', 'get']).stdout).toBe(tier)
  })

  describe('escalation is allowed', () => {
    it.each([
      ['skip', 'shallow'],
      ['skip', 'full'],
      ['shallow', 'full'],
    ])('allows %s -> %s', (from, to) => {
      set(from)

      expect(set(to)).toMatchObject({ stdout: to, status: 0 })
      expect(run(['TICKET-1', 'get']).stdout).toBe(to)
    })
  })

  describe('de-escalation is refused', () => {
    it.each([
      ['full', 'shallow'],
      ['full', 'skip'],
      ['shallow', 'skip'],
    ])('refuses %s -> %s and keeps the recorded tier', (from, to) => {
      set(from)

      const result = set(to)

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('would de-escalate')
      expect(run(['TICKET-1', 'get']).stdout).toBe(from)
    })
  })

  it('treats setting the same tier again as a no-op, not a de-escalation', () => {
    set('shallow')

    expect(set('shallow')).toMatchObject({ stdout: 'shallow', status: 0 })
  })

  it('rejects an unknown tier without touching the recorded one', () => {
    set('shallow')

    const result = set('deep')

    expect(result.status).toBe(64)
    expect(result.stderr).toContain('unknown tier')
    expect(run(['TICKET-1', 'get']).stdout).toBe('shallow')
  })

  it('reset clears the latch so a re-triage starts free', () => {
    set('full')

    expect(run(['TICKET-1', 'reset']).stdout).toBe('reset')
    expect(run(['TICKET-1', 'get']).stdout).toBe('unset')
    expect(set('shallow')).toMatchObject({ stdout: 'shallow', status: 0 })
  })

  it('keeps the latch separate per issue', () => {
    set('full')

    expect(run(['TICKET-2', 'get']).stdout).toBe('unset')
  })

  it('exits 64 on missing or unknown arguments', () => {
    expect(run([]).status).toBe(64)
    expect(run(['TICKET-1']).status).toBe(64)
    expect(run(['TICKET-1', 'bogus']).status).toBe(64)
  })
})

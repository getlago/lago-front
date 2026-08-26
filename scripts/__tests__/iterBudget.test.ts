import { execFileSync } from 'child_process'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const SCRIPT = join(__dirname, '..', 'iter-budget.sh')

type Result = { stdout: string; status: number }

let stateDir: string

/**
 * The cap this script enforces is a documented contract other skills rely on, so the
 * assertions below exercise it the way a caller does — through the executable, with a
 * throwaway state dir per test so counters never leak between cases.
 */
const run = (args: string[], env: Record<string, string> = {}): Result => {
  try {
    const stdout = execFileSync(SCRIPT, args, {
      encoding: 'utf8',
      env: { ...process.env, ITER_STATE_DIR: stateDir, ...env },
    })

    return { stdout: stdout.trim(), status: 0 }
  } catch (error) {
    const failure = error as { stdout?: string; status?: number }

    return { stdout: (failure.stdout || '').trim(), status: failure.status ?? 1 }
  }
}

const charge = (counter: string, times: number, env?: Record<string, string>): Result[] =>
  Array.from({ length: times }, () => run(['TICKET-1', counter], env))

beforeEach(() => {
  stateDir = mkdtempSync(join(tmpdir(), 'iter-budget-'))
})

afterEach(() => {
  rmSync(stateDir, { recursive: true, force: true })
})

describe('iter-budget.sh', () => {
  describe('built-in caps', () => {
    it('allows two triage-review attempts and refuses the third', () => {
      const results = charge('triage-review', 3)

      expect(results.map((r) => [r.stdout, r.status])).toEqual([
        ['1/2', 0],
        ['2/2', 0],
        ['3/2', 1],
      ])
    })

    it('keeps the default cap of three for the loop counters', () => {
      for (const counter of ['review', 'ci', 'ci-revise']) {
        stateDir = mkdtempSync(join(tmpdir(), 'iter-budget-'))

        const results = charge(counter, 4)

        expect(results.map((r) => [r.stdout, r.status])).toEqual([
          ['1/3', 0],
          ['2/3', 0],
          ['3/3', 0],
          ['4/3', 1],
        ])
      }
    })
  })

  describe('override precedence', () => {
    it('lets a per-counter override win over the built-in cap', () => {
      expect(charge('triage-review', 1, { ITER_MAX_TRIAGE_REVIEW: '1' })[0]).toEqual({
        stdout: '1/1',
        status: 0,
      })
    })

    it('does NOT let the global default widen a built-in cap', () => {
      // Raising ITER_MAX for CI retries must never widen a budget that is part of a
      // documented contract.
      expect(charge('triage-review', 1, { ITER_MAX: '9' })[0].stdout).toBe('1/2')
    })

    it('applies the global default to counters without a built-in cap', () => {
      expect(charge('review', 1, { ITER_MAX: '5' })[0].stdout).toBe('1/5')
    })

    it('prefers the per-counter override over the global default', () => {
      expect(charge('review', 1, { ITER_MAX: '5', ITER_MAX_REVIEW: '2' })[0].stdout).toBe('1/2')
    })
  })

  describe('deprecated LOOP_ aliases', () => {
    it('honours LOOP_MAX_ITER as the global default', () => {
      expect(charge('review', 1, { ITER_MAX: '', LOOP_MAX_ITER: '5' })[0].stdout).toBe('1/5')
    })

    it('honours LOOP_MAX_ITER_<COUNTER> as a per-counter override', () => {
      expect(charge('triage-review', 1, { LOOP_MAX_ITER_TRIAGE_REVIEW: '4' })[0].stdout).toBe('1/4')
    })

    it('prefers the new name when both are set', () => {
      expect(charge('review', 1, { ITER_MAX: '7', LOOP_MAX_ITER: '2' })[0].stdout).toBe('1/7')
    })

    it('resolves the state dir from LOOP_STATE_DIR when ITER_STATE_DIR is unset', () => {
      const legacyDir = mkdtempSync(join(tmpdir(), 'iter-budget-legacy-'))

      try {
        const stdout = execFileSync(SCRIPT, ['TICKET-1', 'review'], {
          encoding: 'utf8',
          env: { ...process.env, ITER_STATE_DIR: '', LOOP_STATE_DIR: legacyDir },
        })

        expect(stdout.trim()).toBe('1/3')
      } finally {
        rmSync(legacyDir, { recursive: true, force: true })
      }
    })
  })

  describe('reset', () => {
    it('clears a single counter and leaves the others alone', () => {
      charge('triage-review', 2)
      charge('review', 1)

      expect(run(['TICKET-1', 'reset', 'triage-review']).stdout).toBe('reset')
      expect(charge('triage-review', 1)[0].stdout).toBe('1/2')
      expect(charge('review', 1)[0].stdout).toBe('2/3')
    })

    it('clears every counter when no counter is named', () => {
      charge('triage-review', 2)
      charge('review', 2)

      run(['TICKET-1', 'reset'])

      expect(run(['TICKET-1', 'show']).stdout).toBe('no counters yet')
    })
  })

  describe('show', () => {
    it('reports each counter against its own cap and exits 0', () => {
      charge('triage-review', 1)
      charge('review', 1)

      const result = run(['TICKET-1', 'show'])

      expect(result.status).toBe(0)
      expect(result.stdout.split('\n').sort()).toEqual(['review=1/3', 'triage-review=1/2'])
    })

    it('exits 0 when nothing has been charged yet', () => {
      expect(run(['TICKET-1', 'show'])).toEqual({ stdout: 'no counters yet', status: 0 })
    })
  })

  describe('isolation', () => {
    it('keeps counters separate per issue', () => {
      charge('triage-review', 2)

      expect(run(['TICKET-2', 'triage-review']).stdout).toBe('1/2')
    })
  })

  describe('usage', () => {
    it('exits 64 when arguments are missing', () => {
      expect(run(['TICKET-1']).status).toBe(64)
      expect(run([]).status).toBe(64)
    })
  })
})

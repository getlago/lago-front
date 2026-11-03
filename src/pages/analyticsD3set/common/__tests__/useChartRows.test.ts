import { act, renderHook } from '@testing-library/react'
import { sseSource } from 'd3set/core'

import { AUTH_TOKEN_LS_KEY, setCurrentOrganizationId } from '~/core/apolloClient/reactiveVars'

import { useChartRows } from '../useChartRows'

jest.mock('d3set/core', () => ({
  ...jest.requireActual('d3set/core'),
  sseSource: jest.fn(),
}))

type RowsListener = (rows: Record<string, unknown>[]) => void

const mockSource = (): { emit: RowsListener; close: jest.Mock } => {
  let listener: RowsListener = () => undefined
  const close = jest.fn()

  ;(sseSource as jest.Mock).mockImplementation(() => ({
    rows: () => [],
    subscribe: (next: RowsListener) => {
      listener = next
      next([])

      return () => undefined
    },
    onState: () => () => undefined,
    setParams: jest.fn(),
    close,
  }))

  return { emit: (rows) => listener(rows), close }
}

describe('useChartRows', () => {
  afterEach(() => {
    localStorage.clear()
    setCurrentOrganizationId(null)
  })

  it('GIVEN a chart WHEN mounted THEN it opens its event stream with the auth headers and the params', () => {
    localStorage.setItem(AUTH_TOKEN_LS_KEY, 'token-1')
    setCurrentOrganizationId('org-1')
    mockSource()

    renderHook(() =>
      useChartRows({
        baseUrl: 'http://a.test',
        chartId: 'chart-1',
        params: { amount_currency: ['EUR'], page: '0' },
      }),
    )

    expect(sseSource).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://a.test/api/charts/chart-1/events',
        headers: { authorization: 'Bearer token-1', 'x-lago-organization': 'org-1' },
        params: { amount_currency: ['EUR'], page: '0' },
        mode: 'replace',
      }),
    )
  })

  it('GIVEN a message WHEN it arrives THEN the rows and the total are ready', () => {
    const source = mockSource()
    const { result, unmount } = renderHook(() =>
      useChartRows({ baseUrl: 'http://a.test', chartId: 'chart-1', params: {} }),
    )

    expect(result.current.status).toBe('loading')

    const { parse } = (sseSource as jest.Mock).mock.calls.at(-1)[0]

    act(() => {
      parse('{"op":"replace","rows":[{"a":1}],"total":42}')
      source.emit([{ a: 1 }])
    })

    expect(result.current).toEqual({ rows: [{ a: 1 }], total: 42, status: 'ready' })

    unmount()
    expect(source.close).toHaveBeenCalled()
  })
})

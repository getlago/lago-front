import { render, screen } from '@testing-library/react'

import { VirtualFilterList, VIRTUALIZATION_THRESHOLD } from '../VirtualFilterList'

// jsdom renders 0 virtual rows (0px viewport); stub the virtualizer to yield
// every row so we exercise OUR rendering paths, not the virtualizer internals.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 64,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({ index, start: index * 64, key: index })),
    measureElement: () => {},
  }),
}))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver = ResizeObserverMock
})

const makeItems = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `f${i}` }))

const renderList = (count: number) =>
  render(
    <div style={{ overflowY: 'auto' }}>
      <VirtualFilterList
        items={makeItems(count)}
        getItemKey={(item) => item.id}
        estimateItemHeight={64}
        renderItem={(item) => <div data-testid="row">{item.id}</div>}
      />
    </div>,
  )

describe('VirtualFilterList', () => {
  it('renders a plain list at or below the threshold (no virtualization wrappers)', () => {
    const { container } = renderList(VIRTUALIZATION_THRESHOLD)

    expect(screen.getAllByTestId('row')).toHaveLength(VIRTUALIZATION_THRESHOLD)
    // Plain path: rows are not the absolutely-positioned virtual rows.
    expect(container.querySelector('[data-index]')).toBeNull()
  })

  it('renders through the virtualized path above the threshold', () => {
    const { container } = renderList(VIRTUALIZATION_THRESHOLD + 1)

    // Virtualized path: each row carries data-index inside the positioned spacer.
    expect(container.querySelector('[data-index="0"]')).not.toBeNull()
    expect(screen.getAllByTestId('row')).toHaveLength(VIRTUALIZATION_THRESHOLD + 1)
  })
})

import { render, screen } from '@testing-library/react'

import { VIRTUALIZATION_THRESHOLD, VirtualFilterList } from '../VirtualFilterList'

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
  it('renders every row when at or below the threshold (no virtualization)', () => {
    renderList(VIRTUALIZATION_THRESHOLD)
    expect(screen.getAllByTestId('row')).toHaveLength(VIRTUALIZATION_THRESHOLD)
  })

  it('renders only a bounded subset of rows above the threshold', () => {
    // jsdom reports a 0px scroll viewport, so the virtualizer mounts only
    // overscan rows. The contract we assert: virtualization renders strictly
    // fewer than the full set (and at least one row).
    const total = 5000

    renderList(total)
    const rendered = screen.getAllByTestId('row').length

    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(total)
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
import { partitionTabs } from '../tabs-overflow-layout'

const items = ['a', 'b', 'c', 'd'].map((value) => ({ value, width: 80 }))

describe('overflow layout', () => {
  it('restores source order when all items fit', () => {
    expect(partitionTabs(items, 400, 60, 'd', 'd')).toEqual({
      visible: ['a', 'b', 'c', 'd'],
      hidden: [],
    })
  })
  it('replaces the last visible slot and puts the displaced tab in source order', () => {
    expect(partitionTabs(items, 240, 60, 'd', 'd')).toEqual({
      visible: ['a', 'd'],
      hidden: ['b', 'c'],
    })
  })
  it('keeps the active tab when an old promotion no longer fits', () => {
    expect(partitionTabs(items, 240, 60, 'b', 'd').visible).toContain('b')
  })
  it('keeps the selected tab at very narrow widths', () => {
    expect(partitionTabs(items, 100, 60, 'd')).toEqual({ visible: ['d'], hidden: ['a', 'b', 'c'] })
  })
  it('removes additional trailing tabs for a long selected item', () => {
    expect(
      partitionTabs([...items, { value: 'long', width: 200 }], 300, 60, 'long').visible,
    ).toEqual(['long'])
  })
})

describe('Tabs', () => {
  it('uses manual keyboard activation and skips disabled tabs', async () => {
    const user = userEvent.setup()

    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Sections">
          <TabsTrigger value="a">First</TabsTrigger>
          <TabsTrigger value="disabled" disabled>
            Unavailable
          </TabsTrigger>
          <TabsTrigger value="b">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="a">First panel</TabsContent>
        <TabsContent value="b">Second panel</TabsContent>
      </Tabs>,
    )
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Second' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('First panel')
    await user.keyboard('{Enter}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second panel')
    expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-selected', 'true')
  })
})

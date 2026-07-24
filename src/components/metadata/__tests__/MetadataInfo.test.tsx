import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { MetadataInfo } from '../MetadataInfo'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('MetadataInfo', () => {
  describe('GIVEN a list of metadata pairs', () => {
    describe('WHEN the component renders', () => {
      it.each([
        ['first key', 'product_group'],
        ['first value', 'Premium Suite'],
        ['second key', 'display_order'],
        ['second value', '2'],
      ])('THEN should display the %s', (_, text) => {
        render(
          <MetadataInfo
            metadata={[
              { key: 'product_group', value: 'Premium Suite' },
              { key: 'display_order', value: '2' },
            ]}
          />,
        )

        expect(screen.getByText(text)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a pair with an empty or null value', () => {
    describe('WHEN the component renders', () => {
      it.each([
        ['empty string value', ''],
        ['null value', null],
        ['undefined value', undefined],
      ])('THEN should render a dash placeholder for %s', (_, value) => {
        render(<MetadataInfo metadata={[{ key: 'empty_key', value }]} />)

        expect(screen.getByText('empty_key')).toBeInTheDocument()
        expect(screen.getByText('-')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an empty metadata list', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render no rows', () => {
        const { container } = render(<MetadataInfo metadata={[]} />)

        // Only the outer flex wrapper, no row children
        expect(container.querySelector('.flex.flex-col')?.childElementCount).toBe(0)
      })
    })
  })
})

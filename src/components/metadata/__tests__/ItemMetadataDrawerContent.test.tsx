import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { MAX_ITEM_METADATA_COUNT } from '../constants'
import {
  ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID,
  ItemMetadataDrawerContent,
} from '../ItemMetadataDrawerContent'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

type Pair = { key: string; value: string }

const Wrapper = ({ initialMetadata = [] }: { initialMetadata?: Pair[] }) => {
  const form = useAppForm({ defaultValues: { metadata: initialMetadata } })

  return <ItemMetadataDrawerContent form={form} description="Owner specific copy" />
}

const getTrashButtons = () => {
  const addButton = screen.getByTestId(ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID)

  return screen.getAllByRole('button').filter((button) => button !== addButton)
}

describe('ItemMetadataDrawerContent', () => {
  describe('GIVEN no metadata', () => {
    describe('WHEN the content renders', () => {
      it('THEN should render no metadata rows', () => {
        render(<Wrapper />)

        expect(screen.queryAllByRole('textbox')).toHaveLength(0)
      })

      it('THEN should render the add row button enabled', () => {
        render(<Wrapper />)

        expect(screen.getByTestId(ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN pre-existing metadata pairs', () => {
    describe('WHEN the content renders', () => {
      it('THEN should render one key + one value input per pair', () => {
        render(
          <Wrapper
            initialMetadata={[
              { key: 'product_group', value: 'Premium Suite' },
              { key: 'display_order', value: '2' },
            ]}
          />,
        )

        expect(screen.getAllByRole('textbox')).toHaveLength(4)
      })

      it.each([
        ['first key', 'product_group'],
        ['first value', 'Premium Suite'],
        ['second key', 'display_order'],
        ['second value', '2'],
      ])('THEN should prefill the %s input', (_, value) => {
        render(
          <Wrapper
            initialMetadata={[
              { key: 'product_group', value: 'Premium Suite' },
              { key: 'display_order', value: '2' },
            ]}
          />,
        )

        expect(screen.getByDisplayValue(value)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user manages rows', () => {
    describe('WHEN clicking the add row button on an empty list', () => {
      it('THEN should append one empty pair (key + value inputs)', async () => {
        const user = userEvent.setup()

        render(<Wrapper />)

        await user.click(screen.getByTestId(ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID))

        expect(screen.getAllByRole('textbox')).toHaveLength(2)
      })
    })

    describe('WHEN clicking the add row button with existing pairs', () => {
      it('THEN should append an extra row', async () => {
        const user = userEvent.setup()

        render(<Wrapper initialMetadata={[{ key: 'k', value: 'v' }]} />)

        expect(screen.getAllByRole('textbox')).toHaveLength(2)

        await user.click(screen.getByTestId(ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID))

        expect(screen.getAllByRole('textbox')).toHaveLength(4)
      })
    })

    describe('WHEN clicking a row delete button', () => {
      it('THEN should remove that row', async () => {
        const user = userEvent.setup()

        render(
          <Wrapper
            initialMetadata={[
              { key: 'k1', value: 'v1' },
              { key: 'k2', value: 'v2' },
            ]}
          />,
        )

        expect(screen.getAllByRole('textbox')).toHaveLength(4)

        await user.click(getTrashButtons()[0])

        expect(screen.getAllByRole('textbox')).toHaveLength(2)
      })
    })
  })

  describe('GIVEN the maximum number of pairs', () => {
    describe('WHEN the list is at the limit', () => {
      it('THEN should disable the add row button', () => {
        const maxedOut = Array.from({ length: MAX_ITEM_METADATA_COUNT }, (_, index) => ({
          key: `key_${index}`,
          value: `value_${index}`,
        }))

        render(<Wrapper initialMetadata={maxedOut} />)

        expect(screen.getByTestId(ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the list is one below the limit', () => {
      it('THEN should keep the add row button enabled', () => {
        const almostMaxed = Array.from({ length: MAX_ITEM_METADATA_COUNT - 1 }, (_, index) => ({
          key: `key_${index}`,
          value: `value_${index}`,
        }))

        render(<Wrapper initialMetadata={almostMaxed} />)

        expect(screen.getByTestId(ADD_ITEM_METADATA_DRAWER_ROW_TEST_ID)).not.toBeDisabled()
      })
    })
  })
})

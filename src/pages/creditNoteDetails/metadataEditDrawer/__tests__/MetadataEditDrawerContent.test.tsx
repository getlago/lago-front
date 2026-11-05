import { revalidateLogic } from '@tanstack/react-form'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID,
  MetadataEditDrawerContent,
} from '../MetadataEditDrawerContent'
import {
  CREDIT_NOTE_METADATA_KEY_MAX_LENGTH,
  CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH,
  MAX_CREDIT_NOTE_METADATA_COUNT,
  metadataEditValidationSchema,
} from '../validationSchema'

const LABELS: Record<string, string> = {
  text_176466851340792f3wzvqvb8: 'Edit Metadata',
  text_17646706795118k0wulsr7oq: 'Metadata will be linked to the credit note',
  text_63fcc3218d35b9377840f59b: 'Metadata',
  text_1764595550459v75grmg3do9: 'Include metadata on this credit note',
  text_63fcc3218d35b9377840f5a3: 'Key',
  text_63fcc3218d35b9377840f5ab: 'Value',
  text_63fcc3218d35b9377840f5a7: 'Enter a key',
  text_63fcc3218d35b9377840f5af: 'Enter a value',
  text_63fcc3218d35b9377840f5bb: 'Add new field',
  text_63fcc3218d35b9377840f5e1: 'Remove metadata',
  text_63fcc3218d35b9377840f5dd: 'Keys should be unique',
  text_63fcc3218d35b9377840f5d9: 'Key must be under {{max}} characters',
  text_63fcc3218d35b9377840f5e5: 'Value must be {{max}} characters maximum',
  text_1764753433918x3icklnboak: 'Metadata key is required',
  text_1764753433918nlsnvdnwjmo: 'Metadata value is required',
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, variables?: Record<string, string | number>) => {
      const label = LABELS[key] ?? key

      if (!variables) return label

      return Object.entries(variables).reduce(
        (acc, [name, value]) => acc.replace(`{{${name}}}`, String(value)),
        label,
      )
    },
  }),
}))

const SUBMIT_TEST_ID = 'content-test-submit'

type MetadataRow = { key: string; value: string }

const Wrapper = ({ initialMetadata = [] }: { initialMetadata?: MetadataRow[] }) => {
  const form = useAppForm({
    defaultValues: { metadata: initialMetadata },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: metadataEditValidationSchema },
    onSubmit: () => undefined,
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <MetadataEditDrawerContent form={form} />
      <button type="submit" data-test={SUBMIT_TEST_ID}>
        submit
      </button>
    </form>
  )
}

const getTrashButtons = (): HTMLElement[] => {
  const addButton = screen.getByTestId(ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID)
  const submitButton = screen.getByTestId(SUBMIT_TEST_ID)

  return screen
    .getAllByRole('button')
    .filter((button) => button !== addButton && button !== submitButton)
}

const buildRows = (count: number): MetadataRow[] =>
  Array.from({ length: count }, (_, index) => ({
    key: `key_${index}`,
    value: `value_${index}`,
  }))

describe('MetadataEditDrawerContent', () => {
  describe('GIVEN the drawer body renders', () => {
    describe('WHEN there is no metadata', () => {
      it('THEN should render no metadata row', () => {
        render(<Wrapper />)

        expect(screen.queryAllByRole('textbox')).toHaveLength(0)
      })

      it('THEN should keep the add row button enabled', () => {
        render(<Wrapper />)

        expect(screen.getByTestId(ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID)).not.toBeDisabled()
      })

      it('THEN should not render the column headers', () => {
        render(<Wrapper />)

        expect(screen.queryByText(LABELS.text_63fcc3218d35b9377840f5a3)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the copy of the Formik drawer is expected', () => {
      it.each([
        ['drawer headline', LABELS.text_176466851340792f3wzvqvb8],
        ['drawer description', LABELS.text_17646706795118k0wulsr7oq],
        ['section title', LABELS.text_63fcc3218d35b9377840f59b],
        ['section caption', LABELS.text_1764595550459v75grmg3do9],
        ['add row button label', LABELS.text_63fcc3218d35b9377840f5bb],
      ])('THEN should render the %s', (_, label) => {
        render(<Wrapper />)

        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN pre-existing metadata', () => {
    const metadata: MetadataRow[] = [
      { key: 'order_id', value: 'ORD-12345' },
      { key: 'department', value: 'Sales' },
    ]

    describe('WHEN the body renders', () => {
      it('THEN should render one key and one value input per row', () => {
        render(<Wrapper initialMetadata={metadata} />)

        expect(screen.getAllByRole('textbox')).toHaveLength(4)
      })

      it.each([
        ['first key', 'order_id'],
        ['first value', 'ORD-12345'],
        ['second key', 'department'],
        ['second value', 'Sales'],
      ])('THEN should prefill the %s input', (_, value) => {
        render(<Wrapper initialMetadata={metadata} />)

        expect(screen.getByDisplayValue(value)).toBeInTheDocument()
      })

      it.each([
        ['key column header', LABELS.text_63fcc3218d35b9377840f5a3],
        ['value column header', LABELS.text_63fcc3218d35b9377840f5ab],
      ])('THEN should render the %s once', (_, label) => {
        render(<Wrapper initialMetadata={metadata} />)

        expect(screen.getAllByText(label)).toHaveLength(1)
      })
    })
  })

  describe('GIVEN the user manages rows', () => {
    describe('WHEN clicking the add row button', () => {
      it('THEN should append an empty row', async () => {
        const user = userEvent.setup()

        render(<Wrapper />)

        await user.click(screen.getByTestId(ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID))

        expect(screen.getAllByRole('textbox')).toHaveLength(2)
      })
    })

    describe('WHEN clicking a row remove button', () => {
      it('THEN should remove only that row', async () => {
        const user = userEvent.setup()

        render(
          <Wrapper
            initialMetadata={[
              { key: 'first', value: 'one' },
              { key: 'second', value: 'two' },
            ]}
          />,
        )

        await user.click(getTrashButtons()[0])

        expect(screen.getAllByRole('textbox')).toHaveLength(2)
        expect(screen.getByDisplayValue('second')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the row cap', () => {
    describe('WHEN the list is at the cap', () => {
      it('THEN should disable the add row button', () => {
        render(<Wrapper initialMetadata={buildRows(MAX_CREDIT_NOTE_METADATA_COUNT)} />)

        expect(screen.getByTestId(ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the list is one row below the cap', () => {
      it('THEN should keep the add row button enabled', () => {
        render(<Wrapper initialMetadata={buildRows(MAX_CREDIT_NOTE_METADATA_COUNT - 1)} />)

        expect(screen.getByTestId(ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN validation runs on submit', () => {
    describe('WHEN nothing has been submitted yet', () => {
      it('THEN should display no error', () => {
        render(<Wrapper initialMetadata={[{ key: '', value: '' }]} />)

        expect(screen.queryByText(LABELS.text_1764753433918x3icklnboak)).not.toBeInTheDocument()
      })
    })

    describe('WHEN submitting a row with an empty key and value', () => {
      it.each([
        ['key', LABELS.text_1764753433918x3icklnboak],
        ['value', LABELS.text_1764753433918nlsnvdnwjmo],
      ])('THEN should display the required %s error', async (_, label) => {
        const user = userEvent.setup()

        render(<Wrapper initialMetadata={[{ key: '', value: '' }]} />)

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByText(label)).toBeInTheDocument()
        })
      })
    })

    describe('WHEN submitting two rows sharing the same key', () => {
      it('THEN should display the uniqueness error on both rows', async () => {
        const user = userEvent.setup()

        render(
          <Wrapper
            initialMetadata={[
              { key: 'duplicate', value: 'one' },
              { key: 'duplicate', value: 'two' },
            ]}
          />,
        )

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getAllByText(LABELS.text_63fcc3218d35b9377840f5dd)).toHaveLength(2)
        })
      })
    })

    describe('WHEN submitting a key over its limit', () => {
      it('THEN should display the key max length error carrying the limit', async () => {
        const user = userEvent.setup()

        render(
          <Wrapper
            initialMetadata={[
              { key: 'a'.repeat(CREDIT_NOTE_METADATA_KEY_MAX_LENGTH + 1), value: 'one' },
            ]}
          />,
        )

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(
            screen.getByText(`Key must be under ${CREDIT_NOTE_METADATA_KEY_MAX_LENGTH} characters`),
          ).toBeInTheDocument()
        })
      })
    })

    describe('WHEN submitting a value over its limit', () => {
      it('THEN should display the value max length error carrying the limit', async () => {
        const user = userEvent.setup()

        render(
          <Wrapper
            initialMetadata={[
              { key: 'one', value: 'a'.repeat(CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH + 1) },
            ]}
          />,
        )

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(
            screen.getByText(
              `Value must be ${CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH} characters maximum`,
            ),
          ).toBeInTheDocument()
        })
      })
    })

    describe('WHEN a row carries both a required and a uniqueness issue', () => {
      it.each([
        ['first', 0],
        ['second', 1],
      ])('THEN should show the required error on the %s key', async (_, index) => {
        const user = userEvent.setup()

        render(
          <Wrapper
            initialMetadata={[
              { key: '', value: 'one' },
              { key: '', value: 'two' },
            ]}
          />,
        )

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getAllByText(LABELS.text_1764753433918x3icklnboak)).toHaveLength(2)
        })
        expect(screen.getAllByText(LABELS.text_1764753433918x3icklnboak)[index]).toBeInTheDocument()
      })
    })

    describe('WHEN a row carries both a max length and a uniqueness issue', () => {
      it('THEN should show the uniqueness error, as the Formik drawer did', async () => {
        const user = userEvent.setup()
        const tooLongKey = 'a'.repeat(CREDIT_NOTE_METADATA_KEY_MAX_LENGTH + 1)

        render(
          <Wrapper
            initialMetadata={[
              { key: tooLongKey, value: 'one' },
              { key: tooLongKey, value: 'two' },
            ]}
          />,
        )

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getAllByText(LABELS.text_63fcc3218d35b9377840f5dd)).toHaveLength(2)
        })
      })
    })

    describe('WHEN the limits inherited from the Formik drawer are exercised', () => {
      it.each([
        ['a key of 40 characters', 'a'.repeat(40), 'v', null],
        ['a key of 41 characters', 'a'.repeat(41), 'v', 'Key must be under 40 characters'],
        ['a value of 255 characters', 'k', 'v'.repeat(255), null],
        ['a value of 256 characters', 'k', 'v'.repeat(256), 'Value must be 255 characters maximum'],
      ])('THEN should handle %s', async (_label, key, value, expectedError) => {
        const user = userEvent.setup()

        render(<Wrapper initialMetadata={[{ key, value }]} />)

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        if (expectedError) {
          await waitFor(() => {
            expect(screen.getByText(expectedError)).toBeInTheDocument()
          })

          return
        }

        await waitFor(() => {
          expect(screen.queryByText(/characters/)).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN a valid row is submitted', () => {
      it('THEN should display no error', async () => {
        const user = userEvent.setup()

        render(<Wrapper initialMetadata={[{ key: 'order_id', value: 'ORD-1' }]} />)

        await user.click(screen.getByTestId(SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByText(LABELS.text_1764753433918x3icklnboak)).not.toBeInTheDocument()
        })
        expect(screen.queryByText(LABELS.text_63fcc3218d35b9377840f5dd)).not.toBeInTheDocument()
      })
    })
  })
})

import { revalidateLogic } from '@tanstack/react-form'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'

import { ADD_METADATA_DATA_TEST } from '~/components/wallets/utils/dataTestConstants'
import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import { useAppForm } from '~/hooks/forms/useAppform'
import { TransactionMetadataGroup } from '~/pages/wallet/components/TransactionMetadataGroup'
import { render } from '~/test-utils'

type MetadataRow = { key: string; value: string }

type FlatFormValues = {
  metadata: MetadataRow[] | undefined
}

type NestedFormValues = {
  rules: Array<{ transactionMetadata: MetadataRow[] | undefined }>
}

// mirrors how the production schemas validate metadata: run the shared zod
// schema and re-prefix its issue paths
const flatValidationSchema = z.custom<FlatFormValues>().superRefine((data, ctx) => {
  if (Array.isArray(data.metadata) && data.metadata.length) {
    const result = zodMetadataSchema().safeParse(data.metadata)

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({ code: 'custom', message: issue.message, path: ['metadata', ...issue.path] })
      })
    }
  }
})

// captures the live form so tests can drive submit and assert values
let lastForm:
  | {
      handleSubmit: () => Promise<void>
      state: { values: FlatFormValues & NestedFormValues }
    }
  | undefined

const FlatWrapper = ({ metadata }: { metadata?: MetadataRow[] }) => {
  const form = useAppForm({
    defaultValues: { metadata } as FlatFormValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: flatValidationSchema },
    onSubmit: async () => {},
  })

  lastForm = form as unknown as typeof lastForm

  return <TransactionMetadataGroup form={form} fields={{ metadata: 'metadata' }} />
}

const NestedWrapper = ({ metadata }: { metadata?: MetadataRow[] }) => {
  const form = useAppForm({
    defaultValues: { rules: [{ transactionMetadata: metadata }] } as NestedFormValues,
    onSubmit: async () => {},
  })

  lastForm = form as unknown as typeof lastForm

  return (
    <TransactionMetadataGroup form={form} fields={{ metadata: 'rules[0].transactionMetadata' }} />
  )
}

const getInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

describe('TransactionMetadataGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no metadata rows', () => {
    describe('WHEN the group renders', () => {
      it('THEN should display the add button and no inputs', () => {
        render(<FlatWrapper />)

        expect(screen.getByTestId(ADD_METADATA_DATA_TEST)).toBeInTheDocument()
        expect(getInput('metadata[0].key')).toBeNull()
      })
    })

    describe('WHEN clicking the add button on an undefined base array', () => {
      it('THEN should create the array with one empty row', async () => {
        const user = userEvent.setup()

        render(<FlatWrapper />)

        await user.click(screen.getByTestId(ADD_METADATA_DATA_TEST))

        await waitFor(() => {
          expect(getInput('metadata[0].key')).toBeInTheDocument()
        })
        expect(getInput('metadata[0].value')).toBeInTheDocument()
        expect(lastForm?.state.values.metadata).toEqual([{ key: '', value: '' }])
      })
    })
  })

  describe('GIVEN existing metadata rows', () => {
    const twoRows: MetadataRow[] = [
      { key: 'first', value: 'a' },
      { key: 'second', value: 'b' },
    ]

    describe('WHEN the group renders', () => {
      it('THEN should display one row per entry with the mapped input names', () => {
        render(<FlatWrapper metadata={twoRows} />)

        expect(getInput('metadata[0].key')).toHaveValue('first')
        expect(getInput('metadata[1].key')).toHaveValue('second')
      })
    })

    describe('WHEN typing into the inputs', () => {
      it('THEN should write through to the form values', async () => {
        const user = userEvent.setup()

        render(<FlatWrapper metadata={[{ key: '', value: '' }]} />)

        await user.type(getInput('metadata[0].key'), 'env')
        await user.type(getInput('metadata[0].value'), 'prod')

        expect(lastForm?.state.values.metadata).toEqual([{ key: 'env', value: 'prod' }])
      })
    })

    describe('WHEN removing the first row', () => {
      it('THEN should keep only the other row', async () => {
        const user = userEvent.setup()

        render(<FlatWrapper metadata={twoRows} />)

        const firstRowTrash = getInput('metadata[0].key')
          .closest('.flex.w-full')
          ?.querySelector('svg[data-test="trash/medium"]')
          ?.closest('button') as HTMLButtonElement

        await user.click(firstRowTrash)

        await waitFor(() => {
          expect(lastForm?.state.values.metadata).toEqual([{ key: 'second', value: 'b' }])
        })
      })
    })
  })

  describe('GIVEN the group is mounted at a nested field path', () => {
    describe('WHEN adding and editing a row', () => {
      it('THEN should read and write through the mapped nested path', async () => {
        const user = userEvent.setup()

        render(<NestedWrapper metadata={[]} />)

        await user.click(screen.getByTestId(ADD_METADATA_DATA_TEST))

        await waitFor(() => {
          expect(getInput('rules[0].transactionMetadata[0].key')).toBeInTheDocument()
        })

        await user.type(getInput('rules[0].transactionMetadata[0].key'), 'env')

        expect(lastForm?.state.values.rules[0].transactionMetadata).toEqual([
          { key: 'env', value: '' },
        ])
      })
    })
  })

  describe('GIVEN invalid metadata rows', () => {
    describe('WHEN submitting with a duplicated key', () => {
      it('THEN should mark the duplicated key input as invalid', async () => {
        render(
          <FlatWrapper
            metadata={[
              { key: 'dup', value: 'a' },
              { key: 'dup', value: 'b' },
            ]}
          />,
        )

        await act(async () => {
          await lastForm?.handleSubmit()
        })

        await waitFor(() => {
          expect(getInput('metadata[1].key')).toHaveAttribute('aria-invalid', 'true')
        })
      })
    })

    describe('WHEN submitting with over-long values', () => {
      it.each([
        ['a key over 20 chars', [{ key: 'x'.repeat(21), value: 'ok' }], 'metadata[0].key'],
        ['a value over 100 chars', [{ key: 'ok', value: 'y'.repeat(101) }], 'metadata[0].value'],
      ])('THEN should mark the offending input as invalid (%s)', async (_, metadata, inputName) => {
        render(<FlatWrapper metadata={metadata} />)

        await act(async () => {
          await lastForm?.handleSubmit()
        })

        await waitFor(() => {
          expect(getInput(inputName)).toHaveAttribute('aria-invalid', 'true')
        })
      })
    })
  })
})

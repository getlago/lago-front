import { revalidateLogic, useStore } from '@tanstack/react-form'
import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { designSystemFormDefaultValues, designSystemValidationSchema } from '../../validationSchema'
import {
  DESIGN_SYSTEM_FORM_ID,
  FORM_TEST_ALL_CONDITIONS_CHECKBOX_TEST_ID,
  FORM_TEST_COMBOBOX_TEST_ID,
  FORM_TEST_SUBMIT_BUTTON_TEST_ID,
  FormTest,
} from '../FormTest'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/form/JsonEditor/JsonEditorFieldForTanstack', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div>{label}</div>,
}))

// jsdom measures a 0-height scroll element, so the real virtualizer renders no
// combobox options — render them all instead (same mock as WalletScopeFields.test.tsx).
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn((config) => {
    const items = Array.from({ length: config.count }, (_, i) => ({
      index: i,
      key: i,
      size: config.estimateSize(i),
      start: Array.from({ length: i }, (__, j) => config.estimateSize(j)).reduce(
        (acc, val) => acc + val,
        0,
      ),
    }))

    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((acc, item) => acc + item.size, 0),
      scrollToIndex: jest.fn(),
      measureElement: jest.fn(),
    }
  }),
}))

const CONDITIONS_STATE_TEST_ID = 'conditions-state'
const SELECTION_STATE_TEST_ID = 'selection-state'

const FormTestWrapper = () => {
  const form = useAppForm({
    defaultValues: designSystemFormDefaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: designSystemValidationSchema },
    onSubmit: () => {},
  })

  const checkboxCond1 = useStore(form.store, (state) => state.values.checkboxCond1)
  const checkboxCond2 = useStore(form.store, (state) => state.values.checkboxCond2)
  const combobox = useStore(form.store, (state) => state.values.combobox)
  const multipleCombobox = useStore(form.store, (state) => state.values.multipleCombobox)

  return (
    <>
      <FormTest form={form} />
      <span data-test={CONDITIONS_STATE_TEST_ID}>{`${checkboxCond1}-${checkboxCond2}`}</span>
      <span data-test={SELECTION_STATE_TEST_ID}>
        {JSON.stringify({ combobox, multipleCombobox })}
      </span>
    </>
  )
}

// The showcase renders five multiple comboboxes and the component does not forward a
// data-test, so the field is reached from its own label.
const inputLabelled = (label: string): HTMLInputElement => {
  let container = screen.getByText(label, { exact: true }).parentElement as HTMLElement

  while (container && container.querySelectorAll('input').length === 0) {
    container = container.parentElement as HTMLElement
  }

  return container.querySelector('input') as HTMLInputElement
}

const storedSelection = (): { combobox?: string; multipleCombobox: { value: string }[] } =>
  JSON.parse(screen.getByTestId(SELECTION_STATE_TEST_ID).textContent as string)

describe('FormTest', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the design-system form tab is rendered', () => {
    describe('WHEN in its default state', () => {
      it('THEN should display the submit button', async () => {
        await act(() => render(<FormTestWrapper />))

        expect(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should submit the form element itself, so Enter in an input submits', async () => {
        const { container } = await act(() => render(<FormTestWrapper />))

        expect(container.querySelector(`form#${DESIGN_SYSTEM_FORM_ID}`)).toBeInTheDocument()
        expect(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID)).toHaveAttribute(
          'type',
          'submit',
        )
      })

      it('THEN should display no error before the first submit attempt', async () => {
        await act(() => render(<FormTestWrapper />))

        expect(screen.queryAllByText("I thought you'd be more fun... 😏")).toHaveLength(0)
      })
    })

    describe('WHEN the answers are submitted', () => {
      it('THEN should display the error of the fields left unanswered', async () => {
        const user = userEvent.setup()

        await act(() => render(<FormTestWrapper />))

        await user.click(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID))

        expect(
          (await screen.findAllByText("I thought you'd be more fun... 😏")).length,
        ).toBeGreaterThan(0)
      })

      it('THEN should keep the submit button enabled so the answers can be checked again', async () => {
        const user = userEvent.setup()

        await act(() => render(<FormTestWrapper />))

        await user.click(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID))

        expect(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID)).not.toBeDisabled()
      })
    })

    // The schema is written against the value each wrapper stores, not against what the
    // option looks like: a mismatch leaves submit dead with no error and no request.
    describe('WHEN an option is picked in the combobox', () => {
      it('THEN should store the option value and satisfy the schema', async () => {
        const user = userEvent.setup()

        await act(() => render(<FormTestWrapper />))

        const input = screen
          .getByTestId(FORM_TEST_COMBOBOX_TEST_ID)
          .querySelector('input') as HTMLInputElement

        await user.click(input)
        await user.click((await screen.findAllByRole('option'))[0])

        expect(storedSelection().combobox).toBe('a-0')
        // Only the joke regex may reject it; a type issue would mean the schema is written
        // against a shape the wrapper never stores.
        expect(
          designSystemValidationSchema.shape.combobox
            .safeParse(storedSelection().combobox)
            .error?.issues.some((issue) => issue.code === 'invalid_type'),
        ).toBeFalsy()
      })
    })

    describe('WHEN an option is picked in the multiple combobox', () => {
      it('THEN should store whole options and satisfy the schema', async () => {
        const user = userEvent.setup()

        await act(() => render(<FormTestWrapper />))

        await user.click(inputLabelled('Multiple'))
        await user.click((await screen.findAllByRole('option'))[0])

        expect(storedSelection().multipleCombobox).toEqual([
          expect.objectContaining({ value: 'a-0' }),
        ])
        expect(
          designSystemValidationSchema.shape.multipleCombobox.safeParse(
            storedSelection().multipleCombobox,
          ).success,
        ).toBe(true)
      })
    })

    describe('WHEN the "accept all conditions" checkbox is toggled', () => {
      it('THEN should drive both condition fields at once', async () => {
        const user = userEvent.setup()

        await act(() => render(<FormTestWrapper />))

        expect(screen.getByTestId(CONDITIONS_STATE_TEST_ID)).toHaveTextContent('true-true')

        await user.click(screen.getByTestId(FORM_TEST_ALL_CONDITIONS_CHECKBOX_TEST_ID))

        expect(screen.getByTestId(CONDITIONS_STATE_TEST_ID)).toHaveTextContent('false-false')
      })
    })
  })
})

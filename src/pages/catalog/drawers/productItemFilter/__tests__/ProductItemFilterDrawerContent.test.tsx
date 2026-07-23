import { MockedProvider } from '@apollo/client/testing'
import { revalidateLogic } from '@tanstack/react-form'
import { act, screen, within } from '@testing-library/react'
import { useEffect } from 'react'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
  productItemFilterDrawerSchema,
  ProductItemFilterFormValues,
} from '../constants'
import {
  ComboboxSeed,
  PRODUCT_ITEM_FILTER_DRAWER_MISSING_VALUES_ALERT_TEST_ID,
  ProductItemFilterDrawerContent,
} from '../ProductItemFilterDrawerContent'
import { PRODUCT_ITEM_FILTER_VALUES_COMBOBOX_TEST_ID } from '../ProductItemFilterValuesEditor'

// The translate mock returns the key so field labels/placeholders are queryable.
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

// The code input placeholder / product item combobox placeholder keys, used to
// find the inputs (the translate mock echoes the key back).
const CODE_INPUT_PLACEHOLDER_KEY = 'text_629728388c4d2300e2d380d9'
const PRODUCT_ITEM_COMBOBOX_PLACEHOLDER_KEY = 'text_1784579021080kajutbc14la'

const SEEDED_FILTERS = [{ id: 'bmf-1', key: 'payment_method', values: ['card', 'cash'] }]
const PRODUCT_ITEM_SEED: ComboboxSeed = { value: 'pi-1', label: 'Storage' }

// Test-facing handles onto the harness form so cases can drive the real
// validation lifecycle (submit-first, then dynamic) exactly as the drawer does.
type FormControls = {
  setProductItemId: (productItemId: string) => void
  submit: () => Promise<void>
  reset: () => void
}

type HarnessProps = {
  defaultValues?: Partial<ProductItemFilterFormValues>
  isEdit?: boolean
  disableCodeInput?: boolean
  productItemSeed?: ComboboxSeed
  seededFilters?: Array<{ id: string; key: string; values: string[] }>
  onFormReady?: (controls: FormControls) => void
}

const ContentHarness = ({
  defaultValues,
  isEdit = false,
  disableCodeInput = false,
  productItemSeed = null,
  seededFilters = [],
  onFormReady,
}: HarnessProps) => {
  // Mirror the real drawer's validation config so the "define at least one
  // filter" alert (gated on the values field's validation errors) behaves here
  // exactly as in production.
  const form = useAppForm({
    defaultValues: { ...PRODUCT_ITEM_FILTER_FORM_DEFAULTS, ...defaultValues },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: productItemFilterDrawerSchema },
    onSubmit: () => {},
  })

  useEffect(() => {
    onFormReady?.({
      setProductItemId: (productItemId) => form.setFieldValue('productItemId', productItemId),
      submit: () => form.handleSubmit(),
      reset: () => form.reset(PRODUCT_ITEM_FILTER_FORM_DEFAULTS),
    })
  }, [onFormReady, form])

  return (
    <ProductItemFilterDrawerContent
      form={form}
      isEdit={isEdit}
      disableCodeInput={disableCodeInput}
      productItemSeed={productItemSeed}
      seededFilters={seededFilters}
    />
  )
}

const renderContent = (props: HarnessProps = {}) =>
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      <ContentHarness {...props} />
    </MockedProvider>,
  )

const queryMissingValuesAlert = () =>
  screen.queryByTestId(PRODUCT_ITEM_FILTER_DRAWER_MISSING_VALUES_ALERT_TEST_ID)

const findMissingValuesAlert = () =>
  screen.findByTestId(PRODUCT_ITEM_FILTER_DRAWER_MISSING_VALUES_ALERT_TEST_ID)

const getValuesEditorInput = () =>
  within(screen.getByTestId(PRODUCT_ITEM_FILTER_VALUES_COMBOBOX_TEST_ID)).getByRole('combobox')

describe('ProductItemFilterDrawerContent', () => {
  describe('GIVEN edit mode with an attached filter', () => {
    it('locks the code input and the attached product item selector', () => {
      renderContent({
        isEdit: true,
        disableCodeInput: true,
        productItemSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: {
          name: 'Storage EU',
          code: 'storage_eu',
          productItemId: 'pi-1',
          values: [{ billableMetricFilterId: 'bmf-1', value: 'card' }],
        },
      })

      expect(screen.getByPlaceholderText(CODE_INPUT_PLACEHOLDER_KEY)).toBeDisabled()
      expect(screen.getByPlaceholderText(PRODUCT_ITEM_COMBOBOX_PLACEHOLDER_KEY)).toBeDisabled()
    })
  })

  describe('GIVEN the "define at least one filter" alert', () => {
    it('stays hidden before the first submit even when no value is selected', () => {
      renderContent({
        productItemSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: { productItemId: 'pi-1' },
      })

      expect(queryMissingValuesAlert()).not.toBeInTheDocument()
    })

    it('shows the alert after a submit with no value selected', async () => {
      let controls: FormControls | null = null

      renderContent({
        productItemSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: { name: 'Storage EU', code: 'storage_eu', productItemId: 'pi-1' },
        onFormReady: (readyControls) => {
          controls = readyControls
        },
      })

      await act(async () => {
        await controls?.submit()
      })

      expect(await findMissingValuesAlert()).toBeInTheDocument()
    })

    it('keeps the alert hidden after a submit when at least one value exists', async () => {
      let controls: FormControls | null = null

      renderContent({
        productItemSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: {
          name: 'Storage EU',
          code: 'storage_eu',
          productItemId: 'pi-1',
          values: [{ billableMetricFilterId: 'bmf-1', value: 'card' }],
        },
        onFormReady: (readyControls) => {
          controls = readyControls
        },
      })

      await act(async () => {
        await controls?.submit()
      })

      expect(queryMissingValuesAlert()).not.toBeInTheDocument()
    })

    it('hides the alert again after a form reset ("create more") until the next submit', async () => {
      let controls: FormControls | null = null

      renderContent({
        productItemSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: { name: 'Storage EU', code: 'storage_eu', productItemId: 'pi-1' },
        onFormReady: (readyControls) => {
          controls = readyControls
        },
      })

      // A failed submit surfaces the validation alert...
      await act(async () => {
        await controls?.submit()
      })
      expect(await findMissingValuesAlert()).toBeInTheDocument()

      // ...but resetting the form (as "create more" does after a creation) clears
      // the validation state, so the alert does not fire again until the next submit.
      await act(async () => {
        controls?.reset()
      })

      expect(queryMissingValuesAlert()).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the filter values editor', () => {
    it('is disabled until a product item is selected', () => {
      renderContent()

      expect(getValuesEditorInput()).toBeDisabled()
    })

    it('is enabled once a product item is selected', () => {
      renderContent({
        productItemSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: { productItemId: 'pi-1' },
      })

      expect(getValuesEditorInput()).not.toBeDisabled()
    })
  })

  describe('GIVEN switching the selected product item', () => {
    it('clears the previously selected values', async () => {
      let controls: FormControls | null = null

      renderContent({
        productItemSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: {
          name: 'Storage EU',
          code: 'storage_eu',
          productItemId: 'pi-1',
          values: [{ billableMetricFilterId: 'bmf-1', value: 'card' }],
        },
        onFormReady: (readyControls) => {
          controls = readyControls
        },
      })

      // Submit once (values are valid, so no alert) to activate dynamic
      // validation, then switch the product item.
      await act(async () => {
        await controls?.submit()
      })
      expect(queryMissingValuesAlert()).not.toBeInTheDocument()

      // Switching clears the stale values, so the values field now fails
      // validation and the alert reappears.
      await act(async () => {
        controls?.setProductItemId('pi-2')
      })

      expect(await findMissingValuesAlert()).toBeInTheDocument()
    })
  })
})

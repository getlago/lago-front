import { MockedProvider } from '@apollo/client/testing'
import { revalidateLogic } from '@tanstack/react-form'
import { act, screen, within } from '@testing-library/react'
import { useEffect } from 'react'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
  productFilterDrawerSchema,
  ProductFilterFormValues,
} from '../constants'
import {
  ComboboxSeed,
  PRODUCT_ITEM_FILTER_DRAWER_MISSING_VALUES_ALERT_TEST_ID,
  ProductFilterDrawerContent,
} from '../ProductFilterDrawerContent'
import { PRODUCT_ITEM_FILTER_VALUES_COMBOBOX_TEST_ID } from '../ProductFilterValuesEditor'

// The translate mock returns the key so field labels/placeholders are queryable.
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

// The code input placeholder / productCategory item combobox placeholder keys, used to
// find the inputs (the translate mock echoes the key back).
const CODE_INPUT_PLACEHOLDER_KEY = 'text_629728388c4d2300e2d380d9'
const PRODUCT_ITEM_COMBOBOX_PLACEHOLDER_KEY = 'text_1784579021080kajutbc14la'

const SEEDED_FILTERS = [{ id: 'bmf-1', key: 'payment_method', values: ['card', 'cash'] }]
const PRODUCT_ITEM_SEED: ComboboxSeed = { value: 'pi-1', label: 'Storage' }

// Test-facing handles onto the harness form so cases can drive the real
// validation lifecycle (submit-first, then dynamic) exactly as the drawer does.
type FormControls = {
  setProductId: (productId: string) => void
  submit: () => Promise<void>
  reset: () => void
}

type HarnessProps = {
  defaultValues?: Partial<ProductFilterFormValues>
  isEdit?: boolean
  disableCodeInput?: boolean
  productSeed?: ComboboxSeed
  seededFilters?: Array<{ id: string; key: string; values: string[] }>
  onFormReady?: (controls: FormControls) => void
}

const ContentHarness = ({
  defaultValues,
  isEdit = false,
  disableCodeInput = false,
  productSeed = null,
  seededFilters = [],
  onFormReady,
}: HarnessProps) => {
  // Mirror the real drawer's validation config so the "define at least one
  // filter" alert (gated on the values field's validation errors) behaves here
  // exactly as in productCategoryion.
  const form = useAppForm({
    defaultValues: { ...PRODUCT_ITEM_FILTER_FORM_DEFAULTS, ...defaultValues },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: productFilterDrawerSchema },
    onSubmit: () => {},
  })

  useEffect(() => {
    onFormReady?.({
      setProductId: (productId) => form.setFieldValue('productId', productId),
      submit: () => form.handleSubmit(),
      reset: () => form.reset(PRODUCT_ITEM_FILTER_FORM_DEFAULTS),
    })
  }, [onFormReady, form])

  return (
    <ProductFilterDrawerContent
      form={form}
      isEdit={isEdit}
      disableCodeInput={disableCodeInput}
      productSeed={productSeed}
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

describe('ProductFilterDrawerContent', () => {
  describe('GIVEN edit mode with an attached filter', () => {
    it('locks the code input and the attached productCategory item selector', () => {
      renderContent({
        isEdit: true,
        disableCodeInput: true,
        productSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: {
          name: 'Storage EU',
          code: 'storage_eu',
          productId: 'pi-1',
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
        productSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: { productId: 'pi-1' },
      })

      expect(queryMissingValuesAlert()).not.toBeInTheDocument()
    })

    it('shows the alert after a submit with no value selected', async () => {
      let controls: FormControls | null = null

      renderContent({
        productSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: { name: 'Storage EU', code: 'storage_eu', productId: 'pi-1' },
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
        productSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: {
          name: 'Storage EU',
          code: 'storage_eu',
          productId: 'pi-1',
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
        productSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: { name: 'Storage EU', code: 'storage_eu', productId: 'pi-1' },
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
    it('is disabled until a productCategory item is selected', () => {
      renderContent()

      expect(getValuesEditorInput()).toBeDisabled()
    })

    it('is enabled once a productCategory item is selected', () => {
      renderContent({
        productSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: { productId: 'pi-1' },
      })

      expect(getValuesEditorInput()).not.toBeDisabled()
    })
  })

  describe('GIVEN switching the selected productCategory item', () => {
    it('clears the previously selected values', async () => {
      let controls: FormControls | null = null

      renderContent({
        productSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: {
          name: 'Storage EU',
          code: 'storage_eu',
          productId: 'pi-1',
          values: [{ billableMetricFilterId: 'bmf-1', value: 'card' }],
        },
        onFormReady: (readyControls) => {
          controls = readyControls
        },
      })

      // Submit once (values are valid, so no alert) to activate dynamic
      // validation, then switch the productCategory item.
      await act(async () => {
        await controls?.submit()
      })
      expect(queryMissingValuesAlert()).not.toBeInTheDocument()

      // Switching clears the stale values, so the values field now fails
      // validation and the alert reappears.
      await act(async () => {
        controls?.setProductId('pi-2')
      })

      expect(await findMissingValuesAlert()).toBeInTheDocument()
    })
  })
})

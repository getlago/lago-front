import { MockedProvider } from '@apollo/client/testing'
import { screen, within } from '@testing-library/react'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { PRODUCT_ITEM_FILTER_FORM_DEFAULTS, ProductItemFilterFormValues } from '../constants'
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

type HarnessProps = {
  defaultValues?: Partial<ProductItemFilterFormValues>
  isEdit?: boolean
  disableCodeInput?: boolean
  productItemSeed?: ComboboxSeed
  seededFilters?: Array<{ id: string; key: string; values: string[] }>
}

const ContentHarness = ({
  defaultValues,
  isEdit = false,
  disableCodeInput = false,
  productItemSeed = null,
  seededFilters = [],
}: HarnessProps) => {
  const form = useAppForm({
    defaultValues: { ...PRODUCT_ITEM_FILTER_FORM_DEFAULTS, ...defaultValues },
  })

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
    it('shows the alert when no value is selected', () => {
      renderContent()

      expect(
        screen.getByTestId(PRODUCT_ITEM_FILTER_DRAWER_MISSING_VALUES_ALERT_TEST_ID),
      ).toBeInTheDocument()
    })

    it('hides the alert once at least one value exists', () => {
      renderContent({
        productItemSeed: PRODUCT_ITEM_SEED,
        seededFilters: SEEDED_FILTERS,
        defaultValues: {
          productItemId: 'pi-1',
          values: [{ billableMetricFilterId: 'bmf-1', value: 'card' }],
        },
      })

      expect(
        screen.queryByTestId(PRODUCT_ITEM_FILTER_DRAWER_MISSING_VALUES_ALERT_TEST_ID),
      ).not.toBeInTheDocument()
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
})

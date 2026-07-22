import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { BASE_DRAWER_CONTENT_ATTR } from '~/components/drawers/const'
import {
  CreateMoreResetSignal,
  useCreateMoreResetIteration,
} from '~/components/drawers/createMore/useCreateMore'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  BillableMetricFilter,
  useProductItemsForItemFilterDrawerLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { tw } from '~/styles/utils'

import { PRODUCT_ITEM_FILTER_FORM_DEFAULTS } from './constants'
import ProductItemFilterValuesEditor from './ProductItemFilterValuesEditor'

export const PRODUCT_ITEM_FILTER_DRAWER_REMOVE_DESCRIPTION_TEST_ID =
  'product-item-filter-drawer-remove-description'
export const PRODUCT_ITEM_FILTER_DRAWER_SHOW_DESCRIPTION_TEST_ID =
  'product-item-filter-drawer-show-description'
export const PRODUCT_ITEM_FILTER_DRAWER_MISSING_VALUES_ALERT_TEST_ID =
  'product-item-filter-drawer-missing-values-alert'

export type ComboboxSeed = { value: string; label: string } | null

export type SelectableBillableMetricFilter = Pick<BillableMetricFilter, 'id' | 'key' | 'values'>

type ProductItemFilterDrawerSectionsExtraProps = {
  isEdit: boolean
  disableCodeInput: boolean
  productItemSeed: ComboboxSeed
  seededFilters: SelectableBillableMetricFilter[]
}

const productItemFilterDrawerSectionsDefaultProps: ProductItemFilterDrawerSectionsExtraProps = {
  isEdit: false,
  disableCodeInput: false,
  productItemSeed: null,
  seededFilters: [],
}

// Merge the seeded selection (needed so a disabled/prefilled combobox resolves
// its label before the options query has run) with the fetched options, keeping
// the seed first and dropping any duplicate coming back from the query.
const mergeSeededOptions = (
  seed: ComboboxSeed,
  options: Array<{ value: string; label: string }>,
) => {
  if (!seed) return options

  return [seed, ...options.filter((option) => option.value !== seed.value)]
}

// Holds the reactive form state (description reveal + the selected product item's
// available filters) so it resets alongside the form when the keyed wrapper
// remounts after a "create more" save.
const ProductItemFilterDrawerFormSections = withForm({
  defaultValues: PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
  props: productItemFilterDrawerSectionsDefaultProps,
  render: function ProductItemFilterDrawerFormSectionsRender({
    form,
    isEdit,
    disableCodeInput,
    productItemSeed,
    seededFilters,
  }) {
    const { translate } = useInternationalization()
    const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
      () => !!form.state.values.description,
    )

    const productItemId = useStore(form.store, (state) => state.values.productItemId)

    const [getProductItems, { data: productItemsData, loading: productItemsLoading }] =
      useProductItemsForItemFilterDrawerLazyQuery({ variables: { page: 1, limit: 20 } })

    // Only product items whose billable metric exposes filters can carry an item
    // filter, so restrict the combobox options to those.
    const selectableProductItems = useMemo(
      () =>
        (productItemsData?.productItems?.collection ?? []).filter(
          (productItem) => !!productItem.billableMetric?.filters?.length,
        ),
      [productItemsData?.productItems?.collection],
    )

    const productItemsComboboxData = useMemo(
      () =>
        mergeSeededOptions(
          productItemSeed,
          selectableProductItems.map((productItem) => ({
            value: productItem.id,
            label: productItem.name,
          })),
        ),
      [productItemSeed, selectableProductItems],
    )

    // Accumulate the selectable filters per product item from the query results
    // (and the edit seed), then read the currently selected item's filters so the
    // values editor can offer them. The seed keeps the disabled edit combobox
    // working before any query runs.
    const filtersByProductItemId = useMemo(() => {
      const byProductItemId = new Map<string, SelectableBillableMetricFilter[]>()

      if (productItemSeed && seededFilters.length) {
        byProductItemId.set(productItemSeed.value, seededFilters)
      }

      selectableProductItems.forEach((productItem) => {
        const filters = productItem.billableMetric?.filters ?? []

        byProductItemId.set(
          productItem.id,
          filters.map((filter) => ({ id: filter.id, key: filter.key, values: filter.values })),
        )
      })

      return byProductItemId
    }, [productItemSeed, seededFilters, selectableProductItems])

    const selectedFilters = productItemId ? (filtersByProductItemId.get(productItemId) ?? []) : []

    const handleHideDescription = () => {
      // Skip the write when already empty: setFieldValue always marks the field
      // dirty, which would arm the discard-changes prompt after a no-op
      // add-description -> trash round trip.
      if (form.state.values.description) {
        form.setFieldValue('description', '')
      }
      setShouldDisplayDescription(false)
    }

    return (
      <>
        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_1784579021080ysbidm753z8')}
            description={translate('text_1784579021080xvr3zayq5rz')}
          />

          <NameAndCodeGroup
            form={form}
            fields={{ name: 'name', code: 'code' }}
            disableCodeInput={disableCodeInput}
            disableAutoGenerateCode={isEdit}
            nameProps={{ autoFocus: true }}
          />

          {shouldDisplayDescription && (
            <div className="flex items-center">
              <form.AppField name="description">
                {(field) => (
                  <field.TextInputField
                    multiline
                    className="mr-3 flex-1"
                    label={translate('text_629728388c4d2300e2d380f1')}
                    placeholder={translate('text_1750257831368ae3rtaclhjy')}
                    rows="3"
                  />
                )}
              </form.AppField>
              <Tooltip
                className="mt-6"
                placement="top-end"
                title={translate('text_63aa085d28b8510cd46443ff')}
              >
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={handleHideDescription}
                  data-test={PRODUCT_ITEM_FILTER_DRAWER_REMOVE_DESCRIPTION_TEST_ID}
                />
              </Tooltip>
            </div>
          )}
          {!shouldDisplayDescription && (
            <Button
              fitContent
              startIcon="plus"
              variant="inline"
              onClick={() => setShouldDisplayDescription(true)}
              data-test={PRODUCT_ITEM_FILTER_DRAWER_SHOW_DESCRIPTION_TEST_ID}
            >
              {translate('text_642d5eb2783a2ad10d670324')}
            </Button>
          )}

          <form.AppField
            name="productItemId"
            listeners={{
              // Switching the product item invalidates the selected values: they
              // reference the previous item's billable metric filters, so clear
              // them to keep the values section scoped to the new selection.
              onChange: () => {
                if (form.state.values.values.length) {
                  form.setFieldValue('values', [])
                }
              },
            }}
          >
            {(field) => (
              <field.ComboBoxField
                label={translate('text_17845790210805g4buh2kivc')}
                placeholder={translate('text_1784579021080kajutbc14la')}
                data={productItemsComboboxData}
                searchQuery={getProductItems}
                loading={productItemsLoading}
                disabled={isEdit}
              />
            )}
          </form.AppField>
        </CenteredPage.PageSection>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_1784579021080cayu2mqo1o8')}
            description={translate('text_1784579021080da8nd35wa0j')}
          />

          <form.AppField name="values">
            {(field) => (
              <div className="flex flex-col gap-4">
                <ProductItemFilterValuesEditor
                  billableMetricFilters={selectedFilters}
                  values={field.state.value}
                  onChange={(nextValues) => field.handleChange(nextValues)}
                  disabled={!productItemId}
                  hasError={field.state.meta.errors.length > 0}
                />

                {field.state.meta.errors.length > 0 && (
                  <Alert
                    type="danger"
                    data-test={PRODUCT_ITEM_FILTER_DRAWER_MISSING_VALUES_ALERT_TEST_ID}
                  >
                    {translate('text_1784579021080myc4hsroeid')}
                  </Alert>
                )}
              </div>
            )}
          </form.AppField>
        </CenteredPage.PageSection>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_17423672025282dl7iozy1ru')}
            description={translate('text_1783627031283g55tf6jjlg1')}
          />

          <form.AppField name="invoiceDisplayName">
            {(field) => (
              <field.TextInputField
                label={translate('text_65a6b4e2cb38d9b70ec53d39')}
                placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                description={translate('text_1771963033467yduu33x3qw9')}
              />
            )}
          </form.AppField>
        </CenteredPage.PageSection>
      </>
    )
  },
})

type ProductItemFilterDrawerContentExtraProps = ProductItemFilterDrawerSectionsExtraProps & {
  resetSignal?: CreateMoreResetSignal
}

const productItemFilterDrawerContentDefaultProps: ProductItemFilterDrawerContentExtraProps = {
  ...productItemFilterDrawerSectionsDefaultProps,
  resetSignal: undefined,
}

// Drawer body: `children` is captured once at open(), so reactive state lives
// here; `form` is the data-passing seam. After a "create more" save the reset
// signal remounts the sections (fresh fields + reveal state) with a fade-in,
// scrolls the drawer back to the top, and refocuses the Name input.
export const ProductItemFilterDrawerContent = withForm({
  defaultValues: PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
  props: productItemFilterDrawerContentDefaultProps,
  render: function ProductItemFilterDrawerContentRender({
    form,
    isEdit,
    disableCodeInput,
    productItemSeed,
    seededFilters,
    resetSignal,
  }) {
    const rootRef = useRef<HTMLDivElement>(null)
    const resetIteration = useCreateMoreResetIteration(resetSignal)

    useEffect(() => {
      if (resetIteration === 0) return

      rootRef.current
        ?.closest<HTMLElement>(`[${BASE_DRAWER_CONTENT_ATTR}]`)
        ?.scrollTo({ top: 0, behavior: 'smooth' })
      focusFirstInput(rootRef.current)
    }, [resetIteration])

    return (
      <div ref={rootRef}>
        <div
          key={resetIteration}
          className={tw('flex flex-col gap-12', resetIteration > 0 && 'animate-fade-in-right')}
        >
          <ProductItemFilterDrawerFormSections
            form={form}
            isEdit={isEdit}
            disableCodeInput={disableCodeInput}
            productItemSeed={productItemSeed}
            seededFilters={seededFilters}
          />
        </div>
      </div>
    )
  },
})

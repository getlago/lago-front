import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { BASE_DRAWER_CONTENT_ATTR } from '~/components/drawers/const'
import {
  CreateMoreResetSignal,
  useCreateMoreResetIteration,
} from '~/components/drawers/createMore/useCreateMore'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  ProductTypeEnum,
  useGetBillableMetricsForProductDrawerLazyQuery,
  useGetProductCategoriesForProductDrawerLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { tw } from '~/styles/utils'

import { PRODUCT_ITEM_FORM_DEFAULTS } from './constants'

export const PRODUCT_ITEM_DRAWER_REMOVE_DESCRIPTION_TEST_ID =
  'product-item-drawer-remove-description'
export const PRODUCT_ITEM_DRAWER_SHOW_DESCRIPTION_TEST_ID = 'product-item-drawer-show-description'

gql`
  query getProductCategoriesForProductDrawer($page: Int, $limit: Int, $searchTerm: String) {
    productCategories(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        name
        code
      }
    }
  }

  query getBillableMetricsForProductDrawer($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        name
        code
      }
    }
  }
`

export type ComboboxSeed = { value: string; label: string } | null

type ProductDrawerSectionsExtraProps = {
  isEdit: boolean
  disableCodeInput: boolean
  productCategorySeed: ComboboxSeed
  billableMetricSeed: ComboboxSeed
}

const productDrawerSectionsDefaultProps: ProductDrawerSectionsExtraProps = {
  isEdit: false,
  disableCodeInput: false,
  productCategorySeed: null,
  billableMetricSeed: null,
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

// Holds the reactive form state (description reveal + usage-only fields) so it
// resets alongside the form when the keyed wrapper remounts after a "create
// more" save.
const ProductDrawerFormSections = withForm({
  defaultValues: PRODUCT_ITEM_FORM_DEFAULTS,
  props: productDrawerSectionsDefaultProps,
  render: function ProductDrawerFormSectionsRender({
    form,
    isEdit,
    disableCodeInput,
    productCategorySeed,
    billableMetricSeed,
  }) {
    const { translate } = useInternationalization()
    const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
      () => !!form.state.values.description,
    )

    const productType = useStore(form.store, (state) => state.values.productType)

    const [
      getProductCategories,
      { data: productCategoriesData, loading: productCategoriesLoading },
    ] = useGetProductCategoriesForProductDrawerLazyQuery({ variables: { page: 1, limit: 20 } })
    const [getBillableMetrics, { data: billableMetricsData, loading: billableMetricsLoading }] =
      useGetBillableMetricsForProductDrawerLazyQuery({ variables: { page: 1, limit: 20 } })

    const productCategoriesComboboxData = useMemo(
      () =>
        mergeSeededOptions(
          productCategorySeed,
          (productCategoriesData?.productCategories?.collection ?? []).map((productCategory) => ({
            value: productCategory.id,
            label: productCategory.name,
          })),
        ),
      [productCategorySeed, productCategoriesData?.productCategories?.collection],
    )

    const billableMetricsComboboxData = useMemo(
      () =>
        mergeSeededOptions(
          billableMetricSeed,
          (billableMetricsData?.billableMetrics?.collection ?? []).map((billableMetric) => ({
            value: billableMetric.id,
            label: billableMetric.name,
          })),
        ),
      [billableMetricSeed, billableMetricsData?.billableMetrics?.collection],
    )

    const productTypeData = useMemo(
      () => [
        { value: ProductTypeEnum.Fixed, label: translate('text_1783980718113ritmy7z94je') },
        { value: ProductTypeEnum.Usage, label: translate('text_17839807181133l3z83156s6') },
      ],
      [translate],
    )

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
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate(isEdit ? 'text_1783980718113x99ykq6zvpi' : 'text_1783622030703m9jlurg4jsn')}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_17839807181121g9i27t58sm')}
          </Typography>
        </div>

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_17839807181134f9rmjjvndx')}
              description={translate('text_1783980718113hg7nq4cvbgi')}
            />

            <NameAndCodeGroup
              form={form}
              fields={{ name: 'name', code: 'code' }}
              disableCodeInput={disableCodeInput}
              disableAutoGenerateCode={isEdit}
              nameProps={{
                autoFocus: true,
                placeholder: translate('text_1783980718113x7oxinm95hb'),
              }}
              codeProps={{
                placeholder: translate('text_1783980718113a2og0t90owd'),
              }}
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
                    data-test={PRODUCT_ITEM_DRAWER_REMOVE_DESCRIPTION_TEST_ID}
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
                data-test={PRODUCT_ITEM_DRAWER_SHOW_DESCRIPTION_TEST_ID}
              >
                {translate('text_642d5eb2783a2ad10d670324')}
              </Button>
            )}

            <form.AppField name="productCategoryId">
              {(field) => (
                <field.ComboBoxField
                  label={translate('text_1783980718113gmxi7tfqvjh')}
                  placeholder={translate('text_1783980718113ol49lu59441')}
                  description={translate('text_1783980718113zbaqd74pwt0')}
                  data={productCategoriesComboboxData}
                  searchQuery={getProductCategories}
                  loading={productCategoriesLoading}
                  disabled={isEdit}
                />
              )}
            </form.AppField>

            <form.AppField name="productType">
              {(field) => (
                <field.ComboBoxField
                  disableClearable
                  label={translate('text_1783980718113na6t9imp2k0')}
                  placeholder={translate('text_1783980718113lap636bt33b')}
                  data={productTypeData}
                  disabled={isEdit}
                />
              )}
            </form.AppField>

            {productType === ProductTypeEnum.Usage && (
              <form.AppField name="billableMetricId">
                {(field) => (
                  <field.ComboBoxField
                    disableClearable
                    label={translate('text_178398071811327xropcsqmr')}
                    placeholder={translate('text_1783980718113yzpo2mhspwa')}
                    data={billableMetricsComboboxData}
                    searchQuery={getBillableMetrics}
                    loading={billableMetricsLoading}
                    disabled={isEdit}
                  />
                )}
              </form.AppField>
            )}
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
        </CenteredPage.SubsectionWrapper>
      </>
    )
  },
})

type ProductDrawerContentExtraProps = ProductDrawerSectionsExtraProps & {
  resetSignal?: CreateMoreResetSignal
}

const productDrawerContentDefaultProps: ProductDrawerContentExtraProps = {
  ...productDrawerSectionsDefaultProps,
  resetSignal: undefined,
}

// Drawer body: `children` is captured once at open(), so reactive state lives
// here; `form` is the data-passing seam. After a "create more" save the reset
// signal remounts the sections (fresh fields + reveal state) with a fade-in,
// scrolls the drawer back to the top, and refocuses the Name input.
export const ProductDrawerContent = withForm({
  defaultValues: PRODUCT_ITEM_FORM_DEFAULTS,
  props: productDrawerContentDefaultProps,
  render: function ProductDrawerContentRender({
    form,
    isEdit,
    disableCodeInput,
    productCategorySeed,
    billableMetricSeed,
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
          <ProductDrawerFormSections
            form={form}
            isEdit={isEdit}
            disableCodeInput={disableCodeInput}
            productCategorySeed={productCategorySeed}
            billableMetricSeed={billableMetricSeed}
          />
        </div>
      </div>
    )
  },
})

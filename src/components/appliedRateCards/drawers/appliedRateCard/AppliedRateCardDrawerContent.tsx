import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { ReactNode, useEffect, useMemo, useState } from 'react'

import {
  getInsertIndex,
  RatePhaseFormValues,
  RatePhaseReference,
} from '~/components/appliedRateCards/drawers/ratePhase/ratePhaseFormSchema'
import { useRatePhaseLocalDrawer } from '~/components/appliedRateCards/drawers/ratePhase/useRatePhaseLocalDrawer'
import { RatePhaseList } from '~/components/appliedRateCards/RatePhaseList'
import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { ComboboxDataGrouped } from '~/components/form/ComboBox'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_PRODUCT_FILTER_FOR_APPLIED_RATE_CARD_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  ProductForAppliedRateCardDrawerFragment,
  PropertiesForRateCardRateFragmentDoc,
  useGetProductFiltersForAppliedRateCardDrawerLazyQuery,
  useGetProductsForAppliedRateCardDrawerLazyQuery,
  useGetRateCardsForAppliedRateCardDrawerLazyQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import type { useRateCardDrawer } from '~/pages/catalog/drawers/rateCard/useRateCardDrawer'

import { APPLIED_RATE_CARD_FORM_DEFAULTS } from './validationSchema'

type OpenRateCardDrawer = ReturnType<typeof useRateCardDrawer>['openDrawer']

export const APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID = 'applied-rate-card-drawer-product'
export const APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID = 'applied-rate-card-drawer-show-filter'
export const APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID =
  'applied-rate-card-drawer-product-filter'
export const APPLIED_RATE_CARD_DRAWER_REMOVE_FILTER_TEST_ID =
  'applied-rate-card-drawer-remove-filter'
export const APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID = 'applied-rate-card-drawer-rate-card'
export const APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID = 'applied-rate-card-drawer-add-phase'
export const APPLIED_RATE_CARD_DRAWER_PHASES_EMPTY_STATE_TEST_ID =
  'applied-rate-card-drawer-phases-empty-state'

gql`
  fragment ProductForAppliedRateCardDrawer on Product {
    id
    name
    code
    invoiceDisplayName
    productType
    productCategory {
      id
      name
      code
      invoiceDisplayName
    }
    billableMetric {
      id
      aggregationType
      recurring
    }
  }

  query getProductsForAppliedRateCardDrawer($page: Int, $limit: Int, $searchTerm: String) {
    products(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        code
        ...ProductForAppliedRateCardDrawer
      }
      metadata {
        currentPage
        totalPages
      }
    }
  }

  query getProductFiltersForAppliedRateCardDrawer($productId: ID) {
    productFilters(productId: $productId) {
      collection {
        id
        name
        code
      }
    }
  }

  fragment RateCardForAppliedRateCardDrawer on RateCard {
    currency
    billingTiming
    appliedPricingUnitCode
    proration
    activeRate {
      rateModel
      rateProperties {
        ...PropertiesForRateCardRate
      }
      billingIntervalCount
      billingIntervalUnit
      minAmountCents
      appliedPricingUnitConversionRate
    }
  }

  query getRateCardsForAppliedRateCardDrawer(
    $productIds: [ID!]
    $productFilterIds: [ID!]
    $searchTerm: String
    $limit: Int
  ) {
    rateCards(
      productIds: $productIds
      productFilterIds: $productFilterIds
      searchTerm: $searchTerm
      limit: $limit
    ) {
      collection {
        id
        name
        code
        ...RateCardForAppliedRateCardDrawer
      }
    }
  }

  ${PropertiesForRateCardRateFragmentDoc}
`

const STANDALONE_PRODUCTS_GROUP_KEY = 'standalone-products'

const getDisplayName = (entity: { name: string; invoiceDisplayName?: string | null }): string =>
  entity.invoiceDisplayName || entity.name

const buildProductsComboboxData = (
  products: ProductForAppliedRateCardDrawerFragment[],
  translate: TranslateFunc,
): { data: ComboboxDataGrouped[]; renderGroupHeader: Record<string, ReactNode> } => {
  const renderGroupHeader: Record<string, ReactNode> = {}

  const data = products.map((product) => {
    const category = product.productCategory
    const group = category?.code ?? STANDALONE_PRODUCTS_GROUP_KEY

    if (!renderGroupHeader[group]) {
      renderGroupHeader[group] = (
        <div className="flex items-center gap-1">
          <Typography variant="captionHl" color="grey700" noWrap>
            {category ? getDisplayName(category) : translate('text_1791833366841w7sywhfkvcq')}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {category ? category.code : `• ${translate('text_17918333668416t409ijtqn3')}`}
          </Typography>
        </div>
      )
    }

    return {
      value: product.id,
      label: category
        ? translate('text_1791833366841uuvaufyxeoc', {
            productName: getDisplayName(product),
            productCategoryName: getDisplayName(category),
          })
        : getDisplayName(product),
      labelNode: product.name,
      description: product.code,
      group,
    }
  })

  return { data, renderGroupHeader }
}

const toPhaseReferences = (phases: RatePhaseFormValues[]): RatePhaseReference[] =>
  phases.map(({ code, name }) => ({ code, name }))

type AppliedRateCardDrawerContentProps = {
  context: 'plan' | 'contract'
  openRateCardDrawer: OpenRateCardDrawer
}

const appliedRateCardDrawerContentDefaultProps: AppliedRateCardDrawerContentProps = {
  context: 'plan',
  openRateCardDrawer: () => {},
}

export const AppliedRateCardDrawerContent = withForm({
  defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS,
  props: appliedRateCardDrawerContentDefaultProps,
  render: function AppliedRateCardDrawerContentRender({ form, context, openRateCardDrawer }) {
    const { translate } = useInternationalization()
    const { openDrawer: openRatePhaseDrawer } = useRatePhaseLocalDrawer()
    const [shouldDisplayFilter, setShouldDisplayFilter] = useState(false)

    const productId = useStore(form.store, (state) => state.values.productId)
    const productFilterId = useStore(form.store, (state) => state.values.productFilterId)
    const rateCardId = useStore(form.store, (state) => state.values.rateCardId)
    const ratePhases = useStore(form.store, (state) => state.values.ratePhases)

    const [getProducts, { data: productsData, loading: productsLoading }] =
      useGetProductsForAppliedRateCardDrawerLazyQuery({ variables: { page: 1, limit: 20 } })
    const [getProductFilters, { data: productFiltersData }] =
      useGetProductFiltersForAppliedRateCardDrawerLazyQuery()
    // `variables` is rebuilt every render from the current cascade selection, so it stays the
    // baseline `useLazyQuery`'s execute function merges a bare/search-only call on top of (Apollo
    // merges a call's variables with this hook-declaration baseline, not with the previous call) -
    // without this, typing a search term in the combobox below would drop productIds/productFilterIds.
    const [
      getRateCards,
      { data: rateCardsData, loading: rateCardsLoading, refetch: refetchRateCards },
    ] = useGetRateCardsForAppliedRateCardDrawerLazyQuery({
      variables: {
        productIds: productId ? [productId] : undefined,
        productFilterIds: productFilterId ? [productFilterId] : undefined,
      },
    })

    useEffect(() => {
      if (productId) getProductFilters({ variables: { productId } })
    }, [productId, getProductFilters])

    useEffect(() => {
      if (productId) getRateCards()
    }, [productId, productFilterId, getRateCards])

    const productsCombobox = useMemo(
      () => buildProductsComboboxData(productsData?.products.collection ?? [], translate),
      [productsData?.products.collection, translate],
    )

    const selectedProduct = productsData?.products.collection.find(
      (product) => product.id === productId,
    )
    const selectedProductFilter = productFiltersData?.productFilters.collection.find(
      (filter) => filter.id === productFilterId,
    )
    const selectedRateCard = rateCardsData?.rateCards.collection.find(
      (rateCard) => rateCard.code === rateCardId,
    )

    // Controller fix: keeps the hidden `currency` field in sync with the selected rate card so
    // `buildPhaseInput` serializes a phase override's `minAmountCents` against the right
    // currency precision instead of silently defaulting to USD/EUR's.
    useEffect(() => {
      if (selectedRateCard) form.setFieldValue('currency', selectedRateCard.currency)
    }, [selectedRateCard, form])

    const rateCardForPhaseFields =
      selectedRateCard && selectedProduct?.productType
        ? {
            productType: selectedProduct.productType,
            currency: selectedRateCard.currency,
            billingTiming: selectedRateCard.billingTiming,
            appliedPricingUnitCode: selectedRateCard.appliedPricingUnitCode,
            rateModelConfiguration: {
              productType: selectedProduct.productType,
              aggregationType: selectedProduct.billableMetric?.aggregationType,
              recurring: selectedProduct.billableMetric?.recurring,
              billingTiming: selectedRateCard.billingTiming,
              proration: selectedRateCard.proration,
            },
          }
        : undefined

    const lastPhaseIsFinite = ratePhases.length > 0 && ratePhases.at(-1)?.durationType !== 'forever'
    const hasForeverPhaseBeforeLast = ratePhases
      .slice(0, -1)
      .some((phase) => phase.durationType === 'forever')

    const savePhase = (values: RatePhaseFormValues, replaceIndex?: number): void => {
      const otherPhases = form.state.values.ratePhases.filter((_, index) => index !== replaceIndex)

      form.setFieldValue(
        'ratePhases',
        otherPhases.toSpliced(getInsertIndex(values, toPhaseReferences(otherPhases)), 0, values),
      )
    }

    const handleAddPhase = (): void => {
      if (!rateCardForPhaseFields) return

      openRatePhaseDrawer({
        rateCard: rateCardForPhaseFields,
        otherPhases: toPhaseReferences(ratePhases),
        onSave: (values) => savePhase(values),
      })
    }

    const handleEditPhase = (index: number): void => {
      if (!rateCardForPhaseFields) return

      openRatePhaseDrawer({
        rateCard: rateCardForPhaseFields,
        otherPhases: toPhaseReferences(ratePhases.filter((_, phaseIndex) => phaseIndex !== index)),
        phase: ratePhases[index],
        replaceIndex: index,
        onSave: (values, { replaceIndex }) => savePhase(values, replaceIndex),
      })
    }

    const handleRemovePhase = (index: number): void => {
      form.removeFieldValue('ratePhases', index)
    }

    const handleCreateRateCard = (): void => {
      openRateCardDrawer({
        attachToProduct: selectedProduct,
        attachToProductFilter:
          selectedProduct && selectedProductFilter
            ? {
                id: selectedProductFilter.id,
                name: selectedProductFilter.name,
                product: selectedProduct,
              }
            : undefined,
        onCreated: (createdRateCard) => {
          form.setFieldValue('rateCardId', createdRateCard.code)
          refetchRateCards()
        },
      })
    }

    const resetFields = (
      fields: Array<
        keyof Pick<
          typeof APPLIED_RATE_CARD_FORM_DEFAULTS,
          'productFilterId' | 'rateCardId' | 'units' | 'billingAnchorDate'
        >
      >,
    ): void => {
      fields.forEach((field) => {
        if (form.state.values[field] !== APPLIED_RATE_CARD_FORM_DEFAULTS[field]) {
          form.setFieldValue(field, APPLIED_RATE_CARD_FORM_DEFAULTS[field])
        }
      })
    }

    const resetRatePhases = (): void => {
      if (form.state.values.ratePhases.length > 0) form.setFieldValue('ratePhases', [])
    }

    const handleProductChange = (): void => {
      resetFields(['productFilterId', 'rateCardId', 'units', 'billingAnchorDate'])
      resetRatePhases()
      setShouldDisplayFilter(false)
    }

    const handleProductFilterChange = (): void => {
      resetFields(['rateCardId'])
      resetRatePhases()
    }

    const handleHideFilter = (): void => {
      resetFields(['productFilterId'])
      handleProductFilterChange()
      setShouldDisplayFilter(false)
    }

    const handleShowFilter = (): void => {
      setShouldDisplayFilter(true)
      requestAnimationFrame(() =>
        scrollToAndClickElement({
          selector: `.${SEARCH_PRODUCT_FILTER_FOR_APPLIED_RATE_CARD_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
        }),
      )
    }

    const renderRatePhases = (): ReactNode => {
      if (!selectedRateCard) {
        return (
          <div
            className="rounded-xl border border-dashed border-grey-300 p-3 text-center"
            data-test={APPLIED_RATE_CARD_DRAWER_PHASES_EMPTY_STATE_TEST_ID}
          >
            <Typography variant="caption" color="grey500">
              {translate('text_1791833366840eersb7p5eqy')}
            </Typography>
          </div>
        )
      }

      return (
        <>
          <RatePhaseList
            variant="accordion"
            phases={ratePhases}
            activeRate={selectedRateCard.activeRate ?? null}
            onEdit={handleEditPhase}
            onRemove={handleRemovePhase}
          />

          {hasForeverPhaseBeforeLast && (
            <Alert type="warning">{translate('text_1791835259930jvwajr0xa8s')}</Alert>
          )}

          {lastPhaseIsFinite && (
            <Alert type="warning">{translate('text_1791485670326e1zbmola1n3')}</Alert>
          )}
        </>
      )
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate('text_1791833366840i00h4qnyjbw')}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_1791833366840xz4ct9r0a0b')}
          </Typography>
        </div>

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_17918333668403ua32ia5tel')}
              description={translate('text_179183336684024226bmw32b')}
            />

            <form.AppField name="productId" listeners={{ onChange: handleProductChange }}>
              {(field) => (
                <field.ComboBoxField
                  dataTest={APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID}
                  label={translate('text_1783020794400si0ioidu0m5')}
                  placeholder={translate('text_1784579021080kajutbc14la')}
                  loading={productsLoading}
                  searchQuery={getProducts}
                  data={productsCombobox.data}
                  renderGroupHeader={productsCombobox.renderGroupHeader}
                />
              )}
            </form.AppField>

            {!shouldDisplayFilter && !!productId && (
              <Button
                fitContent
                startIcon="plus"
                variant="inline"
                data-test={APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID}
                onClick={handleShowFilter}
              >
                {translate('text_1783104239825gamldgumtq0')}
              </Button>
            )}

            {shouldDisplayFilter && !!productId && (
              <div className="flex items-center gap-3">
                <form.AppField
                  name="productFilterId"
                  listeners={{ onChange: handleProductFilterChange }}
                >
                  {(field) => (
                    <field.ComboBoxField
                      dataTest={APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID}
                      containerClassName="flex-1"
                      className={SEARCH_PRODUCT_FILTER_FOR_APPLIED_RATE_CARD_CLASSNAME}
                      label={translate('text_1783104239825gamldgumtq0')}
                      placeholder={translate('text_1784927788140s9l160t42mm')}
                      data={(productFiltersData?.productFilters.collection ?? []).map((filter) => ({
                        value: filter.id,
                        label: filter.name,
                      }))}
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
                    data-test={APPLIED_RATE_CARD_DRAWER_REMOVE_FILTER_TEST_ID}
                    onClick={handleHideFilter}
                  />
                </Tooltip>
              </div>
            )}
          </CenteredPage.PageSection>

          {context === 'contract' && !!productId && (
            <CenteredPage.PageSection>
              <form.AppField name="billingAnchorDate">
                {(field) => (
                  <field.DatePickerField label={translate('text_1781859135627z59hpfpa8pt')} />
                )}
              </form.AppField>
            </CenteredPage.PageSection>
          )}

          {!!productId && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle
                title={translate('text_17902843861564ti9tbk3ide')}
                description={translate('text_1791833366840umf00996gvx')}
              />

              <form.AppField name="rateCardId" listeners={{ onChange: resetRatePhases }}>
                {(field) => (
                  <field.ComboBoxField
                    dataTest={APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID}
                    label={translate('text_17902843861564ti9tbk3ide')}
                    placeholder={translate('text_1791833366840z1t3fsw26hp')}
                    loading={rateCardsLoading}
                    allowAddValue
                    addValueProps={{
                      label: translate('text_1791485670326bz5dr6tcop3'),
                      onClick: handleCreateRateCard,
                    }}
                    searchQuery={getRateCards}
                    data={(rateCardsData?.rateCards.collection ?? []).map((rateCard) => ({
                      value: rateCard.code,
                      label: rateCard.name,
                    }))}
                  />
                )}
              </form.AppField>
            </CenteredPage.PageSection>
          )}

          {!!productId && (
            <CenteredPage.PageSection>
              <SectionHeader
                title={translate('text_1791485670326kzyf0uhsn23')}
                description={translate('text_1791833366840e0avdoxeza9')}
                contentClassName="gap-2"
                action={{
                  label: translate('text_1791485670326hf9c29bdje6'),
                  dataTest: APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID,
                  hidden: !rateCardForPhaseFields,
                  onClick: handleAddPhase,
                }}
              />

              {renderRatePhases()}
            </CenteredPage.PageSection>
          )}
        </CenteredPage.SubsectionWrapper>
      </>
    )
  },
})

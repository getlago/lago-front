import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { ReactNode, useEffect, useState } from 'react'

import { APPLIED_RATE_CARD_CONTEXT_CONFIG } from '~/components/appliedRateCards/appliedRateCardContextConfig'
import { buildRateCardForRatePhaseFields } from '~/components/appliedRateCards/buildRateCardForRatePhaseFields'
import {
  getInsertIndex,
  RatePhaseFormValues,
  RatePhaseReference,
} from '~/components/appliedRateCards/drawers/ratePhase/ratePhaseFormSchema'
import { getActiveRateFieldValues } from '~/components/appliedRateCards/drawers/ratePhase/ratePhaseSeeds'
import { useRatePhaseLocalDrawer } from '~/components/appliedRateCards/drawers/ratePhase/useRatePhaseLocalDrawer'
import { getRateHistoryPath } from '~/components/appliedRateCards/ratePhaseDisplay'
import { RatePhaseTable } from '~/components/appliedRateCards/RatePhaseTable'
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
  ActiveRateForRatePhaseFragmentDoc,
  AppliedRateCardSliceForAppliedRateCardDrawerFragmentDoc,
  CurrencyEnum,
  ProductForAppliedRateCardDrawerFragment,
  useGetProductFiltersForAppliedRateCardDrawerLazyQuery,
  useGetProductsForAppliedRateCardDrawerLazyQuery,
  useGetRateCardsForAppliedRateCardDrawerLazyQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import type { useRateCardDrawer } from '~/pages/catalog/drawers/rateCard/useRateCardDrawer'

import { AppliedRateCardParent, usePricedProductFilterIds } from './usePricedProductFilterIds'
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
      id
      ...ActiveRateForRatePhase
    }
  }

  query getRateCardsForAppliedRateCardDrawer(
    $productIds: [ID!]
    $productFilterIds: [ID!]
    $searchTerm: String
    $code: String
    $currency: CurrencyEnum
    $limit: Int
  ) {
    rateCards(
      productIds: $productIds
      productFilterIds: $productFilterIds
      searchTerm: $searchTerm
      code: $code
      currency: $currency
      limit: $limit
    ) {
      collection {
        id
        name
        code
        ...RateCardForAppliedRateCardDrawer
        ...AppliedRateCardSliceForAppliedRateCardDrawer
      }
    }
  }

  ${ActiveRateForRatePhaseFragmentDoc}
  ${AppliedRateCardSliceForAppliedRateCardDrawerFragmentDoc}
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

// The ComboBox clears a selection its search results drop, which would reset the cascade below
// it: the selected option stays listed until the selection itself changes.
const useOptionsWithSelection = <T,>(
  options: T[],
  isSelected: (option: T) => boolean,
): { options: T[]; selected: T | undefined } => {
  const match = options.find(isSelected)
  const [retained, setRetained] = useState(match)

  if (match && match !== retained) setRetained(match)

  if (match) return { options, selected: match }
  if (!retained || !isSelected(retained)) return { options, selected: undefined }

  return { options: [...options, retained], selected: retained }
}

type AppliedRateCardDrawerContentProps = {
  parent: AppliedRateCardParent
  // The backend rejects a rate card in another currency (`currency_does_not_match`).
  currency: CurrencyEnum
  openRateCardDrawer: OpenRateCardDrawer
  organizationSlug: string | undefined
}

const appliedRateCardDrawerContentDefaultProps: AppliedRateCardDrawerContentProps = {
  parent: { context: 'plan', planId: '' },
  currency: CurrencyEnum.Usd,
  openRateCardDrawer: () => {},
  organizationSlug: undefined,
}

export const AppliedRateCardDrawerContent = withForm({
  defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS,
  props: appliedRateCardDrawerContentDefaultProps,
  render: function AppliedRateCardDrawerContentRender({
    form,
    parent,
    currency,
    openRateCardDrawer,
    organizationSlug,
  }) {
    const { translate } = useInternationalization()
    const { openDrawer: openRatePhaseDrawer } = useRatePhaseLocalDrawer()
    const [shouldDisplayFilter, setShouldDisplayFilter] = useState(false)

    const productId = useStore(form.store, (state) => state.values.productId)
    const productFilterId = useStore(form.store, (state) => state.values.productFilterId)
    const rateCardId = useStore(form.store, (state) => state.values.rateCardId)
    const ratePhases = useStore(form.store, (state) => state.values.ratePhases)
    const pricedProductFilterIds = usePricedProductFilterIds(parent, productId)

    const [getProducts, { data: productsData, loading: productsLoading }] =
      useGetProductsForAppliedRateCardDrawerLazyQuery({ variables: { page: 1, limit: 20 } })
    const [getProductFilters, { data: productFiltersData }] =
      useGetProductFiltersForAppliedRateCardDrawerLazyQuery()
    // Apollo merges a search-only call onto these hook variables, not onto the previous call's,
    // so typing a search keeps the product and filter scoping.
    const [
      getRateCards,
      { data: rateCardsData, loading: rateCardsLoading, refetch: refetchRateCards },
    ] = useGetRateCardsForAppliedRateCardDrawerLazyQuery({
      variables: {
        productIds: productId ? [productId] : undefined,
        productFilterIds: productFilterId ? [productFilterId] : undefined,
        currency,
        limit: 50,
      },
    })

    useEffect(() => {
      if (productId) getProductFilters({ variables: { productId } })
    }, [productId, getProductFilters])

    useEffect(() => {
      if (productId) getRateCards()
    }, [productId, productFilterId, getRateCards])

    const { options: products, selected: selectedProduct } = useOptionsWithSelection(
      productsData?.products.collection ?? [],
      (product) => product.id === productId,
    )
    const productsCombobox = buildProductsComboboxData(products, translate)

    const selectedProductFilter = productFiltersData?.productFilters.collection.find(
      (filter) => filter.id === productFilterId,
    )
    const { options: rateCards, selected: selectedRateCard } = useOptionsWithSelection(
      rateCardsData?.rateCards.collection ?? [],
      (rateCard) => rateCard.code === rateCardId,
    )

    const rateCardForPhaseFields =
      selectedProduct && selectedRateCard
        ? buildRateCardForRatePhaseFields(selectedProduct, selectedRateCard)
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

    const handleRevertPhase = (index: number): void => {
      if (!rateCardForPhaseFields) return

      const activeRateValues = getActiveRateFieldValues(rateCardForPhaseFields)

      form.setFieldValue(
        'ratePhases',
        form.state.values.ratePhases.map((phase, phaseIndex) =>
          phaseIndex === index ? { ...phase, ...activeRateValues, overrideEnabled: false } : phase,
        ),
      )
    }

    const handleRemovePhase = (index: number): void => {
      form.removeFieldValue('ratePhases', index)
    }

    const handleCreateRateCard = (): void => {
      openRateCardDrawer({
        currency,
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
          // A plain refetch keeps the typed search, which may not match the new card.
          refetchRateCards({ searchTerm: undefined, code: createdRateCard.code })
        },
      })
    }

    // An in-flight search empties the list too, which must not read as "no match".
    const createRateCardValueProps = rateCardsLoading
      ? undefined
      : { label: translate('text_1791485670326bz5dr6tcop3'), onClick: handleCreateRateCard }

    const resetFields = (
      fields: Array<
        keyof Pick<typeof APPLIED_RATE_CARD_FORM_DEFAULTS, 'productFilterId' | 'rateCardId'>
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
      resetFields(['productFilterId', 'rateCardId'])
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
                    label={translate('text_1791838459984syvvlp15glr', { currency })}
                    placeholder={translate('text_1791833366840z1t3fsw26hp')}
                    loading={rateCardsLoading}
                    allowAddValue
                    addValueProps={createRateCardValueProps}
                    searchQuery={getRateCards}
                    data={rateCards.map((rateCard) => {
                      const isPriced = pricedProductFilterIds.has(
                        rateCard.productFilter?.id ?? null,
                      )

                      return {
                        value: rateCard.code,
                        label: rateCard.name,
                        disabled: isPriced,
                        description: isPriced
                          ? translate(
                              APPLIED_RATE_CARD_CONTEXT_CONFIG[parent.context]
                                .alreadyPricedTranslationKey,
                            )
                          : undefined,
                      }
                    })}
                  />
                )}
              </form.AppField>
            </CenteredPage.PageSection>
          )}

          {!!selectedRateCard && (
            <CenteredPage.PageSection>
              <SectionHeader
                title={translate('text_1791485670326kzyf0uhsn23')}
                description={translate('text_1791833366840e0avdoxeza9')}
                contentClassName="gap-2"
                action={{
                  label: translate('text_1791485670326hf9c29bdje6'),
                  dataTest: APPLIED_RATE_CARD_DRAWER_ADD_PHASE_TEST_ID,
                  onClick: handleAddPhase,
                }}
              />

              {ratePhases.length > 0 && !!rateCardForPhaseFields && (
                <RatePhaseTable
                  phases={ratePhases}
                  rateHistoryPath={getRateHistoryPath(selectedRateCard.id, organizationSlug)}
                  rateCard={rateCardForPhaseFields}
                  onEdit={handleEditPhase}
                  onRevert={handleRevertPhase}
                  onDelete={handleRemovePhase}
                />
              )}

              {hasForeverPhaseBeforeLast && (
                <Alert type="warning">{translate('text_1791835259930jvwajr0xa8s')}</Alert>
              )}

              {lastPhaseIsFinite && (
                <Alert type="warning">{translate('text_1791485670326e1zbmola1n3')}</Alert>
              )}
            </CenteredPage.PageSection>
          )}
        </CenteredPage.SubsectionWrapper>
      </>
    )
  },
})

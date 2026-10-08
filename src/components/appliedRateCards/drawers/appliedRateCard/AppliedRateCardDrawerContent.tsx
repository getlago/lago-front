import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { useEffect, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_PRODUCT_FILTER_FOR_APPLIED_RATE_CARD_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  useGetProductFiltersForAppliedRateCardDrawerLazyQuery,
  useGetProductsForAppliedRateCardDrawerLazyQuery,
  useGetRateCardsForAppliedRateCardDrawerLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useRateCardDrawer } from '~/pages/catalog/drawers/rateCard/useRateCardDrawer'

import { APPLIED_RATE_CARD_FORM_DEFAULTS } from './validationSchema'

export const APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID = 'applied-rate-card-drawer-product'
export const APPLIED_RATE_CARD_DRAWER_SHOW_FILTER_TEST_ID = 'applied-rate-card-drawer-show-filter'
export const APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID =
  'applied-rate-card-drawer-product-filter'
export const APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID = 'applied-rate-card-drawer-rate-card'

gql`
  fragment ProductForAppliedRateCardDrawer on Product {
    id
    name
    productType
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
      }
    }
  }
`

export const AppliedRateCardDrawerContent = withForm({
  defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS,
  render: function AppliedRateCardDrawerContentRender({ form }) {
    const { translate } = useInternationalization()
    const { openDrawer: openRateCardDrawer } = useRateCardDrawer()
    const [shouldDisplayFilter, setShouldDisplayFilter] = useState(false)

    const productId = useStore(form.store, (state) => state.values.productId)
    const productFilterId = useStore(form.store, (state) => state.values.productFilterId)

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

    const selectedProduct = productsData?.products.collection.find(
      (product) => product.id === productId,
    )
    const selectedProductFilter = productFiltersData?.productFilters.collection.find(
      (filter) => filter.id === productFilterId,
    )

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

    const handleShowFilter = (): void => {
      setShouldDisplayFilter(true)
      requestAnimationFrame(() =>
        scrollToAndClickElement({
          selector: `.${SEARCH_PRODUCT_FILTER_FOR_APPLIED_RATE_CARD_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
        }),
      )
    }

    return (
      <CenteredPage.SubsectionWrapper>
        <CenteredPage.PageSection>
          <form.AppField name="productId">
            {(field) => (
              <field.ComboBoxField
                dataTest={APPLIED_RATE_CARD_DRAWER_PRODUCT_TEST_ID}
                label={translate('text_1783020794400si0ioidu0m5')}
                loading={productsLoading}
                searchQuery={getProducts}
                data={(productsData?.products.collection ?? []).map((product) => ({
                  value: product.id,
                  label: product.name,
                }))}
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
              {translate('text_66ab42d4ece7e6b7078993b9')}
            </Button>
          )}

          {shouldDisplayFilter && !!productId && (
            <form.AppField name="productFilterId">
              {(field) => (
                <field.ComboBoxField
                  dataTest={APPLIED_RATE_CARD_DRAWER_PRODUCT_FILTER_TEST_ID}
                  className={SEARCH_PRODUCT_FILTER_FOR_APPLIED_RATE_CARD_CLASSNAME}
                  label={translate('text_1783020794400u55s2kj2o4n')}
                  data={(productFiltersData?.productFilters.collection ?? []).map((filter) => ({
                    value: filter.id,
                    label: filter.name,
                  }))}
                />
              )}
            </form.AppField>
          )}
        </CenteredPage.PageSection>

        {!!productId && (
          <CenteredPage.PageSection>
            <form.AppField name="rateCardId">
              {(field) => (
                <field.ComboBoxField
                  dataTest={APPLIED_RATE_CARD_DRAWER_RATE_CARD_TEST_ID}
                  label={translate('text_17902843861564ti9tbk3ide')}
                  loading={rateCardsLoading}
                  allowAddValue
                  addValueProps={{
                    label: translate('text_17951541055448xojz4p5i90'),
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
      </CenteredPage.SubsectionWrapper>
    )
  },
})

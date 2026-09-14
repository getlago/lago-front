import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { BASE_DRAWER_CONTENT_ATTR } from '~/components/drawers/const'
import {
  CreateMoreResetSignal,
  useCreateMoreResetIteration,
} from '~/components/drawers/createMore/useCreateMore'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { BasicComboBoxData } from '~/components/form/ComboBox/types'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { ChargeInvoicingStrategyOption } from '~/components/plans/chargeAccordion/options/ChargeInvoicingStrategyOption'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_PRICING_UNIT_FOR_RATE_CARD_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  AggregationTypeEnum,
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRegroupPaidFeesEnum,
  RegroupPaidFeesEnum,
  useGetPricingUnitsForRateCardDrawerQuery,
  useGetProductFiltersForRateCardDrawerLazyQuery,
  useGetProductsForRateCardDrawerLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useChargeForm } from '~/hooks/plans/useChargeForm'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { tw } from '~/styles/utils'

import { mapInvoiceFieldsToStrategy, RATE_CARD_FORM_DEFAULTS } from './constants'

import {
  getAvailableRateModels,
  isRateCardProrationSupported,
  NO_AVAILABLE_RATE_MODELS_KEY,
} from '../../utils/rateModelAvailability'

gql`
  fragment ProductForRateCardDrawer on Product {
    id
    name
    productType
    billableMetric {
      id
      aggregationType
      recurring
    }
  }

  query getProductsForRateCardDrawer($page: Int, $limit: Int, $searchTerm: String) {
    products(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        code
        ...ProductForRateCardDrawer
      }
      metadata {
        currentPage
        totalPages
      }
    }
  }

  query getProductFiltersForRateCardDrawer($productId: ID) {
    productFilters(productId: $productId) {
      collection {
        id
        name
        code
      }
    }
  }

  query getPricingUnitsForRateCardDrawer($page: Int, $limit: Int) {
    pricingUnits(page: $page, limit: $limit) {
      collection {
        id
        name
        code
      }
    }
  }
`

export const RATE_CARD_DRAWER_CODE_TEST_ID = 'rate-card-drawer-code'
export const RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID = 'rate-card-drawer-show-description'
export const RATE_CARD_DRAWER_DESCRIPTION_TEST_ID = 'rate-card-drawer-description'
export const RATE_CARD_DRAWER_REMOVE_DESCRIPTION_TEST_ID = 'rate-card-drawer-remove-description'
export const RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID =
  'rate-card-drawer-available-models-alert'
export const RATE_CARD_DRAWER_AVAILABLE_MODEL_CHIP_TEST_ID = 'rate-card-drawer-available-model-chip'
export const RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID = 'rate-card-drawer-show-pricing-unit'
export const RATE_CARD_DRAWER_REMOVE_PRICING_UNIT_TEST_ID = 'rate-card-drawer-remove-pricing-unit'

export type RateCardComboboxSeed = { value: string; label: string } | null

export type RateCardProductSeed = {
  value: string
  label: string
  productType?: ProductTypeEnum
  aggregationType?: AggregationTypeEnum | null
  recurring?: boolean | null
} | null

type RateCardDrawerSectionsExtraProps = {
  isEdit: boolean
  isAttached: boolean
  hasRates: boolean
  disableCodeInput: boolean
  productSeed: RateCardProductSeed
  productFilterSeed: RateCardComboboxSeed
}

const rateCardDrawerSectionsDefaultProps: RateCardDrawerSectionsExtraProps = {
  isEdit: false,
  isAttached: false,
  hasRates: false,
  disableCodeInput: false,
  productSeed: null,
  productFilterSeed: null,
}

// Merge the seeded selection (needed so a disabled/prefilled combobox resolves
// its label before the options query has run) with the fetched options, keeping
// the seed first and dropping any duplicate coming back from the query.
const mergeSeededOptions = (
  seed: RateCardComboboxSeed,
  options: Array<{ value: string; label: string }>,
) => {
  if (!seed) return options

  return [seed, ...options.filter((option) => option.value !== seed.value)]
}

// Holds the reactive form state (description reveal + the derived sections that
// depend on the selected product item) so it resets alongside the form when the
// keyed wrapper remounts after a "create more" save.
const RateCardDrawerFormSections = withForm({
  defaultValues: RATE_CARD_FORM_DEFAULTS,
  props: rateCardDrawerSectionsDefaultProps,
  render: function RateCardDrawerFormSectionsRender({
    form,
    isEdit,
    isAttached,
    hasRates,
    disableCodeInput,
    productSeed,
    productFilterSeed,
  }) {
    const { translate } = useInternationalization()
    const { isPremium } = useCurrentUser()
    const { getFixedChargeModelComboboxData, getUsageChargeModelComboboxData } = useChargeForm()
    const { open: openPremiumWarningDialog } = usePremiumWarningDialog()

    const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
      () => !!form.state.values.description,
    )
    const [shouldDisplayPricingUnit, setShouldDisplayPricingUnit] = useState(
      () => !!form.state.values.pricingUnit,
    )
    const productId = useStore(form.store, (state) => state.values.productId)
    const currency = useStore(form.store, (state) => state.values.currency)
    const billingTiming = useStore(form.store, (state) => state.values.billingTiming)
    const proration = useStore(form.store, (state) => state.values.proration)
    const invoicingStrategy = useStore(form.store, (state) => state.values.invoicingStrategy)

    const [getProducts, { data: productsData, loading: productsLoading }] =
      useGetProductsForRateCardDrawerLazyQuery({ variables: { page: 1, limit: 20 } })
    const [getProductFilters, { data: productFiltersData, loading: productFiltersLoading }] =
      useGetProductFiltersForRateCardDrawerLazyQuery()
    const { data: pricingUnitsData } = useGetPricingUnitsForRateCardDrawerQuery({
      variables: { page: 1, limit: 100 },
    })

    // The item filters are scoped to the selected product item, so refetch them
    // whenever the selection changes (the combobox has no searchQuery, unlike the
    // product item one, since a header-less query would return org-wide filters).
    useEffect(() => {
      if (productId) {
        getProductFilters({ variables: { productId } })
      }
    }, [productId, getProductFilters])

    const [retainedProduct, setRetainedProduct] = useState<RateCardProductSeed>(() =>
      productSeed?.value === productId ? productSeed : null,
    )
    const queriedProducts = useMemo(
      () =>
        (productsData?.products?.collection ?? []).map((product) => ({
          value: product.id,
          label: product.name,
          productType: product.productType,
          aggregationType: product.billableMetric?.aggregationType,
          recurring: product.billableMetric?.recurring,
        })),
      [productsData?.products?.collection],
    )
    const queriedSelectedProduct = queriedProducts.find((product) => product.value === productId)
    const selectedProductMeta =
      queriedSelectedProduct ?? (retainedProduct?.value === productId ? retainedProduct : undefined)

    useEffect(() => {
      if (queriedSelectedProduct && form.state.values.productId === queriedSelectedProduct.value) {
        setRetainedProduct(queriedSelectedProduct)
      }
    }, [queriedSelectedProduct, form])

    const productsComboboxData = useMemo(
      () => mergeSeededOptions(selectedProductMeta ?? null, queriedProducts),
      [selectedProductMeta, queriedProducts],
    )

    const productFiltersComboboxData = useMemo(
      () =>
        mergeSeededOptions(
          productFilterSeed,
          (productFiltersData?.productFilters?.collection ?? []).map((filter) => ({
            value: filter.id,
            label: filter.name,
          })),
        ),
      [productFilterSeed, productFiltersData?.productFilters?.collection],
    )

    const pricingUnitsComboboxData = useMemo(
      () =>
        (pricingUnitsData?.pricingUnits?.collection ?? []).map((unit) => ({
          value: unit.code,
          label: unit.name,
        })),
      [pricingUnitsData?.pricingUnits?.collection],
    )

    const currencyComboboxData = useMemo(
      () => Object.values(CurrencyEnum).map((cur) => ({ value: cur, label: cur })),
      [],
    )

    const availableRateModels: readonly string[] | undefined = getAvailableRateModels({
      productType: selectedProductMeta?.productType,
      aggregationType: selectedProductMeta?.aggregationType,
      recurring: selectedProductMeta?.recurring,
      billingTiming,
      proration,
    })
    let rateModelOptions: BasicComboBoxData[] = []

    if (selectedProductMeta?.productType === ProductTypeEnum.Fixed) {
      rateModelOptions = getFixedChargeModelComboboxData()
    } else if (selectedProductMeta?.aggregationType) {
      rateModelOptions = getUsageChargeModelComboboxData({
        isPremium,
        aggregationType: selectedProductMeta.aggregationType,
      })
    }

    const availableRateModelLabels = rateModelOptions.flatMap((option) =>
      option.label && availableRateModels?.includes(option.value) ? [option.label] : [],
    )
    const isProrationVisible =
      proration || isRateCardProrationSupported(selectedProductMeta ?? {}) === true

    const isPayInAdvance = billingTiming === RateCardBillingTimingEnum.Advance

    const strategyLocalCharge = {
      payInAdvance: true,
      invoiceable: invoicingStrategy === 'invoiceable',
      regroupPaidFees: invoicingStrategy === 'regroupPaidFees' ? RegroupPaidFeesEnum.Invoice : null,
    }

    const handleProductChange = (value: string): void => {
      const nextProduct =
        queriedProducts.find((product) => product.value === value) ??
        (selectedProductMeta?.value === value ? selectedProductMeta : null)

      setRetainedProduct(nextProduct)
      if (
        nextProduct &&
        isRateCardProrationSupported(nextProduct) === false &&
        form.state.values.proration
      ) {
        form.setFieldValue('proration', false)
      }

      if (form.state.values.productFilterId) {
        form.setFieldValue('productFilterId', '')
      }
    }

    const handleHideDescription = () => {
      // Skip the write when already empty: setFieldValue always marks the field
      // dirty, which would arm the discard-changes prompt after a no-op
      // add-description -> trash round trip.
      if (form.state.values.description) {
        form.setFieldValue('description', '')
      }
      setShouldDisplayDescription(false)
    }

    const handleShowPricingUnit = () => {
      setShouldDisplayPricingUnit(true)

      // The combobox only exists on the next render, hence the deferred click; clicking the
      // input base both focuses the input and drops the option list open.
      scrollToAndClickElement({
        selector: `.${SEARCH_PRICING_UNIT_FOR_RATE_CARD_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
      })
    }

    const handleHidePricingUnit = () => {
      if (form.state.values.pricingUnit !== undefined) {
        form.setFieldValue('pricingUnit', undefined)
      }
      setShouldDisplayPricingUnit(false)
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate(isEdit ? 'text_17849252278173fdc5gny30g' : 'text_1784925227817k72h5sd0wyu')}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_178492522781766xwbos8bso')}
          </Typography>
        </div>
        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_1784925227817ux91jv869zn')}
              description={translate('text_1784925227817rk6mzc70x59')}
            />

            <NameAndCodeGroup
              form={form}
              fields={{ name: 'name', code: 'code' }}
              disableCodeInput={disableCodeInput}
              disableAutoGenerateCode={isEdit}
              codeDataTest={RATE_CARD_DRAWER_CODE_TEST_ID}
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
                      data-test={RATE_CARD_DRAWER_DESCRIPTION_TEST_ID}
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
                    data-test={RATE_CARD_DRAWER_REMOVE_DESCRIPTION_TEST_ID}
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
                data-test={RATE_CARD_DRAWER_SHOW_DESCRIPTION_TEST_ID}
              >
                {translate('text_642d5eb2783a2ad10d670324')}
              </Button>
            )}

            <form.AppField
              name="productId"
              listeners={{
                onChange: ({ value }) => handleProductChange(value),
              }}
            >
              {(field) => (
                <field.ComboBoxField
                  label={translate('text_1784925227817ekmphmxz74c')}
                  placeholder={translate('text_1784579021080kajutbc14la')}
                  data={productsComboboxData}
                  searchQuery={getProducts}
                  loading={productsLoading}
                  disabled={isEdit}
                />
              )}
            </form.AppField>

            {!!productId && (
              <form.AppField name="productFilterId">
                {(field) => (
                  <field.ComboBoxField
                    label={translate('text_1784925227817w9txcfey6nm')}
                    placeholder={translate('text_1784927788140s9l160t42mm')}
                    data={productFiltersComboboxData}
                    loading={productFiltersLoading}
                    disabled={isEdit}
                  />
                )}
              </form.AppField>
            )}

            <form.AppField name="currency">
              {(field) => (
                <field.ComboBoxField
                  disableClearable
                  label={translate('text_1784925227817bab1mp540x7')}
                  placeholder={translate('text_632c6e59b73f9a54d4c7224b')}
                  data={currencyComboboxData}
                  disabled={hasRates || isAttached}
                />
              )}
            </form.AppField>

            {!!currency && pricingUnitsComboboxData.length > 0 && shouldDisplayPricingUnit && (
              <div className="flex items-center gap-3">
                <form.AppField name="pricingUnit">
                  {(field) => (
                    <field.ComboBoxField
                      disableClearable
                      containerClassName="flex-1"
                      className={SEARCH_PRICING_UNIT_FOR_RATE_CARD_CLASSNAME}
                      label={translate('text_1784925227817xt1irx4wum2')}
                      placeholder={translate('text_17884232212443zsb3p8b5he')}
                      data={pricingUnitsComboboxData}
                      disabled={hasRates}
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
                    disabled={hasRates}
                    onClick={handleHidePricingUnit}
                    data-test={RATE_CARD_DRAWER_REMOVE_PRICING_UNIT_TEST_ID}
                  />
                </Tooltip>
              </div>
            )}
            {!!currency && pricingUnitsComboboxData.length > 0 && !shouldDisplayPricingUnit && (
              <Button
                fitContent
                startIcon="plus"
                variant="inline"
                disabled={hasRates}
                onClick={handleShowPricingUnit}
                data-test={RATE_CARD_DRAWER_SHOW_PRICING_UNIT_TEST_ID}
              >
                {translate('text_1788423201620lrod4vaj4e8')}
              </Button>
            )}
          </CenteredPage.PageSection>

          {!!productId && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle title={translate('text_17423672025282dl7iozy1ru')} />

              <form.AppField
                name="billingTiming"
                listeners={{
                  // Invoicing strategy only exists for pay-in-advance; reset it when
                  // switching to arrears so a stale strategy is not serialized.
                  onChange: ({ value }) => {
                    if (
                      value === RateCardBillingTimingEnum.Arrears &&
                      form.state.values.invoicingStrategy !== 'invoiceable'
                    ) {
                      form.setFieldValue('invoicingStrategy', 'invoiceable')
                    }
                  },
                }}
              >
                {(field) => (
                  <field.RadioGroupField
                    label={translate('text_6682c52081acea90520743a8')}
                    description={translate('text_1781703119230q5zam349txb')}
                    optionLabelVariant="body"
                    disabled={hasRates}
                    options={[
                      {
                        label: translate('text_6682c52081acea90520743ac'),
                        value: RateCardBillingTimingEnum.Arrears,
                      },
                      {
                        label: translate('text_6682c52081acea90520743ae'),
                        value: RateCardBillingTimingEnum.Advance,
                      },
                    ]}
                  />
                )}
              </form.AppField>

              {isPayInAdvance && (
                <ChargeInvoicingStrategyOption
                  localCharge={strategyLocalCharge}
                  disabled={hasRates}
                  openPremiumDialog={() => openPremiumWarningDialog()}
                  handleUpdate={({ invoiceable, regroupPaidFees }) => {
                    form.setFieldValue(
                      'invoicingStrategy',
                      mapInvoiceFieldsToStrategy({
                        displayOnInvoice: invoiceable,
                        regroupPaidFees:
                          regroupPaidFees === RegroupPaidFeesEnum.Invoice
                            ? RateCardRegroupPaidFeesEnum.Invoice
                            : null,
                      }),
                    )
                  }}
                />
              )}

              {isProrationVisible && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <Typography variant="captionHl" color="grey700">
                      {translate('text_177488074309762bkd4znl3p')}
                    </Typography>
                    <Typography variant="caption" color="grey600">
                      {translate('text_1774880743098ioxd3oxanxo')}
                    </Typography>
                  </div>

                  <form.AppField name="proration">
                    {(field) => (
                      <field.SwitchField
                        label={translate('text_177488074309762bkd4znl3p')}
                        disabled={hasRates}
                      />
                    )}
                  </form.AppField>
                </div>
              )}

              {availableRateModels !== undefined && (
                <Alert
                  type="info"
                  data-test={RATE_CARD_DRAWER_AVAILABLE_MODELS_ALERT_TEST_ID}
                  className="flex flex-col gap-1"
                >
                  <Typography variant="body" color="grey700">
                    {translate(
                      availableRateModels.length > 0
                        ? 'text_1784925227817ukilytyxozn'
                        : NO_AVAILABLE_RATE_MODELS_KEY,
                    )}
                  </Typography>

                  <span className="flex flex-wrap gap-1">
                    {availableRateModelLabels.map((label) => (
                      <Chip
                        key={label}
                        data-test={RATE_CARD_DRAWER_AVAILABLE_MODEL_CHIP_TEST_ID}
                        variant="captionCode"
                        color="danger600"
                        label={label}
                        size="small"
                      />
                    ))}
                  </span>
                </Alert>
              )}
            </CenteredPage.PageSection>
          )}
        </CenteredPage.SubsectionWrapper>
      </>
    )
  },
})

type RateCardDrawerContentExtraProps = RateCardDrawerSectionsExtraProps & {
  resetSignal?: CreateMoreResetSignal
}

const rateCardDrawerContentDefaultProps: RateCardDrawerContentExtraProps = {
  ...rateCardDrawerSectionsDefaultProps,
  resetSignal: undefined,
}

// Drawer body: `children` is captured once at open(), so reactive state lives
// here; `form` is the data-passing seam. After a "create more" save the reset
// signal remounts the sections (fresh fields + reveal state) with a fade-in,
// scrolls the drawer back to the top, and refocuses the Name input.
export const RateCardDrawerContent = withForm({
  defaultValues: RATE_CARD_FORM_DEFAULTS,
  props: rateCardDrawerContentDefaultProps,
  render: function RateCardDrawerContentRender({
    form,
    isEdit,
    isAttached,
    hasRates,
    disableCodeInput,
    productSeed,
    productFilterSeed,
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
          <RateCardDrawerFormSections
            form={form}
            isEdit={isEdit}
            isAttached={isAttached}
            hasRates={hasRates}
            disableCodeInput={disableCodeInput}
            productSeed={productSeed}
            productFilterSeed={productFilterSeed}
          />
        </div>
      </div>
    )
  },
})

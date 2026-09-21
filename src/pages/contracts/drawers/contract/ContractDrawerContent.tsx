import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'

import { BillingEntityFormPicker } from '~/components/billingEntity/BillingEntityFormPicker'
import { SubscriptionDatesOffsetHelperComponent } from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import { Typography } from '~/components/designSystem/Typography'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { CreateMoreResetSignal } from '~/components/drawers/createMore/useCreateMore'
import { ComboboxItem } from '~/components/form/ComboBox/ComboBoxItem'
import { ToggleableFieldAddButton, ToggleableFieldRow } from '~/components/form/ToggleableFieldRow'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentSettingsSelector } from '~/components/paymentSettings/PaymentSettingsSelector'
import { PurchaseOrderFormBlock } from '~/components/purchaseOrder/PurchaseOrderFormBlock'
import {
  VIEW_TYPE_INVOICING_CAPTION_KEYS,
  VIEW_TYPE_PAYMENT_CAPTION_KEYS,
  ViewTypeEnum,
} from '~/core/constants/billingObjectViewTypes'
import { getTimezoneConfig, getTodayAtUtcMidnight } from '~/core/timezone'
import {
  TimezoneEnum,
  useGetCatalogPlansForContractDrawerLazyQuery,
  useGetCustomersForContractDrawerLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  CONTRACT_DRAWER_CUSTOMER_COMBOBOX_TEST_ID,
  CONTRACT_DRAWER_PLAN_COMBOBOX_TEST_ID,
  CONTRACT_DRAWER_REMOVE_EXTERNAL_ID_TEST_ID,
  CONTRACT_DRAWER_REMOVE_NAME_TEST_ID,
  CONTRACT_DRAWER_SHOW_EXTERNAL_ID_TEST_ID,
  CONTRACT_DRAWER_SHOW_NAME_TEST_ID,
  CONTRACT_DRAWER_TITLE_CREATE_KEY,
  CONTRACT_FORM_DEFAULTS,
  ContractDrawerCustomer,
} from './constants'
import { ContractInvoicingSettingsSection } from './ContractInvoicingSettingsSection'

gql`
  query getCustomersForContractDrawer($page: Int, $limit: Int, $searchTerm: String) {
    customers(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        displayName
        externalId
        applicableTimezone
        billingEntity {
          id
        }
      }
    }
  }

  query getCatalogPlansForContractDrawer($page: Int, $limit: Int, $searchTerm: String) {
    catalogPlans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        name
        code
      }
    }
  }
`

const CONTRACT_DATES_OFFSET_KEYS = {
  willStart: 'text_1789552637141d30j39d0p7g',
  started: 'text_1789552637141n8qg5ybgaf0',
  // "It won't end until you manually terminate it." — object-agnostic, so the
  // subscription key is reused verbatim rather than duplicated.
  noEnd: 'text_64ef81071c6da2010dd24b1e',
  willEnd: 'text_178955263714151g6zubl71x',
}

const OPTIONS_PAGE_SIZE = 50

type ContractDrawerSectionsExtraProps = {
  seededCustomer?: ContractDrawerCustomer
}

const contractDrawerSectionsDefaultProps: ContractDrawerSectionsExtraProps = {
  seededCustomer: undefined,
}

const ContractDrawerFormSections = withForm({
  defaultValues: CONTRACT_FORM_DEFAULTS,
  props: contractDrawerSectionsDefaultProps,
  render: function ContractDrawerFormSectionsRender({ form, seededCustomer }) {
    const { translate } = useInternationalization()
    const [shouldDisplayName, setShouldDisplayName] = useState(() => !!form.state.values.name)
    const [shouldDisplayExternalId, setShouldDisplayExternalId] = useState(
      () => !!form.state.values.externalId,
    )

    // Each combobox's own searchQuery prop already fires an initial fetch on mount
    // (ComboBox -> useDebouncedSearch calls it once with no args), so no extra mount
    // effect is needed here — adding one back would double every initial request.
    const [getCustomers, { data: customersData, loading: customersLoading }] =
      useGetCustomersForContractDrawerLazyQuery({ variables: { limit: OPTIONS_PAGE_SIZE } })
    const [getCatalogPlans, { data: catalogPlansData, loading: catalogPlansLoading }] =
      useGetCatalogPlansForContractDrawerLazyQuery({ variables: { limit: OPTIONS_PAGE_SIZE } })

    const externalCustomerId = useStore(form.store, (state) => state.values.externalCustomerId)
    const billingEntityId = useStore(form.store, (state) => state.values.billingEntityId)
    const consolidateInvoice = useStore(form.store, (state) => state.values.consolidateInvoice)
    const paymentMethod = useStore(form.store, (state) => state.values.paymentMethod)
    const startedAt = useStore(form.store, (state) => state.values.startedAt)
    const endedAt = useStore(form.store, (state) => state.values.endedAt)

    // Matches the schema's own rule (endedAt must be after both startedAt and today):
    // disablePast alone would let the picker offer dates the schema then rejects.
    const minEndedAt = useMemo(() => {
      const today = DateTime.fromISO(getTodayAtUtcMidnight())
      const start = startedAt ? DateTime.fromISO(startedAt) : today

      return (start > today ? start : today).plus({ days: 1 })
    }, [startedAt])

    const customersCollection = customersData?.customers?.collection
    // Seeds from the value buildContractFormDefaults already applied, so the auto-fill
    // effect below treats the opening customer as already initialized and skips marking
    // the pristine form dirty once its billingEntity/paymentMethod data finishes loading.
    const lastInitializedCustomerRef = useRef<string | undefined>(seededCustomer?.externalId)

    const selectedCustomer = useMemo(
      () => customersCollection?.find(({ externalId }) => externalId === externalCustomerId),
      [customersCollection, externalCustomerId],
    )

    useEffect(() => {
      if (!externalCustomerId) {
        if (lastInitializedCustomerRef.current !== undefined) {
          form.setFieldValue('billingEntityId', undefined)
          form.setFieldValue('paymentMethod', undefined)
          lastInitializedCustomerRef.current = undefined
        }
        return
      }

      if (!selectedCustomer) return
      if (lastInitializedCustomerRef.current === externalCustomerId) return

      form.setFieldValue('billingEntityId', selectedCustomer.billingEntity?.id)
      form.setFieldValue('paymentMethod', undefined)
      lastInitializedCustomerRef.current = externalCustomerId
    }, [externalCustomerId, form, selectedCustomer])

    const comboboxCustomersData = useMemo(
      () =>
        (customersCollection ?? []).map((customer) => ({
          label: customer.displayName || customer.externalId,
          labelNode: (
            <ComboboxItem>
              <Typography variant="body" color="grey700" noWrap>
                {customer.displayName || customer.externalId}
              </Typography>
              <Typography variant="caption" color="grey600" noWrap>
                {customer.externalId}
              </Typography>
            </ComboboxItem>
          ),
          value: customer.externalId,
        })),
      [customersCollection],
    )

    const comboboxPlansData = useMemo(
      () =>
        (catalogPlansData?.catalogPlans?.collection ?? []).map((plan) => ({
          label: plan.name,
          labelNode: (
            <ComboboxItem>
              <Typography variant="body" color="grey700" noWrap>
                {plan.name}
              </Typography>
              <Typography variant="caption" color="grey600" noWrap>
                {plan.code}
              </Typography>
            </ComboboxItem>
          ),
          value: plan.code,
        })),
      [catalogPlansData?.catalogPlans?.collection],
    )

    // The caption reads in the customer's timezone. A seeded customer carries its
    // own; a searched one is resolved from the loaded page, and falls back to the
    // organization timezone inside the helper when it is not there.
    const customerTimezone = useMemo(() => {
      if (seededCustomer?.externalId === externalCustomerId) {
        return seededCustomer?.applicableTimezone
      }

      return customersCollection?.find(({ externalId }) => externalId === externalCustomerId)
        ?.applicableTimezone
    }, [seededCustomer, externalCustomerId, customersCollection])

    const handleHideName = (): void => {
      // Skip the write when already empty: setFieldValue always marks the field
      // dirty, which would arm the discard prompt after a no-op round trip.
      if (form.state.values.name) {
        form.setFieldValue('name', '')
      }
      setShouldDisplayName(false)
    }

    const handleHideExternalId = (): void => {
      if (form.state.values.externalId) {
        form.setFieldValue('externalId', '')
      }
      setShouldDisplayExternalId(false)
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate(CONTRACT_DRAWER_TITLE_CREATE_KEY)}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_178955263714139as5p24hhr')}
          </Typography>
        </div>

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_1789552637141n7ijvldeali')}
              description={translate('text_1789552637141hh9khhh71bm')}
            />

            <form.AppField name="externalCustomerId">
              {(field) => (
                <field.ComboBoxField
                  dataTest={CONTRACT_DRAWER_CUSTOMER_COMBOBOX_TEST_ID}
                  disabled={!!seededCustomer}
                  label={translate('text_65201c5a175a4b0238abf29a')}
                  placeholder={translate('text_17895526371417fmepv9tths')}
                  data={comboboxCustomersData}
                  loading={customersLoading}
                  searchQuery={getCustomers}
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>

            <BillingEntityFormPicker
              label={translate('text_1743611497157teaa1zu8l24')}
              value={billingEntityId}
              onChange={(id) => form.setFieldValue('billingEntityId', id)}
              helperText={translate('text_17800541562349k15h7ik07c')}
            />

            <form.AppField name="planCode">
              {(field) => (
                <field.ComboBoxField
                  dataTest={CONTRACT_DRAWER_PLAN_COMBOBOX_TEST_ID}
                  label={translate('text_625434c7bb2cb40124c81a29')}
                  placeholder={translate('text_17895526371415015p23nj8t')}
                  data={comboboxPlansData}
                  loading={catalogPlansLoading}
                  searchQuery={getCatalogPlans}
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>
          </CenteredPage.PageSection>

          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_1789552637141f58gbx5dew3')}
              description={translate('text_1789552637141f22za3l5g2u')}
            />

            {shouldDisplayExternalId && (
              <ToggleableFieldRow
                onRemove={handleHideExternalId}
                removeDataTest={CONTRACT_DRAWER_REMOVE_EXTERNAL_ID_TEST_ID}
              >
                <form.AppField name="externalId">
                  {(field) => (
                    <field.TextInputField
                      className="mr-3 flex-1"
                      label={translate('text_1790018785008xgr4069mlgg')}
                      placeholder={translate('text_1790018785008nd7mpv8ubhh')}
                      helperText={translate('text_17900187850082zn8o5dvp9y')}
                    />
                  )}
                </form.AppField>
              </ToggleableFieldRow>
            )}

            {shouldDisplayName && (
              <ToggleableFieldRow
                onRemove={handleHideName}
                removeDataTest={CONTRACT_DRAWER_REMOVE_NAME_TEST_ID}
                tooltipClassName="mt-6"
              >
                <form.AppField name="name">
                  {(field) => (
                    <field.TextInputField
                      className="mr-3 flex-1"
                      label={translate('text_1789552637141273ewsjqx7j')}
                      placeholder={translate('text_1790018785009vy05bf6zdc6')}
                    />
                  )}
                </form.AppField>
              </ToggleableFieldRow>
            )}
            <div className="flex items-center gap-4">
              {!shouldDisplayExternalId && (
                <ToggleableFieldAddButton
                  onClick={() => setShouldDisplayExternalId(true)}
                  label={translate('text_65118a52df984447c1869472')}
                  dataTest={CONTRACT_DRAWER_SHOW_EXTERNAL_ID_TEST_ID}
                />
              )}
              {!shouldDisplayName && (
                <ToggleableFieldAddButton
                  onClick={() => setShouldDisplayName(true)}
                  label={translate('text_17895526371415m2ipvxifqn')}
                  dataTest={CONTRACT_DRAWER_SHOW_NAME_TEST_ID}
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-col gap-3 md:flex-row md:[&>*]:flex-1">
                <form.AppField name="startedAt">
                  {(field) => (
                    <field.DatePickerField
                      placement="auto"
                      label={translate('text_64ef55a730b88e3d2117b3c4')}
                      defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                    />
                  )}
                </form.AppField>
                <form.AppField name="endedAt">
                  {(field) => (
                    <field.DatePickerField
                      minDate={minEndedAt}
                      placement="auto"
                      label={translate('text_64ef55a730b88e3d2117b3cc')}
                      defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                      inputProps={{ cleanable: true }}
                    />
                  )}
                </form.AppField>
              </div>

              <form.Subscribe
                selector={(state) => ({
                  startedAtErrors: state.fieldMeta.startedAt?.errors,
                  endedAtErrors: state.fieldMeta.endedAt?.errors,
                })}
              >
                {({ startedAtErrors, endedAtErrors }) =>
                  !startedAtErrors?.length &&
                  !endedAtErrors?.length && (
                    <SubscriptionDatesOffsetHelperComponent
                      customerTimezone={customerTimezone}
                      subscriptionAt={startedAt}
                      endingAt={endedAt}
                      translationKeys={CONTRACT_DATES_OFFSET_KEYS}
                    />
                  )
                }
              </form.Subscribe>
            </div>

            <form.AppField name="billingAnchorDate">
              {(field) => (
                <field.DatePickerField
                  placement="auto"
                  label={translate('text_1781859135627z59hpfpa8pt')}
                  description={translate('text_1789552637141byit8ajgqyp')}
                  defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                />
              )}
            </form.AppField>

            <form.AppField name="purchaseOrderNumber">
              {(field) => (
                <PurchaseOrderFormBlock
                  value={field.state.value}
                  description={translate('text_1790018785008trx3po6az4b')}
                  onChange={(value) => field.handleChange(value ?? undefined)}
                />
              )}
            </form.AppField>
          </CenteredPage.PageSection>

          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_17423672025282dl7iozy1ru')}
              description={translate(VIEW_TYPE_INVOICING_CAPTION_KEYS[ViewTypeEnum.Contract])}
            />
            <ContractInvoicingSettingsSection
              consolidateInvoice={consolidateInvoice}
              onChange={(value) => form.setFieldValue('consolidateInvoice', value)}
            />
          </CenteredPage.PageSection>

          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_17828013737948943pe3k8nc')}
              description={translate(VIEW_TYPE_PAYMENT_CAPTION_KEYS[ViewTypeEnum.Contract])}
            />
            <PaymentSettingsSelector
              viewType={ViewTypeEnum.Contract}
              externalCustomerId={externalCustomerId}
              value={paymentMethod}
              disabled={!externalCustomerId}
              onChange={(value) => form.setFieldValue('paymentMethod', value)}
            />
          </CenteredPage.PageSection>
        </CenteredPage.SubsectionWrapper>
      </>
    )
  },
})

type ContractDrawerContentExtraProps = ContractDrawerSectionsExtraProps & {
  resetSignal?: CreateMoreResetSignal
}

const contractDrawerContentDefaultProps: ContractDrawerContentExtraProps = {
  ...contractDrawerSectionsDefaultProps,
  resetSignal: undefined,
}

// `children` is captured once at open(), so reactive state (the name toggle, the
// remount below) has to live in this body, not the hook that opens the drawer.
export const ContractDrawerContent = withForm({
  defaultValues: CONTRACT_FORM_DEFAULTS,
  props: contractDrawerContentDefaultProps,
  render: function ContractDrawerContentRender({ form, seededCustomer, resetSignal }) {
    return (
      <CreateMoreResetBoundary resetSignal={resetSignal}>
        <ContractDrawerFormSections form={form} seededCustomer={seededCustomer} />
      </CreateMoreResetBoundary>
    )
  },
})

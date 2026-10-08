import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useRef, useState } from 'react'

import { BillingEntityFormPicker } from '~/components/billingEntity/BillingEntityFormPicker'
import { ContractDatesAndPurchaseOrderFields } from '~/components/contracts/drawers/contract/ContractDatesAndPurchaseOrderFields'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { CreateMoreResetSignal } from '~/components/drawers/createMore/useCreateMore'
import { ToggleableFieldAddButton, ToggleableFieldRow } from '~/components/form/ToggleableFieldRow'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentSettingsSelector } from '~/components/paymentSettings/PaymentSettingsSelector'
import {
  VIEW_TYPE_INVOICING_CAPTION_KEYS,
  VIEW_TYPE_PAYMENT_CAPTION_KEYS,
  ViewTypeEnum,
} from '~/core/constants/billingObjectViewTypes'
import {
  useGetCatalogPlansForContractDrawerLazyQuery,
  useGetCustomersForContractDrawerLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { buildComboboxOption, mergeSeededOption, OPTIONS_PAGE_SIZE } from './comboboxOptions'
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

export const CONTRACT_DRAWER_EXTERNAL_ID_INPUT_TEST_ID = 'contract-drawer-external-id-input'

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
    const invoiceCustomSection = useStore(form.store, (state) => state.values.invoiceCustomSection)
    const paymentMethod = useStore(form.store, (state) => state.values.paymentMethod)

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
          // A create-more reset has already emptied both: writing them again would re-dirty
          // the fresh form, since setFieldValue always marks the field dirty.
          if (form.state.values.billingEntityId !== undefined) {
            form.setFieldValue('billingEntityId', undefined)
          }
          if (form.state.values.paymentMethod !== undefined) {
            form.setFieldValue('paymentMethod', undefined)
          }
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

    const comboboxCustomersData = useMemo(() => {
      const customerSeed = seededCustomer
        ? buildComboboxOption(
            seededCustomer.displayName || seededCustomer.externalId,
            seededCustomer.externalId,
            seededCustomer.externalId,
          )
        : undefined

      return mergeSeededOption(
        customerSeed,
        (customersCollection ?? []).map((customer) =>
          buildComboboxOption(
            customer.displayName || customer.externalId,
            customer.externalId,
            customer.externalId,
          ),
        ),
      )
    }, [customersCollection, seededCustomer])

    const comboboxPlansData = useMemo(
      () =>
        (catalogPlansData?.catalogPlans?.collection ?? []).map((plan) =>
          buildComboboxOption(plan.name, plan.code, plan.code),
        ),
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

    // Mirrors the timezone lookup above: a seeded customer carries its own internal
    // id, a searched one is resolved from the loaded page.
    const customerId = useMemo(() => {
      if (seededCustomer?.externalId === externalCustomerId) {
        return seededCustomer?.id
      }

      return customersCollection?.find(({ externalId }) => externalId === externalCustomerId)?.id
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
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate(CONTRACT_DRAWER_TITLE_CREATE_KEY)}
          description={translate('text_178955263714139as5p24hhr')}
        />

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
                  searchQuery={seededCustomer ? undefined : getCustomers}
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
                      data-test={CONTRACT_DRAWER_EXTERNAL_ID_INPUT_TEST_ID}
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

            <ContractDatesAndPurchaseOrderFields
              form={form}
              fields={{
                startedAt: 'startedAt',
                endedAt: 'endedAt',
                billingAnchorDate: 'billingAnchorDate',
                purchaseOrderNumber: 'purchaseOrderNumber',
              }}
              customerTimezone={customerTimezone}
            />
          </CenteredPage.PageSection>

          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_17423672025282dl7iozy1ru')}
              description={translate(VIEW_TYPE_INVOICING_CAPTION_KEYS[ViewTypeEnum.Contract])}
            />
            <ContractInvoicingSettingsSection
              consolidateInvoice={consolidateInvoice}
              invoiceCustomSection={invoiceCustomSection}
              customerId={customerId}
              onChange={(value) => form.setFieldValue('consolidateInvoice', value)}
              onInvoiceCustomSectionChange={(value) =>
                form.setFieldValue('invoiceCustomSection', value)
              }
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
      </CenteredPage.SectionWrapper>
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

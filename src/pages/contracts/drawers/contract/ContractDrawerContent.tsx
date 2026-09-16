import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useState } from 'react'

import { SubscriptionDatesOffsetHelperComponent } from '~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { CreateMoreResetSignal } from '~/components/drawers/createMore/useCreateMore'
import { ComboboxItem } from '~/components/form/ComboBox/ComboBoxItem'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { getTimezoneConfig } from '~/core/timezone'
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
  CONTRACT_DRAWER_REMOVE_NAME_TEST_ID,
  CONTRACT_DRAWER_SHOW_NAME_TEST_ID,
  CONTRACT_DRAWER_TITLE_CREATE_KEY,
  CONTRACT_FORM_DEFAULTS,
  ContractDrawerCustomer,
} from './constants'

gql`
  query getCustomersForContractDrawer($page: Int, $limit: Int, $searchTerm: String) {
    customers(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        displayName
        externalId
        applicableTimezone
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

    const [getCustomers, { data: customersData, loading: customersLoading }] =
      useGetCustomersForContractDrawerLazyQuery({ variables: { limit: OPTIONS_PAGE_SIZE } })
    const [getCatalogPlans, { data: catalogPlansData, loading: catalogPlansLoading }] =
      useGetCatalogPlansForContractDrawerLazyQuery({ variables: { limit: OPTIONS_PAGE_SIZE } })

    // Lazy queries so the drawer only hits the API once it is actually open —
    // the hook that owns it is mounted for the whole page.
    useEffect(() => {
      getCustomers()
      getCatalogPlans()
    }, [getCustomers, getCatalogPlans])

    const externalCustomerId = useStore(form.store, (state) => state.values.externalCustomerId)
    const startedAt = useStore(form.store, (state) => state.values.startedAt)
    const endedAt = useStore(form.store, (state) => state.values.endedAt)

    const customersCollection = customersData?.customers?.collection

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

            {shouldDisplayName && (
              <div className="flex items-center">
                <form.AppField name="name">
                  {(field) => (
                    <field.TextInputField
                      className="mr-3 flex-1"
                      label={translate('text_1789552637141273ewsjqx7j')}
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
                    onClick={handleHideName}
                    data-test={CONTRACT_DRAWER_REMOVE_NAME_TEST_ID}
                  />
                </Tooltip>
              </div>
            )}
            {!shouldDisplayName && (
              <Button
                fitContent
                startIcon="plus"
                variant="inline"
                onClick={() => setShouldDisplayName(true)}
                data-test={CONTRACT_DRAWER_SHOW_NAME_TEST_ID}
              >
                {translate('text_17895526371415m2ipvxifqn')}
              </Button>
            )}

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
                      disablePast
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

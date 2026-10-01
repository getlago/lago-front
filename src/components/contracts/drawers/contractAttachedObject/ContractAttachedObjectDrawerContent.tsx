import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { BillingEntityFormPicker } from '~/components/billingEntity/BillingEntityFormPicker'
import {
  buildComboboxOption,
  mergeSeededOption,
  OPTIONS_PAGE_SIZE,
} from '~/components/contracts/drawers/contract/comboboxOptions'
import {
  ContractDrawerCustomer,
  ContractDrawerPlan,
} from '~/components/contracts/drawers/contract/constants'
import { ContractFieldLocks } from '~/components/contracts/drawers/contract/fieldLocks'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { useGetCatalogPlansForContractDrawerLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  CONTRACT_ATTACHED_OBJECT_DRAWER_CUSTOMER_TEST_ID,
  CONTRACT_ATTACHED_OBJECT_DRAWER_PLAN_COMBOBOX_TEST_ID,
  CONTRACT_ATTACHED_OBJECT_DRAWER_TITLE_KEY,
  CONTRACT_ATTACHED_OBJECT_FORM_DEFAULTS,
} from './constants'

type ContractAttachedObjectDrawerContentExtraProps = {
  fieldLocks: Pick<ContractFieldLocks, 'planCode'>
  seededCustomer: ContractDrawerCustomer
  seededPlan?: ContractDrawerPlan
}

const contractAttachedObjectDrawerContentDefaultProps: ContractAttachedObjectDrawerContentExtraProps =
  {
    fieldLocks: { planCode: false },
    seededCustomer: { externalId: '' },
    seededPlan: undefined,
  }

export const ContractAttachedObjectDrawerContent = withForm({
  defaultValues: CONTRACT_ATTACHED_OBJECT_FORM_DEFAULTS,
  props: contractAttachedObjectDrawerContentDefaultProps,
  render: function ContractAttachedObjectDrawerContentRender({
    form,
    fieldLocks,
    seededCustomer,
    seededPlan,
  }) {
    const { translate } = useInternationalization()
    const billingEntityId = useStore(form.store, (state) => state.values.billingEntityId)

    const [getCatalogPlans, { data: catalogPlansData, loading: catalogPlansLoading }] =
      useGetCatalogPlansForContractDrawerLazyQuery({ variables: { limit: OPTIONS_PAGE_SIZE } })

    const comboboxCustomerData = useMemo(
      () => [
        buildComboboxOption(
          seededCustomer.displayName || seededCustomer.externalId,
          seededCustomer.externalId,
          seededCustomer.externalId,
        ),
      ],
      [seededCustomer],
    )

    const comboboxPlansData = useMemo(() => {
      const planSeed = seededPlan
        ? buildComboboxOption(seededPlan.name, seededPlan.code, seededPlan.code)
        : undefined

      return mergeSeededOption(
        planSeed,
        (catalogPlansData?.catalogPlans?.collection ?? []).map((plan) =>
          buildComboboxOption(plan.name, plan.code, plan.code),
        ),
      )
    }, [catalogPlansData?.catalogPlans?.collection, seededPlan])

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate(CONTRACT_ATTACHED_OBJECT_DRAWER_TITLE_KEY)}
          description={translate('text_1789552637141hh9khhh71bm')}
        />

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <form.AppField name="externalCustomerId">
              {(field) => (
                <field.ComboBoxField
                  dataTest={CONTRACT_ATTACHED_OBJECT_DRAWER_CUSTOMER_TEST_ID}
                  disabled
                  label={translate('text_65201c5a175a4b0238abf29a')}
                  data={comboboxCustomerData}
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
                  dataTest={CONTRACT_ATTACHED_OBJECT_DRAWER_PLAN_COMBOBOX_TEST_ID}
                  disabled={fieldLocks.planCode}
                  label={translate('text_625434c7bb2cb40124c81a29')}
                  placeholder={translate('text_17895526371415015p23nj8t')}
                  data={comboboxPlansData}
                  loading={catalogPlansLoading}
                  searchQuery={fieldLocks.planCode ? undefined : getCatalogPlans}
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>
          </CenteredPage.PageSection>
        </CenteredPage.SubsectionWrapper>
      </CenteredPage.SectionWrapper>
    )
  },
})

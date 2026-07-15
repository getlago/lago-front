import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import {
  EditCustomerDunningCampaignFragment,
  UpdateCustomerInput,
  useEditCustomerDunningCampaignMutation,
  useGetApplicableDunningCampaignsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'

gql`
  fragment EditCustomerDunningCampaign on Customer {
    id
    externalId
    currency
    appliedDunningCampaign {
      id
    }
    excludeFromDunningCampaign
  }

  query getApplicableDunningCampaigns($currency: [CurrencyEnum!]) {
    dunningCampaigns(currency: $currency) {
      collection {
        id
        name
        code
      }
    }
  }

  mutation editCustomerDunningCampaign($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      appliedDunningCampaign {
        id
      }
      excludeFromDunningCampaign
    }
  }
`

export enum BehaviorType {
  FALLBACK = 'fallback',
  NEW_CAMPAIGN = 'newCampaign',
  DEACTIVATE = 'deactivate',
}

export const getInitialBehavior = (customer: EditCustomerDunningCampaignFragment): BehaviorType => {
  if (customer.appliedDunningCampaign?.id) return BehaviorType.NEW_CAMPAIGN
  if (customer.excludeFromDunningCampaign) return BehaviorType.DEACTIVATE
  return BehaviorType.FALLBACK
}

const EDIT_CUSTOMER_DUNNING_CAMPAIGN_FORM_ID = 'edit-customer-dunning-campaign-form'

const validationSchema = z
  .object({
    behavior: z.enum(BehaviorType),
    appliedDunningCampaignId: z.string(),
  })
  .refine(
    (data) =>
      data.behavior !== BehaviorType.NEW_CAMPAIGN || data.appliedDunningCampaignId.length > 0,
    { path: ['appliedDunningCampaignId'], message: '' },
  )

type FormValues = {
  behavior: BehaviorType
  appliedDunningCampaignId: string
}

const initialValues: FormValues = {
  behavior: BehaviorType.FALLBACK,
  appliedDunningCampaignId: '',
}

type DialogContentProps = {
  customer: EditCustomerDunningCampaignFragment | null
}

const defaultDialogContentProps: DialogContentProps = {
  customer: null,
}

const DialogContent = withForm({
  defaultValues: initialValues,
  props: defaultDialogContentProps,
  render: function Render({ form, customer }) {
    const { translate } = useInternationalization()
    const [getDunningCampaigns, { data, loading }] = useGetApplicableDunningCampaignsLazyQuery({
      variables: {
        currency: customer?.currency,
      },
    })

    useEffect(() => {
      getDunningCampaigns()
    }, [getDunningCampaigns])

    const behavior = useStore(form.store, (state) => state.values.behavior)

    return (
      <div className="mb-8 not-last-child:mb-4">
        <form.AppField name="behavior">
          {(field) => (
            <field.RadioField
              value={BehaviorType.FALLBACK}
              label={translate('text_1729543665907g5bbnbl8yvr')}
              labelVariant="body"
            />
          )}
        </form.AppField>
        <form.AppField name="behavior">
          {(field) => (
            <field.RadioField
              value={BehaviorType.NEW_CAMPAIGN}
              label={translate('text_17295436659071kau9ol0axk')}
              labelVariant="body"
            />
          )}
        </form.AppField>
        {behavior === BehaviorType.NEW_CAMPAIGN && (
          <form.AppField name="appliedDunningCampaignId">
            {(field) => (
              <field.ComboBoxField
                loading={loading}
                data={
                  data?.dunningCampaigns.collection.map((campaign) => ({
                    label: campaign.name,
                    description: campaign.code,
                    value: campaign.id,
                  })) ?? []
                }
                placeholder={translate('text_1729543690326d4dmmcw7n89')}
                PopperProps={{ displayInDialog: true }}
                emptyText={translate('text_1731078338811aok1u8oopxl')}
              />
            )}
          </form.AppField>
        )}
        <form.AppField name="behavior">
          {(field) => (
            <field.RadioField
              value={BehaviorType.DEACTIVATE}
              label={translate('text_1729543690326ndlmz7bdmy1')}
              sublabel={translate('text_17295436903267b0kiid8h8r')}
              labelVariant="body"
            />
          )}
        </form.AppField>
      </div>
    )
  },
})

export const useEditCustomerDunningCampaignDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const customerRef = useRef<EditCustomerDunningCampaignFragment | null>(null)
  const successRef = useRef(false)

  const [editCustomerDunningCampaignBehavior] = useEditCustomerDunningCampaignMutation({
    refetchQueries: ['getCustomerSettings'],
    onCompleted: (res) => {
      if (!res.updateCustomer) return
      successRef.current = true
      addToast({
        severity: 'success',
        message: translate('text_17295437652543pf2j5lqe67'),
      })
    },
  })

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: validationSchema },
    onSubmit: async ({ value }) => {
      const customer = customerRef.current

      if (!customer) return

      let formattedValues: UpdateCustomerInput = {
        id: customer.id,
        externalId: customer.externalId,
      }

      switch (value.behavior) {
        case BehaviorType.FALLBACK:
          formattedValues = {
            ...formattedValues,
            appliedDunningCampaignId: null,
            excludeFromDunningCampaign: false,
          }
          break
        case BehaviorType.NEW_CAMPAIGN:
          formattedValues = {
            ...formattedValues,
            appliedDunningCampaignId: value.appliedDunningCampaignId,
          }
          break
        case BehaviorType.DEACTIVATE:
          formattedValues = {
            ...formattedValues,
            excludeFromDunningCampaign: true,
          }
          break
      }

      await editCustomerDunningCampaignBehavior({ variables: { input: formattedValues } })
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openEditCustomerDunningCampaignDialog = (customer: EditCustomerDunningCampaignFragment) => {
    customerRef.current = customer

    form.reset()
    form.setFieldValue('behavior', getInitialBehavior(customer))
    form.setFieldValue('appliedDunningCampaignId', customer.appliedDunningCampaign?.id ?? '')

    formDialog
      .open({
        title: translate('text_1729543665906svxp253ug1g'),
        description: translate('text_1729543665907gw6pj8jsj3z'),
        children: <DialogContent customer={customer} form={form} />,
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_17295436903260tlyb1gp1i7')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_CUSTOMER_DUNNING_CAMPAIGN_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          customerRef.current = null
        }
      })
  }

  return { openEditCustomerDunningCampaignDialog }
}

import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useMemo, useRef } from 'react'
import { z } from 'zod'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_DUNNING_CAMPAIGN_INPUT_CLASSNAME,
} from '~/core/constants/form'
import {
  BillingEntity,
  useApplyBillingEntityDunningCampaignMutation,
  useGetDunningCampaignsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  mutation applyBillingEntityDunningCampaign(
    $input: BillingEntityUpdateAppliedDunningCampaignInput!
  ) {
    billingEntityUpdateAppliedDunningCampaign(input: $input) {
      id
    }
  }
`

export const APPLY_DUNNING_CAMPAIGN_FORM_ID = 'apply-dunning-campaign-form'

const applyDunningCampaignValidationSchema = z.object({
  appliedDunningCampaignId: z.string().min(1),
})

export const useApplyDunningCampaignDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const billingEntityRef = useRef<BillingEntity | null>(null)
  const successRef = useRef(false)

  const { data, loading } = useGetDunningCampaignsQuery()

  const dunningCampaigns = useMemo(
    () =>
      data?.dunningCampaigns?.collection?.map((item) => ({
        value: item.id,
        label: item.name,
        description: item.code,
      })) || [],
    [data],
  )

  const [applyBillingEntityDunningCampaign] = useApplyBillingEntityDunningCampaignMutation({
    onCompleted(_data) {
      if (_data?.billingEntityUpdateAppliedDunningCampaign) {
        successRef.current = true
        addToast({
          message: translate('text_1750663218390945tme6j9he'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getBillingEntity'],
  })

  const form = useAppForm({
    defaultValues: {
      appliedDunningCampaignId: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: applyDunningCampaignValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const billingEntity = billingEntityRef.current

      if (!billingEntity) return

      await applyBillingEntityDunningCampaign({
        variables: {
          input: {
            appliedDunningCampaignId: value.appliedDunningCampaignId,
            billingEntityId: billingEntity.id,
          },
        },
      })
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

  const openApplyDunningCampaignDialog = (billingEntity: BillingEntity) => {
    billingEntityRef.current = billingEntity
    form.reset()

    formDialog
      .open({
        title: translate('text_17506632183903il25h0wuik'),
        description: <Typography>{translate('text_1750663218390ndvitukei2q')}</Typography>,
        closeOnError: false,
        onEntered: (container) => {
          container
            .querySelector<HTMLElement>(
              `.${SEARCH_DUNNING_CAMPAIGN_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            )
            ?.click()
        },
        children: (
          <div className="p-8">
            <form.AppField name="appliedDunningCampaignId">
              {(field) => (
                <field.ComboBoxField
                  className={SEARCH_DUNNING_CAMPAIGN_INPUT_CLASSNAME}
                  label={translate('text_1750663218390lixhj94mgbp')}
                  loading={loading}
                  data={dunningCampaigns}
                  placeholder={translate('text_1750663218390emesat7jusk')}
                  PopperProps={{ displayInDialog: true }}
                  emptyText={translate('text_1750663218390rdqsn5fzioi')}
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_1750663218390xxlt86n0fhu')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: APPLY_DUNNING_CAMPAIGN_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          billingEntityRef.current = null
        }
      })
  }

  return { openApplyDunningCampaignDialog }
}

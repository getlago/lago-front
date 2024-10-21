import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import {
  EditCustomerDunningCampaignFragment,
  useGetApplicableDunningCampaignsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { ComboBoxField, RadioField } from '../form'

gql`
  fragment EditCustomerDunningCampaign on Customer {
    currency
  }

  query GetApplicableDunningCampaigns($currency: [CurrencyEnum!]) {
    dunningCampaigns(currency: $currency) {
      collection {
        id
        name
        code
      }
    }
  }
`
export interface EditCustomerDunningCampaignDialogRef extends DialogRef {}

interface EditCustomerDunningCampaignDialogProps {
  customer: EditCustomerDunningCampaignFragment
}

export const EditCustomerDunningCampaignDialog = forwardRef<
  DialogRef,
  EditCustomerDunningCampaignDialogProps
>(({ customer }: EditCustomerDunningCampaignDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [getDunningCampaigns, { data, loading }] = useGetApplicableDunningCampaignsLazyQuery({
    variables: {
      currency: customer.currency,
    },
  })

  const formikProps = useFormik({
    initialValues: {
      behavior: 'fallback',
      campaignId: '',
    },
    onSubmit: async (values) => {
      console.log(values)
      addToast({
        severity: 'success',
        message: translate('text_17295437652543pf2j5lqe67'),
      })
    },
  })

  return (
    <Dialog
      ref={ref}
      onOpen={() => {
        getDunningCampaigns()
      }}
      title={translate('text_1729543665906svxp253ug1g')}
      description={translate('text_1729543665907gw6pj8jsj3z')}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_63ea0f84f400488553caa6a5')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
          >
            {translate('text_17295436903260tlyb1gp1i7')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 not-last-child:mb-4">
        <RadioField
          name="behavior"
          formikProps={formikProps}
          value="fallback"
          label={translate('text_1729543665907g5bbnbl8yvr')}
          labelVariant="body"
        />
        <RadioField
          name="behavior"
          formikProps={formikProps}
          value="newCampaign"
          label={translate('text_17295436659071kau9ol0axk')}
          labelVariant="body"
        />
        {formikProps.values.behavior === 'newCampaign' && (
          <ComboBoxField
            name="campaignId"
            formikProps={formikProps}
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
          />
        )}
        <RadioField
          name="behavior"
          formikProps={formikProps}
          value="deactivate"
          label={translate('text_1729543690326ndlmz7bdmy1')}
          sublabel={translate('text_17295436903267b0kiid8h8r')}
          labelVariant="body"
        />
      </div>
    </Dialog>
  )
})

EditCustomerDunningCampaignDialog.displayName = 'EditCustomerDunningCampaignDialog'

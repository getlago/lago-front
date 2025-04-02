import { gql } from '@apollo/client'
import { forwardRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { OrganizationLogoPicker } from '~/components/OrganizationLogoPicker'
import { useUpdateBillingEntityLogoMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation updateBillingEntityLogo($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      code
      logoUrl
    }
  }
`

export type UpdateBillingEntityLogoDialogRef = DialogRef

export const UpdateBillingEntityLogoDialog = forwardRef<UpdateBillingEntityLogoDialogRef>(
  (_, ref) => {
    const { billingEntityCode } = useParams<string>()
    const { translate } = useInternationalization()
    const [logo, setLogo] = useState<string>()
    const [updateLogo] = useUpdateBillingEntityLogoMutation()

    return (
      <Dialog
        ref={ref}
        title={translate('text_6411e69b9bda18008db7ad51')}
        description={translate('text_6411e6a2de0b3f00b25ae488')}
        onClose={() => {
          setLogo(undefined)
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <Button
              variant="primary"
              disabled={!logo}
              onClick={async () => {
                await updateLogo({
                  variables: { input: { code: billingEntityCode as string, logo } },
                })
                closeDialog()
              }}
            >
              {translate('text_6411e6ac9a8c9700a7570a4e')}
            </Button>
          </>
        )}
      >
        <OrganizationLogoPicker
          className="mb-8"
          logoValue={logo}
          onChange={(value) => setLogo(value)}
        />
      </Dialog>
    )
  },
)

UpdateBillingEntityLogoDialog.displayName = 'UpdateBillingEntityLogoDialog'

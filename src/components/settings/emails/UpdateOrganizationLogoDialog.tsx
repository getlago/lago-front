import { gql } from '@apollo/client'
import { forwardRef, useState } from 'react'
import styled from 'styled-components'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { OrganizationLogoPicker } from '~/components/OrganizationLogoPicker'
import { useUpdateOrganizationLogoMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation updateOrganizationLogo($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      logoUrl
    }
  }
`

export type UpdateOrganizationLogoDialogRef = DialogRef

export const UpdateOrganizationLogoDialog = forwardRef<UpdateOrganizationLogoDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const [logo, setLogo] = useState<string>()
    const [updateLogo] = useUpdateOrganizationLogoMutation()

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
                  variables: { input: { logo } },
                })
                closeDialog()
              }}
            >
              {translate('text_6411e6ac9a8c9700a7570a4e')}
            </Button>
          </>
        )}
      >
        <StyledOrganizationLogoPicker logoValue={logo} onChange={(value) => setLogo(value)} />
      </Dialog>
    )
  },
)

UpdateOrganizationLogoDialog.displayName = 'UpdateOrganizationLogoDialog'

const StyledOrganizationLogoPicker = styled(OrganizationLogoPicker)`
  margin-bottom: ${theme.spacing(8)};
`

import { forwardRef, useState } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { OrganizationLogoPicker } from '~/components/OrganizationLogoPicker'
import { theme } from '~/styles'
import { useUpdateOrganizationLogoMutation } from '~/generated/graphql'

gql`
  mutation updateOrganizationLogo($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      logoUrl
    }
  }
`

export interface UpdateOrganizationLogoDialogRef extends DialogRef {}

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
        onClickAway={() => {
          setLogo(undefined)
        }}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                setLogo(undefined)
              }}
            >
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
                setLogo(undefined)
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
  }
)

UpdateOrganizationLogoDialog.displayName = 'UpdateOrganizationLogoDialog'

const StyledOrganizationLogoPicker = styled(OrganizationLogoPicker)`
  margin-bottom: ${theme.spacing(8)};
`

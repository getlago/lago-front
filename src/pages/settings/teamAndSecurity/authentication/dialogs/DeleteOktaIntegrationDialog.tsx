import { gql } from '@apollo/client'

import { DeleteOktaIntegrationDialogFragment } from '~/generated/graphql'

import {
  DeleteSSOIntegrationDialogData,
  useDeleteSSOIntegrationDialog,
} from './DeleteSSOIntegrationDialog'

gql`
  fragment DeleteOktaIntegrationDialog on OktaIntegration {
    id
    name
  }
`

type DeleteOktaIntegrationDialogData = Omit<DeleteSSOIntegrationDialogData, 'integration'> & {
  integration: DeleteOktaIntegrationDialogFragment | undefined
}

export const useDeleteOktaIntegrationDialog = () => {
  const { openDeleteSSOIntegrationDialog } = useDeleteSSOIntegrationDialog({
    integrationTypename: 'OktaIntegration',
    titleKey: 'text_664c900d2d312a01546bd84b',
    descriptionKey: 'text_664c900d2d312a01546bd84c',
    successToastKey: 'text_664c732c264d7eed1c74fdb4',
    integrationNameKey: 'text_664c732c264d7eed1c74fda2',
  })

  const openDeleteOktaIntegrationDialog = (data: DeleteOktaIntegrationDialogData) => {
    openDeleteSSOIntegrationDialog(data)
  }

  return { openDeleteOktaIntegrationDialog }
}

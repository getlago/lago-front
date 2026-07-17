import { gql } from '@apollo/client'

import { DeleteEntraIdIntegrationDialogFragment } from '~/generated/graphql'

import {
  DeleteSSOIntegrationDialogData,
  useDeleteSSOIntegrationDialog,
} from './DeleteSSOIntegrationDialog'

gql`
  fragment DeleteEntraIdIntegrationDialog on EntraIdIntegration {
    id
    name
  }
`

type DeleteEntraIdIntegrationDialogData = Omit<DeleteSSOIntegrationDialogData, 'integration'> & {
  integration: DeleteEntraIdIntegrationDialogFragment | undefined
}

export const useDeleteEntraIdIntegrationDialog = () => {
  const { openDeleteSSOIntegrationDialog } = useDeleteSSOIntegrationDialog({
    integrationTypename: 'EntraIdIntegration',
    titleKey: 'text_1784307344255lgty3uwoghl',
    descriptionKey: 'text_17843073442556cjrcl7drw6',
    successToastKey: 'text_17843073442557u380a217wd',
    integrationNameKey: 'text_17843073442548zt904xoinv',
  })

  const openDeleteEntraIdIntegrationDialog = (data: DeleteEntraIdIntegrationDialogData) => {
    openDeleteSSOIntegrationDialog(data)
  }

  return { openDeleteEntraIdIntegrationDialog }
}

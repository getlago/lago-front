import { gql } from '@apollo/client'
import { useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { ContractStatusEnum, useTerminateContractMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation terminateContract($input: TerminateContractInput!) {
    terminateContract(input: $input) {
      id
      status
      endedAt
      terminatedAt
      canceledAt
    }
  }
`

type ContractTerminationCopy = {
  actionText: string
  title: string
  description: string
  successToastKey: string
}

const TERMINATE_COPY: ContractTerminationCopy = {
  actionText: 'text_1789971751136nrprlsnx192',
  title: 'text_1789971751136dxn6qmh7ef9',
  description: 'text_178997175113710y2zapz4c9',
  successToastKey: 'text_1789971751137egm0tdl3q96',
}

const CANCEL_COPY: ContractTerminationCopy = {
  actionText: 'text_1789971751136h7hm7pbipln',
  title: 'text_1789971751136xsgqxsasdpd',
  description: 'text_1789971751137drk22mafo3k',
  successToastKey: 'text_1789971751137982utge606b',
}

export const getContractTerminationCopy = (
  status: ContractStatusEnum,
): ContractTerminationCopy | null => {
  if (status === ContractStatusEnum.Pending) return CANCEL_COPY
  if (status === ContractStatusEnum.Active) return TERMINATE_COPY

  return null
}

type ContractTerminationTarget = {
  externalId: string
  status: ContractStatusEnum
}

export const useTerminateContractDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const mutationPromiseRef = useRef<Promise<void> | null>(null)
  const [terminateContract] = useTerminateContractMutation()

  const openTerminateContractDialog = (contract?: ContractTerminationTarget): void => {
    if (!contract) return

    const copy = getContractTerminationCopy(contract.status)

    if (!copy) return

    centralizedDialog.open({
      title: translate(copy.title),
      description: <Typography>{translate(copy.description)}</Typography>,
      colorVariant: 'danger',
      actionText: translate(copy.actionText),
      closeOnError: false,
      onAction: async () => {
        if (!mutationPromiseRef.current) {
          mutationPromiseRef.current = (async () => {
            const result = await terminateContract({
              variables: { input: { externalId: contract.externalId } },
            })

            if (!result.data?.terminateContract) {
              throw new Error('Contract lifecycle mutation returned no contract')
            }

            addToast({
              severity: 'success',
              translateKey: copy.successToastKey,
            })
          })()
        }

        try {
          await mutationPromiseRef.current
        } finally {
          mutationPromiseRef.current = null
        }
      },
    })
  }

  return { openTerminateContractDialog }
}

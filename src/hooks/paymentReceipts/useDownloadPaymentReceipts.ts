import { gql } from '@apollo/client'

import { handleDownloadFile } from '~/core/utils/downloadFiles'
import { PremiumIntegrationTypeEnum, useDownloadPaymentReceiptMutation } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  mutation downloadPaymentReceipt($input: DownloadPaymentReceiptInput!) {
    downloadPaymentReceipt(input: $input) {
      id
      fileUrl
    }
  }
`

const useDownloadPaymentReceipts = () => {
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()

  const canDownloadPaymentReceipts =
    hasPermissions(['invoicesView']) &&
    hasOrganizationPremiumAddon(PremiumIntegrationTypeEnum.IssueReceipts)

  const [downloadReceipt] = useDownloadPaymentReceiptMutation({
    onCompleted({ downloadPaymentReceipt }) {
      handleDownloadFile(downloadPaymentReceipt?.fileUrl)
    },
  })

  const downloadPaymentReceipts = ({ paymentReceiptId }: { paymentReceiptId?: string }) => {
    if (!paymentReceiptId) {
      return null
    }

    downloadReceipt({
      variables: {
        input: {
          id: paymentReceiptId,
        },
      },
    })
  }

  return {
    canDownloadPaymentReceipts,
    downloadPaymentReceipts,
  }
}

export default useDownloadPaymentReceipts

import { gql } from '@apollo/client'

import { handleDownloadFile } from '~/core/utils/downloadFiles'
import { PremiumIntegrationTypeEnum, useDownloadPaymentReceiptMutation } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

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

  const canDownloadPaymentReceipts = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.IssueReceipts,
  )

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

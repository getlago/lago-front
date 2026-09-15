import { gql } from '@apollo/client'

import { handleDownloadFile, handleDownloadFileWithCors } from '~/core/utils/downloadFile'
import { useDownloadInvoicePdfMutation, useDownloadInvoiceXmlMutation } from '~/generated/graphql'

gql`
  mutation downloadInvoicePdf($input: DownloadInvoiceInput!) {
    downloadInvoice(input: $input) {
      id
      fileUrl
    }
  }

  mutation downloadInvoiceXml($input: DownloadXmlInvoiceInput!) {
    downloadInvoiceXml(input: $input) {
      id
      xmlUrl
    }
  }
`

export const useDownloadInvoice = () => {
  const [downloadInvoice, { loading: loadingInvoiceDownload }] = useDownloadInvoicePdfMutation({
    onCompleted({ downloadInvoice: downloadInvoiceData }) {
      handleDownloadFile(downloadInvoiceData?.fileUrl)
    },
  })

  const [downloadInvoiceXml, { loading: loadingInvoiceXmlDownload }] =
    useDownloadInvoiceXmlMutation({
      onCompleted({ downloadInvoiceXml: downloadInvoiceDataXml }) {
        handleDownloadFileWithCors(downloadInvoiceDataXml?.xmlUrl)
      },
    })

  return {
    downloadInvoice,
    loadingInvoiceDownload,
    downloadInvoiceXml,
    loadingInvoiceXmlDownload,
  }
}

import { gql } from '@apollo/client'

import { useDownloadInvoicePdfMutation, useDownloadInvoiceXmlMutation } from '~/generated/graphql'
import { useDownloadFile } from '~/hooks/useDownloadFile'

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
      fileUrl
    }
  }
`

export const useDownloadInvoice = () => {
  const { handleDownloadFile, handleDownloadFileWithCors } = useDownloadFile()

  const [downloadInvoice, { loading: loadingInvoiceDownload }] = useDownloadInvoicePdfMutation({
    onCompleted({ downloadInvoice: downloadInvoiceData }) {
      handleDownloadFile(downloadInvoiceData?.fileUrl)
    },
  })

  const [downloadInvoiceXml, { loading: loadingInvoiceXmlDownload }] =
    useDownloadInvoiceXmlMutation({
      onCompleted({ downloadInvoiceXml: downloadInvoiceDataXml }) {
        /* TODO: Remove this line */
        console.log('downloadInvoiceDataXml', downloadInvoiceDataXml)
        handleDownloadFileWithCors(downloadInvoiceDataXml?.fileUrl)
      },
    })

  return {
    downloadInvoice,
    loadingInvoiceDownload,
    downloadInvoiceXml,
    loadingInvoiceXmlDownload,
  }
}

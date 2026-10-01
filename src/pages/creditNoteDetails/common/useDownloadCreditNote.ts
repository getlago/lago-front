import { gql } from '@apollo/client'

import { handleDownloadFile, handleDownloadFileWithCors } from '~/core/utils/downloadFile'
import {
  useDownloadCreditNotePdfMutation,
  useDownloadCreditNoteXmlMutation,
} from '~/generated/graphql'

gql`
  mutation downloadCreditNotePdf($input: DownloadCreditNoteInput!) {
    downloadCreditNote(input: $input) {
      id
      fileUrl
    }
  }

  mutation downloadCreditNoteXml($input: DownloadXmlCreditNoteInput!) {
    downloadXmlCreditNote(input: $input) {
      id
      xmlUrl
    }
  }
`

export const useDownloadCreditNote = () => {
  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNotePdfMutation({
      onCompleted({ downloadCreditNote: downloadCreditNoteData }) {
        handleDownloadFile(downloadCreditNoteData?.fileUrl)
      },
    })

  const [downloadCreditNoteXml, { loading: loadingCreditNoteXmlDownload }] =
    useDownloadCreditNoteXmlMutation({
      onCompleted({ downloadXmlCreditNote }) {
        handleDownloadFileWithCors(downloadXmlCreditNote?.xmlUrl)
      },
    })

  return {
    downloadCreditNote,
    loadingCreditNoteDownload,
    downloadCreditNoteXml,
    loadingCreditNoteXmlDownload,
  }
}

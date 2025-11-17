import { gql } from '@apollo/client'

import {
  useDownloadCreditNotePdfMutation,
  useDownloadCreditNoteXmlMutation,
} from '~/generated/graphql'
import { useDownloadFile } from '~/hooks/useDownloadFile'

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
      fileUrl
    }
  }
`

export const useDownloadCreditNote = () => {
  const { handleDownloadFile } = useDownloadFile()
  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNotePdfMutation({
      onCompleted({ downloadCreditNote: downloadCreditNoteData }) {
        handleDownloadFile(downloadCreditNoteData?.fileUrl)
      },
    })

  const [downloadCreditNoteXml, { loading: loadingCreditNoteXmlDownload }] =
    useDownloadCreditNoteXmlMutation({
      onCompleted({ downloadXmlCreditNote }) {
        /* TODO: Remove this line */
        console.log('downloadXmlCreditNote', downloadXmlCreditNote)
        handleDownloadFile(downloadXmlCreditNote?.fileUrl)
      },
    })

  return {
    downloadCreditNote,
    loadingCreditNoteDownload,
    downloadCreditNoteXml,
    loadingCreditNoteXmlDownload,
  }
}

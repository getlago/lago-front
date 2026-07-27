import { gql } from '@apollo/client'

import { useExportFinanceAssistantResultMutation } from '~/generated/graphql'

gql`
  mutation exportFinanceAssistantResult($input: ExportFinanceAssistantResultInput!) {
    exportFinanceAssistantResult(input: $input) {
      fileUrl
      filename
    }
  }
`

export const useExportFinanceAssistant = () => {
  const [exportFinanceAssistantResult, { loading }] = useExportFinanceAssistantResultMutation()

  const exportResult = async (messageId: string) => {
    const { data } = await exportFinanceAssistantResult({
      variables: { input: { messageId } },
    })

    const result = data?.exportFinanceAssistantResult

    if (!result?.fileUrl) {
      return undefined
    }

    // The CSV is stored server-side and served as text/csv, so a plain same-tab
    // anchor triggers the download in place — no fetch (avoids the cross-origin
    // CORS block on the blob URL) and no lingering about:blank tab.
    const link = document.createElement('a')

    link.href = result.fileUrl
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    link.remove()

    return result
  }

  return { exportResult, loading }
}

import { useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'

import { parseFile } from '../lib/parseFile'

type Props = {
  onFileReady: (args: { sourceFilename: string; fileText: string }) => Promise<void>
}

export const UploadStep = ({ onFileReady }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [working, setWorking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!file) {
      setError('Please choose a file.')
      return
    }

    try {
      setWorking('Parsing file...')
      const text = await parseFile(file)

      setWorking('Sending to Claude...')
      await onFileReady({ sourceFilename: file.name, fileText: text })
    } catch (e) {
      setError((e as Error).message)
      setWorking(null)
    }
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      <div>
        <Typography variant="subhead1">Choose a pricing file</Typography>
        <Typography className="mt-1" color="grey600">
          CSV, Excel (.xlsx) or PDF. Claude will read every sheet / page and propose billable
          metrics, plans, and charges — you&rsquo;ll review and edit before anything is created.
        </Typography>

        <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-grey-300 p-10 hover:border-grey-500">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.pdf,text/csv,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="text-center">
            <Typography variant="bodyHl" color="grey700">
              {file ? file.name : 'Drop or click to pick a file'}
            </Typography>
            {file && (
              <Typography variant="caption" color="grey600">
                {(file.size / 1024).toFixed(1)} KB
              </Typography>
            )}
          </div>
        </label>
      </div>

      {error && (
        <Alert type="danger">
          <Typography color="danger600">{error}</Typography>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button variant="primary" size="large" disabled={!!working} onClick={handleSubmit}>
          {working ?? 'Analyze with Claude'}
        </Button>
        {working && (
          <Typography color="grey600" variant="caption">
            This can take 20–60 seconds for large files.
          </Typography>
        )}
      </div>
    </div>
  )
}

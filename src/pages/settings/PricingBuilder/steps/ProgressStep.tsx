import { Typography } from '~/components/designSystem/Typography'

import { PricingImportLike } from '../lib/types'

type Props = {
  pricingImport: PricingImportLike
}

export const ProgressStep = ({ pricingImport }: Props) => {
  const current = pricingImport.progressCurrent ?? 0
  const total = pricingImport.progressTotal ?? 0
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <Typography variant="subhead1">Creating your Lago config...</Typography>
        <Typography className="mt-1" color="grey600">
          This runs in the background on a Sidekiq worker — feel free to close the tab and come back.
        </Typography>
      </div>

      <div>
        <div className="mb-2 flex justify-between">
          <Typography variant="caption" color="grey700">
            {current} of {total} items created
          </Typography>
          <Typography variant="caption" color="grey700">
            {pct}%
          </Typography>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-grey-200">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {pricingImport.executionReport.length > 0 && (
        <div className="mt-2 max-h-96 overflow-auto rounded-lg border border-grey-300 p-3 font-mono text-xs">
          {pricingImport.executionReport.map((row, i) => (
            <div key={i} className="py-0.5">
              <span className={row.success ? 'text-green-700' : 'text-red-700'}>
                {row.success ? '✓' : '✗'}
              </span>{' '}
              <span className="text-grey-600">{row.kind}</span>{' '}
              <strong>{row.code}</strong>
              {row.error ? <span className="text-red-700"> — {row.error}</span> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

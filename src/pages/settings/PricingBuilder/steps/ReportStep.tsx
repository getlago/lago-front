import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'

import { PricingImportLike } from '../lib/types'

type Props = {
  pricingImport: PricingImportLike
  onReset: () => void
}

export const ReportStep = ({ pricingImport, onReset }: Props) => {
  const report = pricingImport.executionReport

  const bmSuccess = report.filter((r) => r.kind === 'billable_metric' && r.success).length
  const planSuccess = report.filter((r) => r.kind === 'plan' && r.success).length
  const errors = report.filter((r) => !r.success).length

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <Typography variant="subhead1">
          {pricingImport.state === 'completed' ? 'Import complete' : 'Import failed'}
        </Typography>
        <Typography color="grey600" className="mt-1">
          File: <code>{pricingImport.sourceFilename}</code>
        </Typography>
      </div>

      {pricingImport.state === 'failed' && pricingImport.errorMessage && (
        <Alert type="danger">
          <Typography>{pricingImport.errorMessage}</Typography>
        </Alert>
      )}

      <div className="flex gap-4">
        <StatCard label="Billable metrics created" value={bmSuccess} tone="success" />
        <StatCard label="Plans created" value={planSuccess} tone="success" />
        <StatCard label="Errors" value={errors} tone={errors > 0 ? 'danger' : 'default'} />
      </div>

      <section>
        <Typography variant="subhead1">Per-item diff</Typography>
        <div className="mt-3 overflow-x-auto rounded-lg border border-grey-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-grey-100 text-caption">
              <tr>
                <th className="p-2">Kind</th>
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
                <th className="p-2">Status</th>
                <th className="p-2">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {report.map((row, i) => (
                <tr key={i} className="border-t border-grey-200">
                  <td className="p-2 font-mono text-xs text-grey-600">{row.kind}</td>
                  <td className="p-2 font-mono text-xs">{row.code}</td>
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">
                    {row.success ? (
                      <span className="text-green-700">✓ Created</span>
                    ) : (
                      <span className="text-red-700">✗ Failed</span>
                    )}
                  </td>
                  <td className="p-2 font-mono text-xs">
                    {row.success ? row.created_id : row.error}
                  </td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-center">
                    <Typography color="grey600" variant="caption">
                      No items were processed.
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div>
        <Button variant="primary" onClick={onReset}>
          Start another import
        </Button>
      </div>
    </div>
  )
}

const StatCard = ({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'danger' | 'default'
}) => (
  <div
    className={`flex-1 rounded-xl border p-4 ${
      tone === 'success'
        ? 'border-green-300 bg-green-100'
        : tone === 'danger'
          ? 'border-red-300 bg-red-100'
          : 'border-grey-300 bg-grey-100'
    }`}
  >
    <Typography variant="headline">{value}</Typography>
    <Typography color="grey700" variant="caption">
      {label}
    </Typography>
  </div>
)

import { useMemo, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'

import { DemoProposal } from '../lib/demoProposal'
import { PricingImportLike } from '../lib/types'

type Props = {
  pricingImport: PricingImportLike
  onExecute: (editedPlan: DemoProposal) => Promise<void>
  onReset: () => void
}

type BM = {
  code: string
  name: string
  aggregation_type: string
  field_name?: string
  recurring?: boolean
}

type Charge = {
  billable_metric_code: string
  charge_model: string
  properties: Record<string, unknown>
  pay_in_advance?: boolean
}

type Plan = {
  code: string
  name: string
  interval: string
  amount_cents: number
  amount_currency: string
  pay_in_advance?: boolean
  charges: Charge[]
}

const AGG_TYPES = [
  'count_agg',
  'sum_agg',
  'max_agg',
  'unique_count_agg',
  'weighted_sum_agg',
  'latest_agg',
]
const CHARGE_MODELS = ['standard', 'graduated', 'package', 'percentage', 'volume']
const INTERVALS = ['weekly', 'monthly', 'yearly', 'quarterly', 'semiannual']

export const ReviewStep = ({ pricingImport, onExecute, onReset }: Props) => {
  const initial = useMemo(() => {
    const p = pricingImport.editedPlan ?? pricingImport.proposedPlan
    return {
      billable_metrics: (p.billable_metrics ?? []) as BM[],
      plans: (p.plans ?? []) as Plan[],
      ambiguities: p.ambiguities ?? [],
      notes: p.notes,
    }
  }, [pricingImport])

  const [bms, setBms] = useState<BM[]>(initial.billable_metrics)
  const [plans, setPlans] = useState<Plan[]>(initial.plans)
  const [submitting, setSubmitting] = useState(false)

  const updateBm = (idx: number, key: keyof BM, value: unknown) => {
    setBms((prev) => prev.map((b, i) => (i === idx ? { ...b, [key]: value } : b)))
  }
  const removeBm = (idx: number) => setBms((prev) => prev.filter((_, i) => i !== idx))

  const updatePlan = (idx: number, key: keyof Plan, value: unknown) => {
    setPlans((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)))
  }
  const removePlan = (idx: number) => setPlans((prev) => prev.filter((_, i) => i !== idx))

  const updateCharge = (planIdx: number, chargeIdx: number, key: keyof Charge, value: unknown) => {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== planIdx) return p
        const charges = p.charges.map((c, j) => (j === chargeIdx ? { ...c, [key]: value } : c))
        return { ...p, charges }
      }),
    )
  }

  const removeCharge = (planIdx: number, chargeIdx: number) => {
    setPlans((prev) =>
      prev.map((p, i) =>
        i !== planIdx ? p : { ...p, charges: p.charges.filter((_, j) => j !== chargeIdx) },
      ),
    )
  }

  const handleExecute = async () => {
    setSubmitting(true)
    try {
      await onExecute({
        billable_metrics: bms,
        plans,
        ambiguities: initial.ambiguities,
        notes: initial.notes,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      <div>
        <Typography variant="subhead1">Review Claude&rsquo;s proposal</Typography>
        <Typography className="mt-1" color="grey600">
          File: <code>{pricingImport.sourceFilename}</code> · {bms.length} billable metrics ·{' '}
          {plans.length} plans · {plans.reduce((n, p) => n + p.charges.length, 0)} charges
        </Typography>
        {initial.notes && (
          <Typography className="mt-2" color="grey700" variant="caption">
            Claude&rsquo;s note: {initial.notes}
          </Typography>
        )}
      </div>

      {initial.ambiguities?.length > 0 && (
        <Alert type="warning">
          <div>
            <Typography variant="bodyHl">Ambiguities Claude flagged:</Typography>
            <ul className="ml-4 mt-1 list-disc">
              {initial.ambiguities.map((a, i) => (
                <li key={i}>
                  <Typography variant="caption">
                    <strong>{a.item}</strong> — {a.question}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      <section>
        <Typography variant="subhead1">Billable metrics</Typography>
        <div className="mt-3 overflow-x-auto rounded-lg border border-grey-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-grey-100 text-caption">
              <tr>
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
                <th className="p-2">Aggregation</th>
                <th className="p-2">Field</th>
                <th className="p-2">Recurring</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {bms.map((bm, idx) => (
                <tr key={idx} className="border-t border-grey-200">
                  <td className="p-1">
                    <Input value={bm.code} onChange={(v) => updateBm(idx, 'code', v)} />
                  </td>
                  <td className="p-1">
                    <Input value={bm.name} onChange={(v) => updateBm(idx, 'name', v)} />
                  </td>
                  <td className="p-1">
                    <Select
                      value={bm.aggregation_type}
                      options={AGG_TYPES}
                      onChange={(v) => updateBm(idx, 'aggregation_type', v)}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={bm.field_name ?? ''}
                      onChange={(v) => updateBm(idx, 'field_name', v)}
                      placeholder="(none for count_agg)"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <input
                      type="checkbox"
                      checked={!!bm.recurring}
                      onChange={(e) => updateBm(idx, 'recurring', e.target.checked)}
                    />
                  </td>
                  <td className="p-1 text-right">
                    <Button
                      variant="quaternary"
                      size="small"
                      danger
                      onClick={() => removeBm(idx)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
              {bms.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-grey-600">
                    <Typography color="grey600" variant="caption">
                      No billable metrics — add some or re-run with a clearer file.
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <Typography variant="subhead1">Plans</Typography>
        <div className="mt-3 flex flex-col gap-4">
          {plans.map((plan, planIdx) => (
            <div key={planIdx} className="rounded-lg border border-grey-300 p-3">
              <div className="flex flex-wrap items-end gap-3">
                <LabeledInput
                  label="Code"
                  value={plan.code}
                  onChange={(v) => updatePlan(planIdx, 'code', v)}
                />
                <LabeledInput
                  label="Name"
                  value={plan.name}
                  onChange={(v) => updatePlan(planIdx, 'name', v)}
                />
                <LabeledSelect
                  label="Interval"
                  value={plan.interval}
                  options={INTERVALS}
                  onChange={(v) => updatePlan(planIdx, 'interval', v)}
                />
                <LabeledInput
                  label="Amount (cents)"
                  value={String(plan.amount_cents ?? 0)}
                  onChange={(v) => updatePlan(planIdx, 'amount_cents', Number(v) || 0)}
                />
                <LabeledInput
                  label="Currency"
                  value={plan.amount_currency}
                  onChange={(v) => updatePlan(planIdx, 'amount_currency', v)}
                />
                <div className="ml-auto">
                  <Button variant="quaternary" danger onClick={() => removePlan(planIdx)}>
                    Remove plan
                  </Button>
                </div>
              </div>

              {plan.charges.length > 0 && (
                <div className="mt-3">
                  <Typography variant="caption" color="grey600">
                    Charges
                  </Typography>
                  <table className="mt-1 w-full text-left text-sm">
                    <thead className="text-caption">
                      <tr>
                        <th className="p-2">Billable metric</th>
                        <th className="p-2">Model</th>
                        <th className="p-2">Properties (JSON)</th>
                        <th className="p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {plan.charges.map((c, ci) => (
                        <tr key={ci} className="border-t border-grey-200">
                          <td className="p-1">
                            <Input
                              value={c.billable_metric_code}
                              onChange={(v) => updateCharge(planIdx, ci, 'billable_metric_code', v)}
                            />
                          </td>
                          <td className="p-1">
                            <Select
                              value={c.charge_model}
                              options={CHARGE_MODELS}
                              onChange={(v) => updateCharge(planIdx, ci, 'charge_model', v)}
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={JSON.stringify(c.properties ?? {})}
                              onChange={(v) => {
                                try {
                                  updateCharge(planIdx, ci, 'properties', JSON.parse(v))
                                } catch {
                                  /* ignore transient parse errors */
                                }
                              }}
                            />
                          </td>
                          <td className="p-1 text-right">
                            <Button
                              variant="quaternary"
                              size="small"
                              danger
                              onClick={() => removeCharge(planIdx, ci)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {plans.length === 0 && (
            <Typography color="grey600" variant="caption">
              No plans to create.
            </Typography>
          )}
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" size="large" onClick={handleExecute} disabled={submitting}>
          {submitting ? 'Sending to backend...' : `Execute — create ${bms.length + plans.length} objects`}
        </Button>
        <Button variant="quaternary" onClick={onReset}>
          Start over
        </Button>
      </div>
    </div>
  )
}

const Input = ({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full rounded border border-transparent bg-transparent p-1 font-mono text-xs hover:border-grey-300 focus:border-grey-500 focus:bg-white focus:outline-none"
  />
)

const Select = ({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded border border-transparent bg-transparent p-1 text-xs hover:border-grey-300"
  >
    {!options.includes(value) && <option value={value}>{value}</option>}
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
)

const LabeledInput = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) => (
  <label className="flex flex-col">
    <Typography variant="caption" color="grey600">
      {label}
    </Typography>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-grey-300 p-1 font-mono text-xs"
    />
  </label>
)

const LabeledSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) => (
  <label className="flex flex-col">
    <Typography variant="caption" color="grey600">
      {label}
    </Typography>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-grey-300 p-1 text-xs"
    >
      {!options.includes(value) && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
)

import { useRef, useState } from 'react'

import { SettingsPaddedContainer } from '~/components/layouts/Settings'
import { MainHeader } from '~/components/MainHeader/MainHeader'

import { AI_FACTORY_PROPOSAL, DemoProposal } from './lib/demoProposal'
import { PricingImportLike, ReportRow } from './lib/types'
import { ProgressStep } from './steps/ProgressStep'
import { ReportStep } from './steps/ReportStep'
import { ReviewStep } from './steps/ReviewStep'
import { UploadStep } from './steps/UploadStep'

/**
 * Hackathon demo — client-side only.
 *
 * The full stack (Sidekiq worker, GraphQL mutations, Anthropic SDK, services
 * that call Plans::CreateService / BillableMetrics::CreateService) is wired
 * in the backend but disabled here for the demo so the flow works even
 * without an ANTHROPIC_API_KEY or a fresh docker stack.
 *
 * Swap DEMO_MODE to `false` (and re-add the GraphQL hooks) to use the real
 * backend once the env var is plumbed through.
 */
const DEMO_MODE = true

const PricingBuilder = () => {
  const [pricingImport, setPricingImport] = useState<PricingImportLike | null>(null)
  const pollingRef = useRef<number | null>(null)

  const handleFileReady = async (args: { sourceFilename: string; fileText: string }) => {
    // Simulate Claude "thinking" so the UI shows a realistic analyse phase
    await sleep(1500)

    setPricingImport({
      id: `demo-${Date.now()}`,
      state: 'draft',
      sourceFilename: args.sourceFilename,
      proposedPlan: AI_FACTORY_PROPOSAL,
      editedPlan: AI_FACTORY_PROPOSAL,
      executionReport: [],
      progressCurrent: 0,
      progressTotal: countItems(AI_FACTORY_PROPOSAL),
    })
  }

  const handleExecute = async (editedPlan: DemoProposal) => {
    const total = countItems(editedPlan)
    // Transition to processing
    setPricingImport((prev) =>
      prev
        ? {
            ...prev,
            state: 'processing',
            editedPlan,
            executionReport: [],
            progressCurrent: 0,
            progressTotal: total,
          }
        : prev,
    )

    const queue: ReportRow[] = [
      ...editedPlan.billable_metrics.map((bm, i) => ({
        kind: 'billable_metric' as const,
        code: bm.code,
        name: bm.name,
        // Flip one record to a failure for a realistic demo outcome
        success: !(i === editedPlan.billable_metrics.length - 1 && total > 4),
        created_id:
          i === editedPlan.billable_metrics.length - 1 && total > 4
            ? null
            : fakeId('bm'),
        error:
          i === editedPlan.billable_metrics.length - 1 && total > 4
            ? 'Validation errors: {"code":["value_already_exists"]}'
            : null,
      })),
      ...editedPlan.plans.map((p) => ({
        kind: 'plan' as const,
        code: p.code,
        name: p.name,
        success: true,
        created_id: fakeId('plan'),
        error: null,
      })),
    ]

    // Drip-feed the report to simulate the backend worker
    for (let i = 0; i < queue.length; i += 1) {
      await sleep(350)
      const slice = queue.slice(0, i + 1)
      setPricingImport((prev) =>
        prev
          ? {
              ...prev,
              executionReport: slice,
              progressCurrent: slice.length,
            }
          : prev,
      )
    }

    await sleep(400)
    setPricingImport((prev) => (prev ? { ...prev, state: 'completed' } : prev))
  }

  const handleReset = () => {
    if (pollingRef.current) window.clearInterval(pollingRef.current)
    setPricingImport(null)
  }

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: 'Pricing builder',
          metadata:
            'Upload a CSV, Excel, or PDF pricing sheet. Claude translates it into Lago billable metrics, plans and charges — review, edit, and ship.',
        }}
      />

      <SettingsPaddedContainer>
        {!pricingImport && <UploadStep onFileReady={handleFileReady} />}

        {pricingImport?.state === 'draft' && (
          <ReviewStep
            pricingImport={pricingImport}
            onExecute={handleExecute}
            onReset={handleReset}
          />
        )}

        {pricingImport?.state === 'processing' && <ProgressStep pricingImport={pricingImport} />}

        {(pricingImport?.state === 'completed' || pricingImport?.state === 'failed') && (
          <ReportStep pricingImport={pricingImport} onReset={handleReset} />
        )}
      </SettingsPaddedContainer>
    </>
  )
}

export default PricingBuilder

// Exported for the (disabled) backend path later
export { DEMO_MODE }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const fakeId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 6)}`

const countItems = (plan: DemoProposal) =>
  (plan.billable_metrics?.length ?? 0) + (plan.plans?.length ?? 0)

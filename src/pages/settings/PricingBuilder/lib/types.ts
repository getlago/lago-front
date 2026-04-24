import { DemoProposal } from './demoProposal'

export type ReportRow = {
  kind: 'billable_metric' | 'plan'
  code: string
  name: string
  success: boolean
  created_id?: string | null
  error?: string | null
}

export type PricingImportLike = {
  id: string
  state: 'draft' | 'processing' | 'completed' | 'failed'
  sourceFilename: string
  proposedPlan: DemoProposal
  editedPlan: DemoProposal
  executionReport: ReportRow[]
  progressCurrent: number
  progressTotal: number
  errorMessage?: string | null
}

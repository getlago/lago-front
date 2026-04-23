import { useEffect, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useIsAdminAuthenticated } from '~/hooks/auth/useIsAdminAuthenticated'

const REASON_CATEGORIES = [
  { value: 'trial_enablement', label: 'Trial enablement' },
  { value: 'customer_support', label: 'Customer support' },
  { value: 'bug_workaround', label: 'Bug workaround' },
  { value: 'sales_demo', label: 'Sales demo' },
  { value: 'other', label: 'Other' },
] as const

interface ReasonModalProps {
  open: boolean
  integrationName: string
  orgName: string
  enabling: boolean
  onCancel: () => void
  onConfirm: (reason: string, reasonCategory: string) => void
}

export const ReasonModal = ({
  open,
  integrationName,
  orgName,
  enabling,
  onCancel,
  onConfirm,
}: ReasonModalProps) => {
  const { adminEmail, adminRole } = useIsAdminAuthenticated()
  const [category, setCategory] = useState('')
  const [details, setDetails] = useState('')

  useEffect(() => {
    if (open) {
      setCategory('')
      setDetails('')
    }
  }, [open])

  if (!open) return null

  const formattedName = integrationName.replace(/_/g, ' ')
  const isValid = category !== '' && details.length >= 10

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(details, category)
    setCategory('')
    setDetails('')
  }

  const handleCancel = () => {
    setCategory('')
    setDetails('')
    onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleCancel}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="w-full max-w-lg rounded-xl border border-grey-300 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-grey-200 px-8 py-6">
          <Typography variant="subhead1">
            {enabling ? 'Enable' : 'Disable'} {formattedName} on {orgName}
          </Typography>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 px-8 py-6">
          {/* Category select */}
          <div className="flex flex-col gap-2">
            <Typography variant="captionHl" color="grey700">
              Reason category
            </Typography>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-xl border border-grey-400 bg-white px-4 text-sm text-grey-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Select a category</option>
              {REASON_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Details textarea */}
          <div className="flex flex-col gap-2">
            <Typography variant="captionHl" color="grey700">
              Details
            </Typography>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Link the Zendesk ticket, Slack thread, or explain why."
              className="resize-y rounded-xl border border-grey-400 bg-white px-4 py-3 text-sm text-grey-700 outline-none placeholder:text-grey-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
            <Typography variant="caption" color="grey500">
              {details.length} / 1000 characters (min 10)
            </Typography>
          </div>

          <Alert type="info">This action is logged and posted to Slack.</Alert>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-grey-200 px-8 py-6">
          <Typography variant="caption" color="grey600">
            Logged as {adminEmail || 'unknown'} ({adminRole || 'unknown'})
          </Typography>
          <div className="flex items-center gap-3">
            <Button variant="quaternary" size="medium" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="medium"
              disabled={!isValid}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

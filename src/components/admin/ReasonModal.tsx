import { create, useModal } from '@ebay/nice-modal-react'
import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import BaseDialog from '~/components/dialogs/BaseDialog'
import { CLOSE_PARAMS } from '~/components/dialogs/const'
import { Checkbox } from '~/components/form/Checkbox/Checkbox'
import { TextInput } from '~/components/form/TextInput/TextInput'

import { REASON_MODAL_NAME } from './const'

export type ReasonModalProps = {
  title: string
  description: string
  onConfirm: (reason: string, notifyOrgAdmin: boolean) => void | Promise<void>
  showNotifyCheckbox?: boolean
}

export const ReasonModal = create(
  ({ title, description, onConfirm, showNotifyCheckbox = true }: ReasonModalProps) => {
    const modal = useModal()
    const [reason, setReason] = useState('')
    const [notifyOrgAdmin, setNotifyOrgAdmin] = useState(false)
    const [loading, setLoading] = useState(false)

    const trimmedLength = reason.trim().length
    const isValid = trimmedLength >= 10 && trimmedLength <= 500

    const handleCancel = async () => {
      modal.resolve(CLOSE_PARAMS)
      modal.hide()
    }

    const handleConfirm = async () => {
      if (!isValid || loading) return
      setLoading(true)
      try {
        await onConfirm(reason.trim(), notifyOrgAdmin)
        modal.resolve({ reason: 'success' })
        modal.hide()
      } catch {
        modal.reject({ reason: 'error' })
        modal.hide()
      } finally {
        setLoading(false)
      }
    }

    return (
      <BaseDialog
        isOpen={modal.visible}
        closeDialog={handleCancel}
        removeDialog={modal.remove}
        title={title}
        description={description}
        actions={
          <>
            <Button variant="quaternary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button disabled={!isValid || loading} onClick={handleConfirm}>
              Confirm
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 p-8">
          <TextInput
            multiline
            rows={3}
            placeholder="Explain why you're making this change (10–500 characters)..."
            value={reason}
            onChange={(value) => setReason(value)}
          />
          <Typography variant="caption" color="grey600">
            {reason.length}/500 characters (minimum 10)
          </Typography>
          {showNotifyCheckbox && (
            <Checkbox
              name="notifyOrgAdmin"
              label="Email the org admin about this change"
              value={notifyOrgAdmin}
              onChange={(_, checked) => setNotifyOrgAdmin(checked)}
            />
          )}
        </div>
      </BaseDialog>
    )
  },
)

export default ReasonModal

export const useReasonModal = () => {
  const modal = useModal(REASON_MODAL_NAME)

  return {
    open: (props: ReasonModalProps) => modal.show(props) as Promise<void>,
    close: () => {
      modal.resolve(CLOSE_PARAMS)
      modal.hide()
    },
  }
}

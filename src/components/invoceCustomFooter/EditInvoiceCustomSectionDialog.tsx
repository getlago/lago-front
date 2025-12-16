import { useEffect, useMemo, useState } from 'react'

import { Dialog } from '~/components/designSystem'
import { MultipleComboBox } from '~/components/form'
import { Radio } from '~/components/form/Radio/Radio'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'

import { EditInvoiceCustomSectionDialogActions } from './EditInvoiceCustomSectionDialogActions'
import { InvoiceCustomSectionBasic } from './types'

import { ViewType, ViewTypeEnum } from '../paymentMethodsInvoiceSettings/types'

export const EDIT_ICS_DIALOG_FALLBACK_RADIO_TEST_ID =
  'edit-invoice-custom-section-dialog-fallback-radio'
export const EDIT_ICS_DIALOG_APPLY_RADIO_TEST_ID = 'edit-invoice-custom-section-dialog-apply-radio'
export const EDIT_ICS_DIALOG_NONE_RADIO_TEST_ID = 'edit-invoice-custom-section-dialog-none-radio'

export enum InvoiceCustomSectionBehavior {
  FALLBACK = 'fallback',
  APPLY = 'apply',
  NONE = 'none',
}

export interface InvoiceCustomSectionSelection {
  behavior: InvoiceCustomSectionBehavior
  selectedSections: InvoiceCustomSectionBasic[]
}

interface EditInvoiceCustomSectionDialogProps {
  open: boolean
  onClose: () => void
  selectedSections: InvoiceCustomSectionBasic[]
  skipInvoiceCustomSections: boolean
  onSave: (selection: InvoiceCustomSectionSelection) => void
  viewType: ViewType
}

export const EditInvoiceCustomSectionDialog = ({
  open,
  onClose,
  selectedSections,
  skipInvoiceCustomSections,
  onSave,
  viewType,
}: EditInvoiceCustomSectionDialogProps) => {
  const { translate } = useInternationalization()
  const { data: orgInvoiceCustomSections, loading } = useInvoiceCustomSections()

  const [behavior, setBehavior] = useState<InvoiceCustomSectionBehavior>(
    InvoiceCustomSectionBehavior.FALLBACK,
  )
  const [localSelectedSections, setLocalSelectedSections] = useState<InvoiceCustomSectionBasic[]>(
    [],
  )

  useEffect(() => {
    if (open) {
      let initialBehavior: InvoiceCustomSectionBehavior = InvoiceCustomSectionBehavior.FALLBACK

      if (skipInvoiceCustomSections) {
        initialBehavior = InvoiceCustomSectionBehavior.NONE
      } else if (selectedSections.length > 0) {
        initialBehavior = InvoiceCustomSectionBehavior.APPLY
      }

      setBehavior(initialBehavior)
      setLocalSelectedSections(selectedSections)
    }
  }, [open, selectedSections, skipInvoiceCustomSections])

  const options = useMemo(() => {
    if (!orgInvoiceCustomSections) return []

    return orgInvoiceCustomSections.map((section) => ({
      label: section.name,
      labelNode: section.name,
      value: section.id,
    }))
  }, [orgInvoiceCustomSections])

  const handleSave = (): void => {
    onSave({
      behavior,
      selectedSections:
        behavior === InvoiceCustomSectionBehavior.APPLY ? localSelectedSections : [],
    })
    onClose()
  }

  const isSaveDisabled = (): boolean => {
    if (behavior === InvoiceCustomSectionBehavior.APPLY) {
      return localSelectedSections.length === 0
    }
    return false
  }

  const getViewTypeLabel = (): string => {
    if (viewType === ViewTypeEnum.Subscription) {
      return translate('text_1764327933607nrezuuiheuc')
    }
    if (viewType === ViewTypeEnum.WalletTopUp) {
      return translate('text_1765895170354ovelm7g07o4')
    }
    if (viewType === ViewTypeEnum.WalletRecurringTopUp) {
      return translate('text_1765959116589recur1ngrul')
    }
    return viewType
  }

  const handleComboboxChange = (
    selectedOptions: { value: string; label?: string | null }[],
  ): void => {
    const mappedSections: InvoiceCustomSectionBasic[] = selectedOptions.map((option) => ({
      id: option.value,
      name: option.label || '',
    }))

    setLocalSelectedSections(mappedSections)
  }

  return (
    <Dialog
      open={open}
      title={translate('text_1765363318309snvsqc74nit', { object: getViewTypeLabel() })}
      description={translate('text_1765363318310io596s2cy1y', { object: getViewTypeLabel() })}
      onClose={onClose}
      actions={({ closeDialog }) => (
        <EditInvoiceCustomSectionDialogActions
          closeDialog={closeDialog}
          onSave={handleSave}
          isSaveDisabled={isSaveDisabled()}
          translate={translate}
        />
      )}
    >
      <div className="mb-8 flex flex-col gap-4">
        <div data-test={EDIT_ICS_DIALOG_FALLBACK_RADIO_TEST_ID}>
          <Radio
            name="invoiceCustomSectionBehavior"
            value={InvoiceCustomSectionBehavior.FALLBACK}
            checked={behavior === InvoiceCustomSectionBehavior.FALLBACK}
            onChange={(value) => setBehavior(value as InvoiceCustomSectionBehavior)}
            label={translate('text_1765363318310pzphmmbc95r')}
            labelVariant="body"
          />
        </div>
        <div>
          <div data-test={EDIT_ICS_DIALOG_APPLY_RADIO_TEST_ID}>
            <Radio
              name="invoiceCustomSectionBehavior"
              value={InvoiceCustomSectionBehavior.APPLY}
              checked={behavior === InvoiceCustomSectionBehavior.APPLY}
              onChange={(value) => setBehavior(value as InvoiceCustomSectionBehavior)}
              label={translate('text_1765363318310cus5jjpugdm', { object: getViewTypeLabel() })}
              labelVariant="body"
            />
          </div>
          {behavior === InvoiceCustomSectionBehavior.APPLY && (
            <div className="mt-4">
              <MultipleComboBox
                hideTags={false}
                forcePopupIcon
                disabled={loading}
                name="invoiceCustomSections"
                data={options}
                onChange={handleComboboxChange}
                value={localSelectedSections.map((section) => ({
                  value: section.id,
                  label: section.name,
                }))}
                placeholder={translate('text_17653633183105vrys5z3tvj')}
                PopperProps={{ displayInDialog: true }}
                emptyText={translate('text_173642092241713ws50zg9v4')}
              />
            </div>
          )}
        </div>
        <div data-test={EDIT_ICS_DIALOG_NONE_RADIO_TEST_ID}>
          <Radio
            name="invoiceCustomSectionBehavior"
            value={InvoiceCustomSectionBehavior.NONE}
            checked={behavior === InvoiceCustomSectionBehavior.NONE}
            onChange={(value) => setBehavior(value as InvoiceCustomSectionBehavior)}
            label={translate('text_1765363318310e0gyrs2ijkn', { object: getViewTypeLabel() })}
            labelVariant="body"
          />
        </div>
      </div>
    </Dialog>
  )
}

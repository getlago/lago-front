import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { VIEW_TYPE_TRANSLATION_KEYS, ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { InvoiceCustomSectionFields } from './InvoiceCustomSectionFields'
import {
  deriveInvoiceCustomSectionBehavior,
  InvoiceCustomSectionBasic,
  InvoiceCustomSectionBehavior,
  InvoiceCustomSectionInput,
  InvoiceCustomSectionSelection,
} from './types'

export const EDIT_INVOICE_CUSTOM_SECTION_FORM_ID = 'edit-invoice-custom-section-form'

export const EDIT_ICS_DIALOG_SAVE_BUTTON_TEST_ID = 'edit-invoice-custom-section-dialog-save-button'

type OpenEditInvoiceCustomSectionDialogParams = {
  customerId: string
  selectedSections: InvoiceCustomSectionBasic[]
  skipInvoiceCustomSections: boolean
  onSave: (selection: InvoiceCustomSectionSelection) => void
  viewType: ViewTypeEnum
}

type SetDisabledRef = React.MutableRefObject<(disabled: boolean) => void>

const EditInvoiceCustomSectionSaveButton = ({
  setDisabledRef,
}: {
  setDisabledRef: SetDisabledRef
}) => {
  const { translate } = useInternationalization()
  // The legacy dialog blocked save when "apply" was picked with no selection.
  // Match that: start disabled, and let the content wire the setter to react
  // to the internal draft state.
  const [disabled, setDisabled] = useState(true)

  useEffect(() => {
    setDisabledRef.current = setDisabled
  }, [setDisabledRef])

  return (
    <Button
      variant="primary"
      type="submit"
      disabled={disabled}
      data-test={EDIT_ICS_DIALOG_SAVE_BUTTON_TEST_ID}
    >
      {translate('text_1764327933607yodbve95igk')}
    </Button>
  )
}

type EditInvoiceCustomSectionDialogContentProps = {
  customerId: string
  seedValue: InvoiceCustomSectionInput
  viewType: ViewTypeEnum
  onDraftChange: (draft: InvoiceCustomSectionInput, behavior: InvoiceCustomSectionBehavior) => void
}

const EditInvoiceCustomSectionDialogContent = ({
  customerId,
  seedValue,
  viewType,
  onDraftChange,
}: EditInvoiceCustomSectionDialogContentProps) => {
  const [draft, setDraft] = useState<InvoiceCustomSectionInput>(seedValue)
  const [behavior, setBehavior] = useState<InvoiceCustomSectionBehavior>(
    deriveInvoiceCustomSectionBehavior(seedValue),
  )

  useEffect(() => {
    onDraftChange(draft, behavior)
  }, [draft, behavior, onDraftChange])

  return (
    <div className="p-8">
      <InvoiceCustomSectionFields
        viewType={viewType}
        customerId={customerId}
        value={seedValue}
        onChange={setDraft}
        onBehaviorChange={setBehavior}
      />
    </div>
  )
}

export const useEditInvoiceCustomSectionDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const draftRef = useRef<InvoiceCustomSectionInput | null>(null)
  const behaviorRef = useRef<InvoiceCustomSectionBehavior | null>(null)
  const onSaveRef = useRef<((selection: InvoiceCustomSectionSelection) => void) | null>(null)
  const setDisabledRef: SetDisabledRef = useRef<(disabled: boolean) => void>(() => {})

  const handleSubmit = async (): Promise<DialogResult> => {
    const draft = draftRef.current
    const onSave = onSaveRef.current

    if (!draft || !onSave) {
      throw new Error('Submit failed')
    }

    onSave({
      behavior: deriveInvoiceCustomSectionBehavior(draft),
      selectedSections: draft.invoiceCustomSections,
    })

    return { reason: 'success' }
  }

  const openEditInvoiceCustomSectionDialog = ({
    customerId,
    selectedSections,
    skipInvoiceCustomSections,
    onSave,
    viewType,
  }: OpenEditInvoiceCustomSectionDialogParams) => {
    const seedValue: InvoiceCustomSectionInput = {
      invoiceCustomSections: selectedSections,
      skipInvoiceCustomSections,
    }

    draftRef.current = seedValue
    behaviorRef.current = deriveInvoiceCustomSectionBehavior(seedValue)
    onSaveRef.current = onSave

    const handleDraftChange = (
      nextDraft: InvoiceCustomSectionInput,
      nextBehavior: InvoiceCustomSectionBehavior,
    ) => {
      draftRef.current = nextDraft
      behaviorRef.current = nextBehavior
      // Picking "apply" without any section must block save (legacy guard).
      const isSaveDisabled =
        nextBehavior === InvoiceCustomSectionBehavior.APPLY &&
        nextDraft.invoiceCustomSections.length === 0

      setDisabledRef.current(isSaveDisabled)
    }

    const viewTypeLabel = translate(VIEW_TYPE_TRANSLATION_KEYS[viewType])

    formDialog
      .open({
        title: translate('text_1765363318309snvsqc74nit', { object: viewTypeLabel }),
        description: translate('text_1765363318310io596s2cy1y', { object: viewTypeLabel }),
        closeOnError: false,
        children: (
          <EditInvoiceCustomSectionDialogContent
            customerId={customerId}
            seedValue={seedValue}
            viewType={viewType}
            onDraftChange={handleDraftChange}
          />
        ),
        mainAction: <EditInvoiceCustomSectionSaveButton setDisabledRef={setDisabledRef} />,
        form: {
          id: EDIT_INVOICE_CUSTOM_SECTION_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then(() => {
        draftRef.current = null
        behaviorRef.current = null
        onSaveRef.current = null
      })
  }

  return { openEditInvoiceCustomSectionDialog }
}

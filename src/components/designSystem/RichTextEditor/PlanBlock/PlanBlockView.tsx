import { revalidateLogic } from '@tanstack/react-form'
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef } from 'react'
import { z } from 'zod'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import PlanBlockDrawerContent from './PlanBlockDrawerContent'

import { useRichTextEditorContext } from '../RichTextEditorContext'

const FORM_ID = 'plan-block-form'
const FORM_SUBMIT_BUTTON_TEST_ID = 'plan-block-submit-button'

const validationSchema = z.object({
  planId: z.string().optional(),
})

export const PlanBlockView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { mode, entityDataMap } = useRichTextEditorContext()
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const hasAutoOpened = useRef(false)

  const planId = String(node.attrs.planId ?? '')
  const planData = planId ? entityDataMap?.[planId] : undefined
  const isPreview = mode === 'preview'
  const isEmpty = !planId

  const defaultValues: {
    planId?: string
  } = {
    planId: planId || undefined,
  }

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.planId) {
        updateAttributes({ planId: value.planId })
      }
      drawer.close()
    },
  })

  const openDrawer = () => {
    drawer.open({
      title: 'Select a plan',
      form: {
        id: FORM_ID,
        submit: () => form.handleSubmit(),
      },
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={FORM_SUBMIT_BUTTON_TEST_ID}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <form.AppForm>
          <PlanBlockDrawerContent form={form} />
        </form.AppForm>
      ),
    })
  }

  useEffect(() => {
    if (isEmpty && !isPreview && !hasAutoOpened.current) {
      hasAutoOpened.current = true
      openDrawer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, isPreview])

  const handleClick = () => {
    if (isPreview) return
    openDrawer()
  }

  if (isEmpty) {
    return (
      <NodeViewWrapper>
        <button
          className={`plan-block plan-block--empty ${selected ? 'plan-block--selected' : ''}`}
          onClick={handleClick}
          tabIndex={0}
        >
          <span className="plan-block__placeholder">Select a plan</span>
        </button>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <button
        className={`plan-block ${selected ? 'plan-block--selected' : ''} ${!isPreview ? 'plan-block--clickable' : ''}`}
        onClick={!isPreview ? handleClick : undefined}
        tabIndex={!isPreview ? 0 : undefined}
      >
        {planData ? (
          <table className="plan-block__table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(planData).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{String(value ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="plan-block__unresolved">
            <span>Plan: {planId}</span>
          </div>
        )}
      </button>
    </NodeViewWrapper>
  )
}

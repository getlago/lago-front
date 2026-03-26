import { revalidateLogic } from '@tanstack/react-form'
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef } from 'react'
import { z } from 'zod'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { usePlansQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import PlanBlockDrawerContent from './PlanBlockDrawerContent'

import { useRichTextEditorContext } from '../RichTextEditorContext'

export const PLAN_BLOCK_VIEW_TEST_ID = 'plan-block-view'
export const PLAN_BLOCK_VIEW_EMPTY_TEST_ID = 'plan-block-view-empty'
export const PLAN_BLOCK_VIEW_PREVIEW_TABLE_TEST_ID = 'plan-block-view-preview-table'
export const PLAN_BLOCK_VIEW_UNRESOLVED_TEST_ID = 'plan-block-view-unresolved'

const FORM_ID = 'plan-block-form'
const FORM_SUBMIT_BUTTON_TEST_ID = 'plan-block-submit-button'

const validationSchema = z.object({
  planId: z.string().optional(),
})

export const PlanBlockView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { mode, plans, setPlan } = useRichTextEditorContext()
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const hasAutoOpened = useRef(false)

  const planId = String(node.attrs.planId ?? '')
  const isPreview = mode === 'preview'
  const isEmpty = !planId

  const contextPlan = planId ? plans[planId] : undefined

  const { data: plansData } = usePlansQuery({
    variables: { limit: 100 },
    skip: !!contextPlan,
  })

  const queryPlan = planId
    ? plansData?.plans?.collection?.find((plan) => plan.id === planId)
    : undefined

  const planName = contextPlan?.name ?? queryPlan?.name
  const planCode = contextPlan?.code ?? queryPlan?.code

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
        const selectedPlan = plansData?.plans?.collection?.find((p) => p.id === value.planId)

        updateAttributes({ planId: value.planId })
        setPlan(value.planId, {
          entityId: value.planId,
          entityType: 'plan',
          name: selectedPlan?.name ?? '',
          code: selectedPlan?.code ?? '',
        })
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

  if (isPreview) {
    return (
      <NodeViewWrapper>
        <table data-test={PLAN_BLOCK_VIEW_PREVIEW_TABLE_TEST_ID}>
          <thead>
            <tr>
              <th>{planName ? 'Plan name' : 'Plan ID'}</th>
              <th>{planCode ? 'Plan code' : 'Plan ID'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{planName ?? planId}</td>
              <td>{planCode ?? planId}</td>
            </tr>
          </tbody>
        </table>
      </NodeViewWrapper>
    )
  }

  if (isEmpty) {
    return (
      <NodeViewWrapper>
        <button
          className={`plan-block plan-block--empty ${selected ? 'plan-block--selected' : ''}`}
          onClick={handleClick}
          tabIndex={0}
          data-test={PLAN_BLOCK_VIEW_EMPTY_TEST_ID}
        >
          <span className="plan-block__placeholder">Select a plan</span>
        </button>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <button
        className={`plan-block ${selected ? 'plan-block--selected' : ''}`}
        onClick={handleClick}
        data-test={PLAN_BLOCK_VIEW_TEST_ID}
      >
        {planName ? (
          <span>
            {planName} ({planCode})
          </span>
        ) : (
          <div className="plan-block__unresolved" data-test={PLAN_BLOCK_VIEW_UNRESOLVED_TEST_ID}>
            <span>Plan: {planId}</span>
          </div>
        )}
      </button>
    </NodeViewWrapper>
  )
}

import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { RateCardRateDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { RATE_CARD_RATE_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  RateCardForRateDrawerFragment,
  RateCardRateForDrawerFragment,
  RateCardRateStatusEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY,
  RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY,
  RATE_CARD_RATE_FORM_ID,
  RATE_CARD_RATE_FORM_SUBMIT_TEST_ID,
} from './constants'
import { RateCardRateDrawerContent } from './RateCardRateDrawerContent'
import { useRateCardRateForm } from './useRateCardRateForm'

export const RATE_CARD_RATE_DRAWER_SUBMIT_CREATE_KEY = 'text_178773722022763shda9obv8'
export const RATE_CARD_RATE_CREATE_SUCCESS_TOAST_KEY = 'text_1787737220228xp4gsk6phtq'
export const RATE_CARD_RATE_CREATE_LINKED_TOAST_KEY = 'text_1787737220228ohglc5h59fp'
export const RATE_CARD_RATE_EDIT_SUCCESS_TOAST_KEY = 'text_1787737220228s9wmwhscsfg'

export type OpenRateCardRateDrawerArgs = {
  rateCard: RateCardForRateDrawerFragment
  rate?: RateCardRateForDrawerFragment
}

type UseRateCardRateDrawerReturn = {
  openDrawer: (args: OpenRateCardRateDrawerArgs) => void
}

// Dual-mode drawer: `openDrawer({ rateCard })` appends a rate to the card,
// `openDrawer({ rateCard, rate })` edits it. Create mode carries the "Create more" footer
// toggle that keeps the drawer open, resets the form and links the new rate in the toast.
export const useRateCardRateDrawer = (): UseRateCardRateDrawerReturn => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  // Remembered for the whole drawer session so the "create more" reset (fired from
  // onSuccess, outside openDrawer's scope) can re-seed from the same card.
  const rateCardRef = useRef<RateCardForRateDrawerFragment | undefined>(undefined)

  const { form, resetForm, resetFormForNextCreate, getEffectiveFromBoundary } = useRateCardRateForm(
    {
      onSuccess: ({ rate, wasEdit }) => {
        if (wasEdit) {
          drawer.close()
          addToast({
            severity: 'success',
            message: translate(RATE_CARD_RATE_EDIT_SUCCESS_TOAST_KEY),
          })
          return
        }

        const rateCard = rateCardRef.current

        const rateDetailsPath = generatePath(RATE_CARD_RATE_DETAILS_ROUTE, {
          rateCardId: rateCard?.id as string,
          rateId: rate.id,
          tab: RateCardRateDetailsTabsOptionsEnum.overview,
        })

        if (isCreateMoreEnabled() && rateCard) {
          resetFormForNextCreate(rateCard, rate)
          notifyReset()
          // The drawer renders outside the matched-route context, so the router Link in the
          // toast cannot auto-prepend the org slug; bake it in here.
          addToast({
            severity: 'success',
            message: translate(RATE_CARD_RATE_CREATE_LINKED_TOAST_KEY, {
              rateCode: escapeDoubleQuotes(rate.code),
              rateUrl: prependOrgSlug(rateDetailsPath, organizationSlug),
            }),
          })
          return
        }

        drawer.close()
        navigate(rateDetailsPath)
        addToast({
          severity: 'success',
          message: translate(RATE_CARD_RATE_CREATE_SUCCESS_TOAST_KEY),
        })
      },
    },
  )

  const openDrawer = ({ rateCard, rate }: OpenRateCardRateDrawerArgs): void => {
    rateCardRef.current = rateCard
    resetCreateMore()
    resetForm(rateCard, rate)

    const isEdit = !!rate
    const isActiveRate = rate?.status === RateCardRateStatusEnum.Active

    drawer.open({
      title: isEdit
        ? translate(RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY)
        : translate(RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY),
      form: { id: RATE_CARD_RATE_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: isEdit ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={RATE_CARD_RATE_FORM_SUBMIT_TEST_ID}>
            {translate(
              isEdit ? 'text_17295436903260tlyb1gp1i7' : RATE_CARD_RATE_DRAWER_SUBMIT_CREATE_KEY,
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <RateCardRateDrawerContent
          form={form}
          rateCard={{
            currency: rateCard.currency,
            appliedPricingUnitCode: rateCard.appliedPricingUnitCode,
            billingTiming: rateCard.billingTiming,
            productType: rateCard.product.productType,
            aggregationType: rateCard.product.billableMetric?.aggregationType,
          }}
          isEdit={isEdit}
          isActiveRate={isActiveRate}
          isCodeLocked={isEdit && rateCard.attachedToPlanOrSubscription}
          getEffectiveFromBoundary={getEffectiveFromBoundary}
          // `resetForm` above already seeded the form with the deserialized amount, so read it
          // back from there rather than deriving the same value a second time.
          initialMinAmountCents={form.state.values.minAmountCents}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}

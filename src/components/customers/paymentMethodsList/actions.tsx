import { ActionItem } from '~/components/designSystem/Table'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  DestroyPaymentMethodInput,
  PaymentMethodsQuery,
  SetAsDefaultInput,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

type PaymentMethodItem = PaymentMethodsQuery['paymentMethods']['collection'][number]

interface GenerateActionColumnParams {
  translate: TranslateFunc
  setPaymentMethodAsDefault: (input: SetAsDefaultInput) => Promise<void>
  destroyPaymentMethod: (input: DestroyPaymentMethodInput) => Promise<void>
}

export const generatePaymentMethodsActions = ({
  translate,
  setPaymentMethodAsDefault,
  destroyPaymentMethod,
}: GenerateActionColumnParams): ActionItem<PaymentMethodItem>[] => {
  const setPaymentMethodAsDefaultAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'star-filled',
    title: translate('text_1728574726495n9jdse2hnrf'),
    onAction: async (paymentMethod) => {
      await setPaymentMethodAsDefault({ id: paymentMethod.id })

      addToast({
        severity: 'success',
        translateKey: translate('text_1762437511802do7br4qjc5p'),
      })
    },
  }

  const copyPaymentMethodAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'duplicate',
    title: translate('text_1762437511802p8qb8qpfy9a'),
    onAction: (paymentMethod) => {
      copyToClipboard(paymentMethod.id)

      addToast({
        severity: 'info',
        translateKey: translate('text_176243751180284tefl8wgpw'),
      })
    },
  }

  const deletePaymentMethodAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'trash',
    title: translate('text_1762437511802sg9jrl46lkb'),
    onAction: async (paymentMethod) => {
      await destroyPaymentMethod({ id: paymentMethod.id })

      addToast({
        severity: 'success',
        translateKey: translate('text_1762437511802g5ysxig14q5'),
      })
    },
  }

  return [setPaymentMethodAsDefaultAction, copyPaymentMethodAction, deletePaymentMethodAction]
}

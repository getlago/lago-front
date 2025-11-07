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
  item: PaymentMethodItem
  translate: TranslateFunc
  setPaymentMethodAsDefault: (input: SetAsDefaultInput) => Promise<void>
  destroyPaymentMethod: (input: DestroyPaymentMethodInput) => Promise<void>
}

export const generatePaymentMethodsActions = ({
  item,
  translate,
  setPaymentMethodAsDefault,
  destroyPaymentMethod,
}: GenerateActionColumnParams): ActionItem<PaymentMethodItem>[] => {
  // @ts-expect-error - delatedAt will be available when BE provides the status field
  const { id, isDefault, deletedAt } = item
  const isDeleted = !!deletedAt

  const setPaymentMethodAsDefaultAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'star-filled',
    disabled: isDefault || isDeleted,
    title: translate('text_1728574726495n9jdse2hnrf'),
    onAction: async () => {
      await setPaymentMethodAsDefault({ id })

      addToast({
        severity: 'success',
        translateKey: translate('text_1762437511802do7br4qjc5p'),
      })
    },
  }

  const copyPaymentMethodAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'duplicate',
    title: translate('text_1762437511802p8qb8qpfy9a'),
    onAction: () => {
      copyToClipboard(id)

      addToast({
        severity: 'info',
        translateKey: translate('text_176243751180284tefl8wgpw'),
      })
    },
  }

  const deletePaymentMethodAction: ActionItem<PaymentMethodItem> = {
    startIcon: 'trash',
    disabled: isDeleted,
    title: translate('text_1762437511802sg9jrl46lkb'),
    onAction: async () => {
      await destroyPaymentMethod({ id })

      addToast({
        severity: 'success',
        translateKey: translate('text_1762437511802g5ysxig14q5'),
      })
    },
  }

  return [setPaymentMethodAsDefaultAction, copyPaymentMethodAction, deletePaymentMethodAction]
}

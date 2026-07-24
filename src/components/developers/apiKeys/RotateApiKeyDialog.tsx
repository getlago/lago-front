import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { useRef } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { intlFormatDateTime } from '~/core/timezone/utils'
import {
  ApiKeyForRotateApiKeyDialogFragment,
  ApiKeyRevealedForApiKeysListFragment,
  ApiKeyRevealedForApiKeysListFragmentDoc,
  TimezoneEnum,
  useRotateApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCurrentUser } from '~/hooks/useCurrentUser'

export const ROTATE_API_KEY_DIALOG_SUBMIT_BUTTON_TEST_ID = 'rotate-api-key-submit-button'

const ROTATE_API_KEY_FORM_ID = 'rotate-api-key-form'

const ExpirationValuesEnum = {
  Now: 'Now',
  OneHour: 'OneHour',
  OneDay: 'OneDay',
  TwoDays: 'TwoDays',
  OneWeek: 'OneWeek',
} as const

const ExpirationValuesTranslationLookup: Record<keyof typeof ExpirationValuesEnum, string> = {
  Now: 'text_17321824557181ur2gp8q0sn',
  OneHour: 'text_17321824557189ifksfwy6aa',
  OneDay: 'text_173218245571817juc2f7m13',
  TwoDays: 'text_1732286530467ge3ab3gsu84',
  OneWeek: 'text_17322865304678tljv20a3mg',
}

const rotateApiKeyValidationSchema = z.object({
  expiresAt: z.string().min(1),
})

gql`
  fragment ApiKeyForRotateApiKeyDialog on SanitizedApiKey {
    id
    lastUsedAt
    name
  }

  mutation rotateApiKey($input: RotateApiKeyInput!) {
    rotateApiKey(input: $input) {
      id
      ...ApiKeyRevealedForApiKeysList
    }
  }

  ${ApiKeyRevealedForApiKeysListFragmentDoc}
`

type RotateApiKeyDialogData = {
  apiKey: ApiKeyForRotateApiKeyDialogFragment
  callBack: (itemToReveal: ApiKeyRevealedForApiKeysListFragment) => void
  openPremiumDialog: VoidFunction
}

export const useRotateApiKeyDialog = () => {
  const formDialog = useFormDialog()
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const dataRef = useRef<RotateApiKeyDialogData | null>(null)
  const successRef = useRef(false)

  const [rotateApiKey] = useRotateApiKeyMutation({
    onCompleted(data) {
      if (!!data?.rotateApiKey?.id) {
        dataRef.current?.callBack(data.rotateApiKey)

        addToast({
          message: translate('text_1731506310510htbvgegpzd8'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getApiKeys'],
  })

  const form = useAppForm({
    defaultValues: {
      expiresAt: ExpirationValuesEnum.Now as string,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: rotateApiKeyValidationSchema,
    },
    onSubmit: async ({ value: { expiresAt } }) => {
      const ExpirationValuesAsTime = {
        Now: null,
        OneHour: DateTime.now().toUTC().plus({ hours: 1 }).toISO(),
        OneDay: DateTime.now().toUTC().plus({ days: 1 }).toISO(),
        TwoDays: DateTime.now().toUTC().plus({ days: 2 }).toISO(),
        OneWeek: DateTime.now().toUTC().plus({ weeks: 1 }).toISO(),
      }
      const transformedExpiredAt =
        ExpirationValuesAsTime[expiresAt as keyof typeof ExpirationValuesEnum]

      try {
        const result = await rotateApiKey({
          variables: {
            input: {
              id: dataRef.current?.apiKey.id || '',
              expiresAt: transformedExpiredAt,
              name: dataRef.current?.apiKey.name,
            },
          },
        })

        if (result.data?.rotateApiKey?.id) {
          successRef.current = true
        }
      } catch {
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openRotateApiKeyDialog = (data: RotateApiKeyDialogData) => {
    dataRef.current = data
    form.reset()

    formDialog
      .open({
        title: translate('text_173151476175058ugha8fd08'),
        description: translate('text_1731514761750dnh1s073j9o'),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <div className="flex flex-col gap-8 p-8">
            <div className="flex w-full items-center">
              <Typography className="w-35" variant="caption" color="grey600">
                {translate('text_1731515447290xbe4iqm5n6r')}
              </Typography>
              <Typography className="flex-1" variant="body" color="grey700">
                {!!data.apiKey.lastUsedAt
                  ? intlFormatDateTime(data.apiKey.lastUsedAt, {
                      timezone: TimezoneEnum.TzUtc,
                    }).date
                  : '-'}
              </Typography>
            </div>
            <div className="flex flex-col">
              <div className="mb-4">
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_1732286530467qf204t1o5ol')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_17322865304677r38axxm3cc')}
                </Typography>
              </div>

              <div className="flex flex-col gap-4">
                <form.AppField name="expiresAt">
                  {(field) => (
                    <>
                      <field.RadioField
                        labelVariant="body"
                        value={ExpirationValuesEnum.Now}
                        label={translate(ExpirationValuesTranslationLookup.Now)}
                      />
                      {!isPremium && (
                        <div className="flex w-full flex-row items-center justify-between gap-2 rounded-xl bg-grey-100 px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex flex-row items-center gap-2">
                              <Typography variant="bodyHl" color="grey700">
                                {translate('text_1732286530467ezav2z7ypj1')}
                              </Typography>
                              <Icon name="sparkles" />
                            </div>

                            <Typography variant="caption" color="grey600">
                              {translate('text_1732286530467gnhwm6q5ftl')}
                            </Typography>
                          </div>
                          <Button
                            endIcon="sparkles"
                            variant="tertiary"
                            onClick={data.openPremiumDialog}
                          >
                            {translate('text_65ae73ebe3a66bec2b91d72d')}
                          </Button>
                        </div>
                      )}
                      <field.RadioField
                        labelVariant="body"
                        disabled={!isPremium}
                        value={ExpirationValuesEnum.OneHour}
                        label={translate(ExpirationValuesTranslationLookup.OneHour)}
                      />
                      <field.RadioField
                        labelVariant="body"
                        disabled={!isPremium}
                        value={ExpirationValuesEnum.OneDay}
                        label={translate(ExpirationValuesTranslationLookup.OneDay)}
                      />
                      <field.RadioField
                        labelVariant="body"
                        disabled={!isPremium}
                        value={ExpirationValuesEnum.TwoDays}
                        label={translate(ExpirationValuesTranslationLookup.TwoDays)}
                      />
                      <field.RadioField
                        labelVariant="body"
                        disabled={!isPremium}
                        value={ExpirationValuesEnum.OneWeek}
                        label={translate(ExpirationValuesTranslationLookup.OneWeek)}
                      />
                    </>
                  )}
                </form.AppField>
              </div>
            </div>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton danger dataTest={ROTATE_API_KEY_DIALOG_SUBMIT_BUTTON_TEST_ID}>
              {translate('text_173151476175058ugha8fd08')}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ROTATE_API_KEY_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then(() => {
        form.reset()
        dataRef.current = null
      })
  }

  return { openRotateApiKeyDialog }
}

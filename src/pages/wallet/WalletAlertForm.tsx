import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useCallback, useMemo } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { AlertNameAndCodeSection } from '~/components/alerts/AlertNameAndCodeSection'
import AlertThresholds, { isThresholdValueValid } from '~/components/alerts/Thresholds'
import { useAlertFormLeaveGuards } from '~/components/alerts/useAlertFormLeaveGuards'
import { createThresholdSetters, setCodeAlreadyExistsError } from '~/components/alerts/utils'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  CLOSE_WALLET_ALERT_BUTTON_DATA_TEST,
  SUBMIT_WALLET_ALERT_DATA_TEST,
  WALLET_ALERT_FORM_TEST_ID,
  WALLET_ALERT_TYPE_COMBOBOX_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { useNavigate, WALLET_DETAILS_ROUTE } from '~/core/router'
import {
  AlertTypeEnum,
  CurrencyEnum,
  LagoApiError,
  useCreateWalletAlertMutation,
  useGetWalletAlertsQuery,
  useGetWalletAlertToEditQuery,
  useGetWalletDetailsQuery,
  useUpdateWalletAlertMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  mapFormToCreateInput,
  mapFormToUpdateInput,
  mapFromApiToForm,
} from '~/pages/wallet/walletAlertForm/mappers'
import { isWalletCreditsAlert, isWalletOngoingAlert } from '~/pages/wallet/walletAlertForm/utils'
import { walletAlertValidationSchema } from '~/pages/wallet/walletAlertForm/validationSchema'
import { WalletDetailsTabsOptionsEnum } from '~/pages/wallet/WalletDetails'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

const WALLET_ALERT_FORM_ID = 'create-wallet-alert'

gql`
  query getWalletAlertToEdit($id: ID!) {
    walletAlert(id: $id) {
      id
      alertType
      walletId
      code
      name
      thresholds {
        code
        recurring
        value
      }
    }
  }

  mutation createWalletAlert($input: CreateCustomerWalletAlertInput!) {
    createCustomerWalletAlert(input: $input) {
      id
    }
  }

  mutation updateWalletAlert($input: UpdateCustomerWalletAlertInput!) {
    updateCustomerWalletAlert(input: $input) {
      id
    }
  }
`

const WalletAlertForm = () => {
  const { alertId = '', customerId = '', walletId = '' } = useParams()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const isEdition = !!alertId

  const { data, loading } = useGetWalletDetailsQuery({
    variables: { walletId: walletId as string },
    skip: !walletId,
  })

  const { data: existingAlertsData, loading: existingAlertsLoading } = useGetWalletAlertsQuery({
    variables: {
      walletId: walletId as string,
    },
    skip: !walletId,
  })

  const {
    data: alertData,
    loading: alertLoading,
    error: alertError,
  } = useGetWalletAlertToEditQuery({
    variables: { id: alertId },
    skip: !isEdition,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const isLoading = loading || alertLoading || existingAlertsLoading

  const existingAlertsTypes = useMemo(() => {
    return existingAlertsData?.walletAlerts?.collection?.map((al) => al.alertType)
  }, [existingAlertsData?.walletAlerts?.collection])

  const existingAlert = alertData?.walletAlert
  const currency = data?.wallet?.currency || CurrencyEnum.Usd

  const onLeave = useCallback(
    ({ replace = false }: { replace?: boolean } = {}) => {
      if (!!customerId) {
        navigate(
          generatePath(WALLET_DETAILS_ROUTE, {
            customerId,
            walletId,
            tab: WalletDetailsTabsOptionsEnum.alerts,
          }),
          { replace },
        )
      }
    },
    [customerId, navigate, walletId],
  )

  const { openDirtyAttributesWarning } = useAlertFormLeaveGuards({
    isEdition,
    alertLoading,
    alertError,
    onLeave,
  })

  const [updateAlert] = useUpdateWalletAlertMutation()
  const [createAlert] = useCreateWalletAlertMutation()

  const defaultValues = useMemo(
    () =>
      mapFromApiToForm({
        walletId: data?.wallet?.id || '',
        currency,
        alert: existingAlert,
      }),
    [currency, data?.wallet?.id, existingAlert],
  )

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: walletAlertValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const { alertType } = value

      // Guaranteed by the schema, narrows the type for the mappers
      if (!alertType) return

      const validatedValues = { ...value, alertType }

      if (!!existingAlert?.id) {
        const { data: updateData, errors } = await updateAlert({
          variables: {
            input: mapFormToUpdateInput(validatedValues, existingAlert.id, currency),
          },
        })

        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
          setCodeAlreadyExistsError(formApi)

          return
        }

        if (!updateData?.updateCustomerWalletAlert?.id) return

        addToast({
          severity: 'success',
          translateKey: 'text_1746623860224qwhtxyuophr',
        })
      } else {
        const { data: createData, errors } = await createAlert({
          variables: {
            input: mapFormToCreateInput(validatedValues, currency),
          },
        })

        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
          setCodeAlreadyExistsError(formApi)

          return
        }

        if (!createData?.createCustomerWalletAlert?.id) return

        addToast({
          severity: 'success',
          translateKey: 'text_1746611635509ov7jepx55bz',
        })
      }

      onLeave()
    },
  })

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const alertType = useStore(form.store, (state) => state.values.alertType)
  const thresholds = useStore(form.store, (state) => state.values.thresholds)

  const hasAnyNonRecurringThresholdError = useMemo(() => {
    const localNonRecurringThresholds = thresholds.filter((threshold) => !threshold.recurring)

    return localNonRecurringThresholds.some((threshold, i) =>
      isThresholdValueValid(i, threshold.value, localNonRecurringThresholds, true),
    )
  }, [thresholds])

  const { setThresholds, setThresholdValue } = useMemo(() => createThresholdSetters(form), [form])

  const defaultTypesData = useMemo(
    () => [
      {
        label: translate('text_1773051593209b2tulsrwgoq'),
        value: AlertTypeEnum.WalletCreditsBalance,
      },
      {
        label: translate('text_1773051593209u4yacfcm339'),
        value: AlertTypeEnum.WalletCreditsOngoingBalance,
      },
      {
        label: translate('text_17730515932099j2rzezwwf0'),
        value: AlertTypeEnum.WalletBalanceAmount,
      },
      {
        label: translate('text_1773051593209gg3667wtxse'),
        value: AlertTypeEnum.WalletOngoingBalanceAmount,
      },
    ],
    [translate],
  )

  const comboboxData = useMemo(() => {
    return defaultTypesData?.filter((item) => !existingAlertsTypes?.includes(item.value))
  }, [defaultTypesData, existingAlertsTypes])

  const onAbort = () => (isDirty ? openDirtyAttributesWarning() : onLeave())

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <CenteredPage.Wrapper>
      <form
        id={WALLET_ALERT_FORM_ID}
        className="flex size-full min-h-full flex-col overflow-auto"
        onSubmit={handleSubmit}
        data-test={WALLET_ALERT_FORM_TEST_ID}
      >
        <CenteredPage.Header>
          <div className="flex gap-3">
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate(
                isEdition ? 'text_1773051593208zapkd7kjz1d' : 'text_1773051593208nq2x0gbp83t',
              )}
            </Typography>
          </div>

          <Button
            variant="quaternary"
            icon="close"
            onClick={onAbort}
            data-test={CLOSE_WALLET_ALERT_BUTTON_DATA_TEST}
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {isLoading && <FormLoadingSkeleton id={WALLET_ALERT_FORM_ID} />}

          {!isLoading && (
            <>
              <div className="not-last-child:mb-1">
                <Typography variant="headline" color="grey700">
                  {translate('text_1773051593208ufsg18ai0y0')}
                </Typography>

                <Typography variant="body" color="grey600">
                  {translate('text_17465238490260r2325jwada')}
                </Typography>
              </div>

              <div className="flex flex-col gap-12">
                <AlertNameAndCodeSection
                  form={form}
                  fields={{ name: 'name', code: 'code' }}
                  nameLabel={translate('text_1773063868176dy5v3kvne2l')}
                  hasExistingCode={!!existingAlert?.code}
                />

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead1">
                      {translate('text_17466299298762alw9zr25tb')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1746631350477wjvnr6ty57q')}
                    </Typography>
                  </div>
                  <div className="flex flex-col gap-6 *:flex-1">
                    <form.AppField name="alertType">
                      {(field) => (
                        <field.ComboBoxField
                          label={translate('text_1746631350478jqk347d5dy4')}
                          placeholder={translate('text_1746631350478bwa1swfpwky')}
                          disabled={isEdition}
                          disableClearable={isEdition}
                          data={comboboxData}
                          dataTest={WALLET_ALERT_TYPE_COMBOBOX_DATA_TEST}
                        />
                      )}
                    </form.AppField>

                    {!!alertType && (
                      <AlertThresholds
                        thresholds={thresholds}
                        setThresholds={setThresholds}
                        setThresholdValue={setThresholdValue}
                        currency={currency}
                        shouldHandleUnits={isWalletCreditsAlert(alertType)}
                        unitsLabel={translate('text_62d18855b22699e5cf55f889')}
                        unitsTitle={translate('text_1773063868176jh122suh1lx')}
                        reversedThreshold={true}
                        allowNegativeValues={isWalletOngoingAlert(alertType)}
                      />
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button variant="quaternary" size="large" onClick={onAbort}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.AppForm>
            <form.SubmitButton
              variant="primary"
              size="large"
              disabled={isLoading || hasAnyNonRecurringThresholdError}
              dataTest={SUBMIT_WALLET_ALERT_DATA_TEST}
            >
              {translate(
                isEdition ? 'text_17432414198706rdwf76ek3u' : 'text_1747917472538el8fg31n3i8',
              )}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

export default WalletAlertForm

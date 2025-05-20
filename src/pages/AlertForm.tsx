import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useCallback, useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { array, boolean, number, object, string } from 'yup'

import { Button, Typography } from '~/components/designSystem'
import { ComboBoxField, TextInputField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, PLAN_SUBSCRIPTION_DETAILS_ROUTE } from '~/core/router'
import {
  AlertTypeEnum,
  CreateSubscriptionAlertInput,
  useCreateSubscriptionAlertMutation,
  useGetSubscriptionAlertToEditQuery,
  useGetSubscriptionInfosQuery,
  useUpdateSubscriptionAlertMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  query getSubscriptionInfos($id: ID!) {
    subscription(id: $id) {
      id
      externalId
    }
  }

  query getSubscriptionAlertToEdit($id: ID!) {
    alert(id: $id) {
      id
      alertType
      billableMetric {
        id
        code
        name
      }
      code
      name
      thresholds {
        code
        recurring
        value
      }
    }
  }

  mutation createSubscriptionAlert($input: CreateSubscriptionAlertInput!) {
    createSubscriptionAlert(input: $input) {
      id
    }
  }

  mutation updateSubscriptionAlert($input: UpdateSubscriptionAlertInput!) {
    updateSubscriptionAlert(input: $input) {
      id
    }
  }
`

const AlertForm = () => {
  const { alertId = '', customerId = '', planId = '', subscriptionId = '' } = useParams()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)
  const isEdition = !!alertId

  const { data: subscriptionData, loading: subscriptionLoading } = useGetSubscriptionInfosQuery({
    variables: { id: alertId },
    skip: !isEdition,
    fetchPolicy: 'network-only',
  })

  const { data: alertData, loading: alertLoading } = useGetSubscriptionAlertToEditQuery({
    variables: { id: alertId },
    skip: !isEdition,
    fetchPolicy: 'network-only',
  })
  const existingAlert = alertData?.alert

  const onLeave = useCallback(() => {
    if (!!customerId) {
      navigate(
        generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
          customerId,
          subscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
        }),
      )
    } else if (!!planId) {
      navigate(
        generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
          planId,
          subscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
        }),
      )
    }
  }, [customerId, navigate, planId, subscriptionId])

  const [updateAlert] = useUpdateSubscriptionAlertMutation({
    onCompleted({ updateSubscriptionAlert }) {
      if (!!updateSubscriptionAlert?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1746623860224qwhtxyuophr',
        })

        onLeave()
      }
    },
  })

  const [createAlert] = useCreateSubscriptionAlertMutation({
    onCompleted({ createSubscriptionAlert }) {
      if (!!createSubscriptionAlert?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1746611635509ov7jepx55bz',
        })

        onLeave()
      }
    },
  })

  const formikProps = useFormik<CreateSubscriptionAlertInput>({
    initialValues: {
      name: existingAlert?.name || '',
      code: existingAlert?.code || '',
      // @ts-expect-error alertType is mandatory but default value should be empty string
      alertType: existingAlert?.alertType || '',
      billableMetricId: existingAlert?.billableMetric?.id || '',
      thresholds: existingAlert?.thresholds || [],
    },
    validationSchema: object().shape({
      name: string(),
      code: string().required(''),
      alertType: string().required(''),
      billableMetricId: string(),
      thresholds: array()
        .of(
          object().shape({
            code: string().required(''),
            recurring: boolean().required(''),
            value: number().required(''),
          }),
        )
        .nullable(),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values) => {
      // Edition
      if (!!existingAlert?.id) {
        await updateAlert({
          variables: {
            input: { ...values, id: existingAlert.id },
          },
        })
      } else {
        await createAlert({
          variables: {
            input: { ...values, subscriptionId: subscriptionData?.subscription?.externalId || '' },
          },
        })
      }
    },
  })

  const showThresholdTable = useMemo(
    () =>
      formikProps.values.alertType === AlertTypeEnum.UsageAmount ||
      (formikProps.values.alertType === AlertTypeEnum.BillableMetricUsageAmount &&
        !!formikProps.values.billableMetricId),
    [formikProps.values.alertType, formikProps.values.billableMetricId],
  )

  return (
    <>
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate(
              isEdition ? 'text_1746623860224seuc6r7gdlc' : 'text_1746623860224049f02r3xcf',
            )}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={() =>
              formikProps.dirty ? warningDirtyAttributesDialogRef.current?.openDialog() : onLeave()
            }
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {alertLoading && <FormLoadingSkeleton id="create-alert" />}
          {!alertLoading && (
            <>
              <div className="not-last-child:mb-1">
                <Typography variant="headline" color="grey700">
                  {translate('text_17466299298753ff4t9izbty')}
                </Typography>
                <Typography variant="body" color="grey600">
                  {translate('text_17465238490260r2325jwada')}
                </Typography>
              </div>

              <div className="flex flex-col gap-12">
                <section className="pb-12 shadow-b not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
                      {translate('text_1746629929876zz4937djyc8')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1746629929876gdgxt1v86eq')}
                    </Typography>
                  </div>
                  <div className="flex gap-6 *:flex-1">
                    <TextInputField
                      name="name"
                      label={translate('text_1732286530467zstzwbegfiq')}
                      placeholder={translate('text_62876e85e32e0300e1803121')}
                      formikProps={formikProps}
                    />
                    <TextInputField
                      name="code"
                      label={translate('text_62876e85e32e0300e1803127')}
                      placeholder={translate('text_623b42ff8ee4e000ba87d0c4')}
                      formikProps={formikProps}
                    />
                  </div>
                </section>

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
                      {translate('text_17466299298762alw9zr25tb')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1746631350477wjvnr6ty57q')}
                    </Typography>
                  </div>
                  <div className="flex flex-col gap-6 *:flex-1">
                    <ComboBoxField
                      name="alertType"
                      label={translate('text_1746631350478jqk347d5dy4')}
                      placeholder={translate('text_1746631350478bwa1swfpwky')}
                      data={[
                        {
                          label: translate('text_1746631350478l8lfdopffh1'),
                          value: AlertTypeEnum.BillableMetricUsageAmount,
                        },
                        {
                          label: translate('text_1746631350478bwa1swfpwkw'),
                          value: AlertTypeEnum.UsageAmount,
                        },
                      ]}
                      formikProps={formikProps}
                    />

                    {!!formikProps.values.alertType && (
                      <>
                        {formikProps.values.alertType ===
                          AlertTypeEnum.BillableMetricUsageAmount && (
                          <>
                            <ComboBoxField
                              name="billableMetricId"
                              label={translate('text_1746780648463scppfjbhd1b')}
                              placeholder={translate('text_1746780648463n39xfvr772k')}
                              // TODO: Add data
                              data={[]}
                              formikProps={formikProps}
                            />
                          </>
                        )}

                        {showThresholdTable && <>TODO: Show threeshold table</>}
                      </>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            size="large"
            onClick={() =>
              formikProps.dirty ? warningDirtyAttributesDialogRef.current?.openDialog() : onLeave()
            }
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button
            variant="primary"
            size="large"
            disabled={!formikProps.isValid || !formikProps.dirty || subscriptionLoading}
            onClick={formikProps.submitForm}
          >
            {translate('text_1737473550277wkq2gsbaiab')}
          </Button>
        </CenteredPage.StickyFooter>
      </CenteredPage.Wrapper>

      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate('text_6244277fe0975300fe3fb940')}
        description={translate('text_1746623860224gh7o1exyjch')}
        continueText={translate('text_6244277fe0975300fe3fb94c')}
        onContinue={onLeave}
      />
    </>
  )
}

export default AlertForm

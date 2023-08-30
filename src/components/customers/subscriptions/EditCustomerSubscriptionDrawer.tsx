import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Drawer, DrawerRef, Icon, Typography } from '~/components/designSystem'
import { DatePickerField, TextInput, TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { dateErrorCodes } from '~/core/constants/form'
import {
  StatusTypeEnum,
  TimezoneEnum,
  UpdateSubscriptionInput,
  useUpdateCustomerSubscriptionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, DrawerContent, DrawerSubmitButton, DrawerTitle, theme } from '~/styles'

import { SubscriptionDatesOffsetHelperComponent } from './SubscriptionDatesOffsetHelperComponent'

gql`
  mutation updateCustomerSubscription($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      name
      status
      startedAt
      subscriptionAt
      endingAt
    }
  }
`

type SubscriptionInfos = {
  id: string
  name?: string | null
  externalId?: string | null
  startDate: string
  endDate?: string
  status?: StatusTypeEnum
  customerTimezone?: TimezoneEnum | null
}

export interface EditCustomerSubscriptionDrawerRef {
  openDrawer: (subscriptionInfos: SubscriptionInfos) => unknown
  closeDrawer: () => unknown
}

export const EditCustomerSubscriptionDrawer = forwardRef<EditCustomerSubscriptionDrawerRef>(
  (_, ref) => {
    const drawerRef = useRef<DrawerRef>(null)
    const [update] = useUpdateCustomerSubscriptionMutation({
      onCompleted({ updateSubscription }) {
        if (!!updateSubscription) {
          addToast({
            severity: 'success',
            translateKey: 'text_62e38a4631937146a6d6d5dd',
          })
        }
      },
    })
    const [subscription, setSubscription] = useState<SubscriptionInfos | undefined>(undefined)
    const { translate } = useInternationalization()
    const formikProps = useFormik<
      Pick<UpdateSubscriptionInput, 'name' | 'subscriptionAt' | 'endingAt'>
    >({
      initialValues: {
        name: subscription?.name || '',
        subscriptionAt: subscription?.startDate || undefined,
        endingAt: subscription?.endDate || undefined,
      },
      validateOnMount: true,
      enableReinitialize: true,
      validationSchema: object().shape({
        subscriptionAt: string().required(''),
        endingAt: string()
          .test({
            test: function (value, { from, path }) {
              // Value can be undefined
              if (!value) {
                return true
              }

              // Make sure value has correct format
              if (!DateTime.fromISO(value).isValid) {
                return this.createError({
                  path,
                  message: dateErrorCodes.wrongFormat,
                })
              }

              // Make sure endingAt is set later than subscriptionAt
              if (from && from[0] && from[0].value && from[0].value.subscriptionAt) {
                const subscriptionAt = DateTime.fromISO(from[0].value.subscriptionAt)
                const endingAt = DateTime.fromISO(value)

                if (endingAt <= subscriptionAt) {
                  return this.createError({
                    path,
                    message: dateErrorCodes.shouldBeFutureAndBiggerThanSubscriptionAt,
                  })
                }
              }

              return true
            },
          })
          .nullable(),
      }),

      onSubmit: async (values) => {
        await update({
          variables: {
            input: {
              id: subscription?.id as string,
              endingAt: !!values.endingAt ? values.endingAt : null, // Null is used to reset field value
              ...values,
            },
          },
        })
      },
    })

    useImperativeHandle(ref, () => ({
      openDrawer: (infos) => {
        formikProps.resetForm()
        setSubscription(infos)
        drawerRef.current?.openDrawer()
      },
      closeDrawer: () => drawerRef.current?.closeDrawer(),
    }))

    return (
      <Drawer ref={drawerRef} title={translate('text_6335e8900c69f8ebdfef530c')}>
        <DrawerContent>
          <DrawerTitle>
            <Typography variant="headline">{translate('text_6335e8900c69f8ebdfef530e')}</Typography>
            <Typography>{translate('text_6335e8900c69f8ebdfef5310')}</Typography>
          </DrawerTitle>
          <Card>
            <Typography variant="subhead">{translate('text_6335e8900c69f8ebdfef5312')}</Typography>

            {!!subscription?.externalId && (
              <TextInput
                disabled
                name="externalId"
                label={translate('text_642a94e522316cd9e1875224')}
                value={subscription?.externalId}
              />
            )}

            <TextInputField
              name="name"
              label={translate('text_62d7f6178ec94cd09370e32d')}
              placeholder={translate('text_62d7f6178ec94cd09370e393')}
              formikProps={formikProps}
            />

            <div>
              <InlineFields>
                <DatePickerField
                  disabled={subscription?.status === StatusTypeEnum.Active}
                  name="subscriptionAt"
                  label={translate('text_64ef55a730b88e3d2117b3c4')}
                  placement="auto"
                  formikProps={formikProps}
                />
                <InlineFieldsIcon name="arrow-right" />
                <DatePickerField
                  name="endingAt"
                  label={translate('text_64ef55a730b88e3d2117b3cc')}
                  error={
                    formikProps.errors.endingAt ===
                    dateErrorCodes.shouldBeFutureAndBiggerThanSubscriptionAt
                      ? translate('text_64ef55a730b88e3d2117b3d4')
                      : undefined
                  }
                  placement="auto"
                  formikProps={formikProps}
                  inputProps={{ cleanable: true }}
                />
              </InlineFields>
              {!formikProps.errors.endingAt && !formikProps.errors.subscriptionAt && (
                <LocalSubscriptionDatesOffsetHelperComponent
                  customerTimezone={subscription?.customerTimezone}
                  subscriptionAt={formikProps.values.subscriptionAt}
                  endingAt={formikProps.values.endingAt}
                />
              )}
            </div>
          </Card>

          <DrawerSubmitButton>
            <Button
              data-test="submit-edit-subscription"
              size="large"
              fullWidth
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={async () => {
                await formikProps.submitForm()
                drawerRef?.current?.closeDrawer()
              }}
            >
              {translate('text_6335e8900c69f8ebdfef531c')}
            </Button>
          </DrawerSubmitButton>
        </DrawerContent>
      </Drawer>
    )
  }
)

EditCustomerSubscriptionDrawer.displayName = 'EditCustomerSubscriptionDrawer'

const InlineFields = styled.div`
  display: flex;
  gap: ${theme.spacing(3)};

  > *:first-child,
  > *:last-child {
    flex: 1;
  }
`

const InlineFieldsIcon = styled(Icon)`
  margin-top: ${theme.spacing(10)};
`

const LocalSubscriptionDatesOffsetHelperComponent = styled(SubscriptionDatesOffsetHelperComponent)`
  margin-top: ${theme.spacing(1)};
`

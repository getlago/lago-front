import { forwardRef, useRef, useState, useImperativeHandle } from 'react'
import { useFormik } from 'formik'
import { gql } from '@apollo/client'

import { Button, DrawerRef, Drawer, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { TextInputField, DatePickerField, TextInput } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  useUpdateCustomerSubscriptionMutation,
  UpdateSubscriptionInput,
  StatusTypeEnum,
} from '~/generated/graphql'
import { Card, DrawerTitle, DrawerContent, DrawerSubmitButton } from '~/styles'

gql`
  mutation updateCustomerSubscription($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      name
      status
      startedAt
      subscriptionAt
    }
  }
`

type SubscriptionInfos = {
  id: string
  name?: string | null
  externalId?: string | null
  startDate: string
  status?: StatusTypeEnum
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
    const formikProps = useFormik<Pick<UpdateSubscriptionInput, 'name' | 'subscriptionAt'>>({
      initialValues: {
        name: subscription?.name || '',
        subscriptionAt: subscription?.startDate || undefined,
      },
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values) => {
        await update({
          variables: {
            input: {
              id: subscription?.id as string,
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
            <TextInputField
              name="name"
              label={translate('text_62d7f6178ec94cd09370e32d')}
              placeholder={translate('text_62d7f6178ec94cd09370e393')}
              formikProps={formikProps}
            />

            {!!subscription?.externalId && (
              <TextInput
                disabled
                name="externalId"
                label={translate('text_642a94e522316cd9e1875224')}
                value={subscription?.externalId}
              />
            )}

            <DatePickerField
              disabled={subscription?.status === StatusTypeEnum.Active}
              name="subscriptionAt"
              label={translate('text_6335e8900c69f8ebdfef5318')}
              formikProps={formikProps}
            />
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

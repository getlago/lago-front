import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Status } from '~/components/designSystem/Status'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { useGetOrderFormForVoidQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import { getOrderFormStatusMapping } from './common/getOrderFormStatusMapping'

export const VOID_ORDER_FORM_CLOSE_BUTTON_TEST_ID = 'void-order-form-close-button'
export const VOID_ORDER_FORM_VOID_BUTTON_TEST_ID = 'void-order-form-void-button'
export const VOID_ORDER_FORM_CANCEL_BUTTON_TEST_ID = 'void-order-form-cancel-button'
export const VOID_ORDER_FORM_ALERT_TEST_ID = 'void-order-form-alert'

gql`
  query getOrderFormForVoid($id: ID!) {
    orderForm(id: $id) {
      id
      number
      status
      createdAt
      customer {
        id
        name
      }
    }
  }
`

const VoidOrderForm = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { orderFormId } = useParams()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const { data, loading, error } = useGetOrderFormForVoidQuery({
    variables: { id: orderFormId || '' },
    skip: !orderFormId,
  })

  const orderForm = data?.orderForm

  const onSubmit = () => {
    // TODO: Wire up voidOrderForm mutation once the backend supports it
    // For now, this is a structural placeholder
  }

  const onClose = () => {
    goBack()
  }

  if (error) {
    return (
      <GenericPlaceholder
        className="pt-12"
        title={translate('text_634812d6f16b31ce5cbf4126')}
        subtitle={translate('text_634812d6f16b31ce5cbf4128')}
        buttonTitle={translate('text_634812d6f16b31ce5cbf412a')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        <Typography className="font-medium text-grey-700">
          {translate('text_1779715648584xw9xgemkv9y')}
        </Typography>
        <Button
          data-test={VOID_ORDER_FORM_CLOSE_BUTTON_TEST_ID}
          variant="quaternary"
          icon="close"
          onClick={() => onClose()}
        />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="void-order-form" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <CenteredPage.Container>
          <div className="flex flex-col gap-12">
            <Alert data-test={VOID_ORDER_FORM_ALERT_TEST_ID} type="warning">
              <Typography className="text-grey-700">
                {translate('text_1779715648585ih339cvcfjx')}
              </Typography>
            </Alert>

            <div className="flex flex-col gap-1">
              <Typography variant="headline" color="grey700">
                {translate('text_1779715648585yngcc34h4kq', {
                  orderFormNumber: orderForm?.number,
                })}
              </Typography>
              <Typography variant="body" color="grey600">
                {translate('text_17797156485853s6nzac3mll')}
              </Typography>
            </div>

            <div className="flex flex-col gap-6">
              <Typography variant="subhead1">
                {translate('text_1779715648585ivakmu9pgk2')}
              </Typography>
              <Table
                name="order-form-void-details"
                data={orderForm ? [orderForm] : []}
                containerSize={0}
                columns={[
                  {
                    key: 'status',
                    title: translate('text_63ac86d797f728a87b2f9fa7'),
                    minWidth: 100,
                    content: ({ status }) => {
                      if (!status) return null

                      return <Status {...getOrderFormStatusMapping(status, translate)} />
                    },
                  },
                  {
                    key: 'number',
                    title: translate('text_1775746196826pyjlfqx3anr'),
                    maxSpace: true,
                    content: ({ number }) => number,
                  },
                  {
                    key: 'customer.name',
                    title: translate('text_65201c5a175a4b0238abf29a'),
                    maxSpace: true,
                    content: ({ customer }) => customer.name,
                  },
                  {
                    key: 'createdAt',
                    title: translate('text_624efab67eb2570101d117e3'),
                    minWidth: 140,
                    content: ({ createdAt }) =>
                      intlFormatDateTimeOrgaTZ(createdAt).date,
                  },
                ]}
              />
            </div>
          </div>
        </CenteredPage.Container>
      )}

      <CenteredPage.StickyFooter>
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            data-test={VOID_ORDER_FORM_CANCEL_BUTTON_TEST_ID}
            variant="quaternary"
            onClick={() => onClose()}
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button
            data-test={VOID_ORDER_FORM_VOID_BUTTON_TEST_ID}
            variant="primary"
            danger
            onClick={() => onSubmit()}
          >
            {translate('text_1779715648584xw9xgemkv9y')}
          </Button>
        </div>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default VoidOrderForm

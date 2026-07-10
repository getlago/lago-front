import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { addToast } from '~/core/apolloClient'
import { QuoteDetailsTabsOptionsEnum, QuotesTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE, QUOTES_TAB_ROUTE, useNavigate } from '~/core/router'
import {
  OrderExecutionModeEnum,
  useExecuteOrderMutation,
  useGetOrderForExecuteQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'
import { PageHeader } from '~/styles'
import { FormLoadingSkeleton, Main, Side } from '~/styles/mainObjectsForm'

import { buildOrderHeader } from './common/buildOrderHeader'
import { buildQuotePreviewProps } from './common/buildQuotePreviewProps'
import { getQuoteOrderTypeTranslationKey } from './common/getQuoteOrderTypeTranslationKey'
import { QuotePreviewCard } from './common/QuotePreviewCard'

export const EXECUTE_ORDER_CLOSE_BUTTON_TEST_ID = 'execute-order-close-button'
export const EXECUTE_ORDER_CANCEL_BUTTON_TEST_ID = 'execute-order-cancel-button'
export const EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID = 'execute-order-submit-button'
export const EXECUTE_ORDER_ALERT_TEST_ID = 'execute-order-alert'
export const EXECUTE_ORDER_PREVIEW_TEST_ID = 'execute-order-preview'

// Reuse existing execution-mode value labels (defined for EditOrder's combobox)
const EXECUTION_MODE_LABEL_KEY: Record<OrderExecutionModeEnum, string> = {
  [OrderExecutionModeEnum.ExecuteInLago]: 'text_1781686594125wc395bj9cul',
  [OrderExecutionModeEnum.OrderOnly]: 'text_1781686594125ibfjmzae7cy',
}

gql`
  query getOrderForExecute($id: ID!) {
    order(id: $id) {
      id
      number
      status
      orderType
      executeAt
      executionMode
      customer {
        id
        name
        displayName
      }
      orderForm {
        id
        number
        quote {
          ...QuoteDetailItem
        }
      }
    }
  }
`

gql`
  mutation executeOrder($input: ExecuteOrderInput!) {
    executeOrder(input: $input) {
      id
      status
    }
  }
`

const ExecuteOrder = () => {
  const { translate } = useInternationalization()
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { goBack } = useLocationHistory()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const { data, loading, error } = useGetOrderForExecuteQuery({
    variables: { id: orderId || '' },
    skip: !orderId,
  })

  const [executeOrderMutation, { loading: executing }] = useExecuteOrderMutation({
    refetchQueries: ['getOrders'],
  })

  const order = data?.order
  const orderNumber = order?.number ?? ''
  const quoteId = order?.orderForm?.quote?.id

  const header = buildOrderHeader({ number: order?.number }, translate)

  const previewProps = useMemo(
    () =>
      buildQuotePreviewProps({
        version: order?.orderForm?.quote?.currentVersion,
        customer: order?.orderForm?.quote?.customer,
        images: (order?.orderForm?.quote?.images ?? {}) as Record<string, string>,
      }),
    [
      order?.orderForm?.quote?.currentVersion,
      order?.orderForm?.quote?.customer,
      order?.orderForm?.quote?.images,
    ],
  )

  const closeRedirection = () => {
    goBack(generatePath(QUOTES_TAB_ROUTE, { tab: QuotesTabsOptionsEnum.orders }))
  }

  const onExecute = async () => {
    if (!orderId || !quoteId) return

    const result = await executeOrderMutation({
      variables: { input: { id: orderId } },
    })

    if (result.data?.executeOrder) {
      addToast({ severity: 'success', translateKey: 'text_1783693954158zdvy0q96esu' })

      navigate(
        generatePath(QUOTE_DETAILS_ROUTE, {
          quoteId,
          tab: QuoteDetailsTabsOptionsEnum.orders,
        }),
      )
    }
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

  const executionModeLabel = order?.executionMode
    ? translate(EXECUTION_MODE_LABEL_KEY[order.executionMode])
    : ''

  const executeAtLabel = order?.executeAt ? intlFormatDateTimeOrgaTZ(order.executeAt).date : '-'

  return (
    <div>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_17836939541581o5vrz4lup5', { orderNumber })}
        </Typography>
        <Button
          data-test={EXECUTE_ORDER_CLOSE_BUTTON_TEST_ID}
          variant="quaternary"
          icon="close"
          onClick={closeRedirection}
        />
      </PageHeader.Wrapper>

      <div className="min-height-minus-nav flex">
        <Main
          footer={
            !loading && (
              <>
                <Button
                  data-test={EXECUTE_ORDER_CANCEL_BUTTON_TEST_ID}
                  variant="quaternary"
                  onClick={closeRedirection}
                >
                  {translate('text_6411e6b530cb47007488b027')}
                </Button>
                <Button
                  data-test={EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID}
                  variant="primary"
                  loading={executing}
                  onClick={onExecute}
                >
                  {translate('text_1783693954158o27yno2lfnm')}
                </Button>
              </>
            )
          }
        >
          {loading || !order ? (
            <FormLoadingSkeleton id="execute-order" />
          ) : (
            <div>
              <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-1">
                  <Typography variant="headline" color="grey700">
                    {translate('text_17836939541581o5vrz4lup5', { orderNumber: order.number })}
                  </Typography>
                  <Typography variant="body" color="grey600">
                    {translate('text_1783693954158kkhja0v3uez')}
                  </Typography>
                </div>

                <div className="flex flex-col gap-6">
                  <Typography variant="subhead1">
                    {translate('text_1781686594125zdfs2dn7aef')}
                  </Typography>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <Typography variant="caption" color="grey600">
                        {translate('text_1781686594125hr5o1ucifso')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {order.number}
                      </Typography>
                    </div>
                    <div className="flex flex-col">
                      <Typography variant="caption" color="grey600">
                        {translate('text_65201c5a175a4b0238abf29a')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {order.customer.displayName}
                      </Typography>
                    </div>
                    <div className="flex flex-col">
                      <Typography variant="caption" color="grey600">
                        {translate('text_1781686594125ilr4k8xhb5m')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {order.orderType
                          ? translate(getQuoteOrderTypeTranslationKey(order.orderType))
                          : ''}
                      </Typography>
                    </div>
                    <div className="flex flex-col">
                      <Typography variant="caption" color="grey600">
                        {translate('text_1779695273381h7tmhdzrv48')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {`${order.orderForm.quote.number} - v${order.orderForm.quote.currentVersion.version}`}
                      </Typography>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <Typography variant="subhead1">
                    {translate('text_1781686594125jxy4tktm5sv')}
                  </Typography>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <Typography variant="caption" color="grey600">
                        {translate('text_17816865941251f6epdwidgk')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {executionModeLabel}
                      </Typography>
                    </div>
                    <div className="flex flex-col">
                      <Typography variant="caption" color="grey600">
                        {translate('text_17816865941256grf5qs2924')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {executeAtLabel}
                      </Typography>
                    </div>
                  </div>
                </div>

                <Alert data-test={EXECUTE_ORDER_ALERT_TEST_ID} type="warning">
                  {translate('text_1783693954158ptbr210ec4g')}
                </Alert>
              </div>
            </div>
          )}
        </Main>

        <Side>
          <div className="height-minus-nav overflow-auto">
            <QuotePreviewCard
              dataTest={EXECUTE_ORDER_PREVIEW_TEST_ID}
              loading={loading}
              header={header}
              hasContent={!!order?.orderForm?.quote?.currentVersion?.content}
              previewProps={previewProps}
            />
          </div>
        </Side>
      </div>
    </div>
  )
}

export default ExecuteOrder

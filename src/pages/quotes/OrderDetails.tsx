import { useMemo } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { QuotesTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTES_TAB_ROUTE } from '~/core/router'
import { useGetOrderForEditQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'
import { PageHeader } from '~/styles'
import { FormLoadingSkeleton, Main, Side } from '~/styles/mainObjectsForm'

import { buildOrderHeader } from './common/buildOrderHeader'
import { buildQuotePreviewProps } from './common/buildQuotePreviewProps'
import { getOrderExecutionModeTranslationKey } from './common/getOrderExecutionModeTranslationKey'
import { getQuoteOrderTypeTranslationKey } from './common/getQuoteOrderTypeTranslationKey'
import { QuotePreviewCard } from './common/QuotePreviewCard'

export const ORDER_DETAILS_CLOSE_BUTTON_TEST_ID = 'order-details-close-button'
export const ORDER_DETAILS_PREVIEW_TEST_ID = 'order-details-preview'

const OrderDetails = () => {
  const { translate } = useInternationalization()
  const { orderId } = useParams()
  const { goBack } = useLocationHistory()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const { data, loading, error } = useGetOrderForEditQuery({
    variables: { id: orderId || '' },
    skip: !orderId,
  })

  const order = data?.order
  const orderNumber = order?.number ?? ''

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

  const onClose = () => {
    goBack(generatePath(QUOTES_TAB_ROUTE, { tab: QuotesTabsOptionsEnum.orders }))
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
    ? translate(getOrderExecutionModeTranslationKey(order.executionMode))
    : ''

  const executeAtLabel = order?.executeAt ? intlFormatDateTimeOrgaTZ(order.executeAt).date : '-'

  return (
    <div>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_1784189562649n0q3uaf6w9q', { orderNumber })}
        </Typography>
        <Button
          data-test={ORDER_DETAILS_CLOSE_BUTTON_TEST_ID}
          variant="quaternary"
          icon="close"
          onClick={onClose}
        />
      </PageHeader.Wrapper>

      <div className="min-height-minus-nav flex">
        <Main>
          {loading || !order ? (
            <FormLoadingSkeleton id="order-details" />
          ) : (
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-1">
                <Typography variant="headline" color="grey700">
                  {translate('text_1784189562649n0q3uaf6w9q', { orderNumber: order.number })}
                </Typography>
                <Typography variant="body" color="grey600">
                  {translate('text_17841895626504bixbm3xbyj')}
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
            </div>
          )}
        </Main>

        <Side>
          <div className="height-minus-nav overflow-auto">
            <QuotePreviewCard
              dataTest={ORDER_DETAILS_PREVIEW_TEST_ID}
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

export default OrderDetails

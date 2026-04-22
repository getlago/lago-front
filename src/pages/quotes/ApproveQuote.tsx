import { gql } from '@apollo/client'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import RichTextEditor from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { addToast } from '~/core/apolloClient'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE } from '~/core/router'
import { useApproveQuoteMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import ErrorImage from '~/public/images/maneki/error.svg'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import { getQuoteOrderTypeTranslationKey } from './common/getQuoteOrderTypeTranslationKey'
import { useQuote } from './hooks/useQuote'

export const APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID = 'approve-quote-close-button'
export const APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID = 'approve-quote-approve-button'
export const APPROVE_QUOTE_CANCEL_BUTTON_TEST_ID = 'approve-quote-cancel-button'
export const APPROVE_QUOTE_ALERT_TEST_ID = 'approve-quote-alert'
export const APPROVE_QUOTE_PREVIEW_TEST_ID = 'approve-quote-preview'

gql`
  mutation approveQuote($input: ApproveQuoteInput!) {
    approveQuote(input: $input) {
      id
      status
    }
  }
`

const ApproveQuote = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { quoteId } = useParams()
  const navigate = useNavigate()

  const { quote, loading, error } = useQuote(quoteId)

  const [approveQuoteMutation] = useApproveQuoteMutation({
    refetchQueries: ['getQuotes'],
  })

  const onSubmit = async () => {
    if (!quoteId) return

    const result = await approveQuoteMutation({
      variables: {
        input: {
          id: quoteId,
        },
      },
    })

    if (result.data?.approveQuote) {
      addToast({
        severity: 'success',
        translateKey: 'text_1776848720529o2nn0q3b7iv',
      })

      navigate(
        generatePath(QUOTE_DETAILS_ROUTE, {
          quoteId,
          tab: QuoteDetailsTabsOptionsEnum.orderForms,
        }),
      )
    }
  }

  const onClose = () => {
    if (quoteId) {
      goBack(
        generatePath(QUOTE_DETAILS_ROUTE, {
          quoteId,
          tab: QuoteDetailsTabsOptionsEnum.overview,
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

  return (
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        <Typography className="font-medium text-grey-700">
          {translate('text_1776848720529vv5zmyyq94k')}
        </Typography>
        <Button
          data-test={APPROVE_QUOTE_CLOSE_BUTTON_TEST_ID}
          variant="quaternary"
          icon="close"
          onClick={() => onClose()}
        />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="approve-quote" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <CenteredPage.Container>
          <Alert data-test={APPROVE_QUOTE_ALERT_TEST_ID} type="info">
            <Typography className="text-grey-700">
              {translate('text_1776848720529x0n0j0tob0w')}
            </Typography>
          </Alert>

          <div className="flex flex-col gap-1">
            <Typography variant="headline">
              {translate('text_17768509988630g6v99v8x8h', {
                quoteNumber: quote?.number,
                quoteVersion: `v${quote?.version}`,
              })}
            </Typography>
            <Typography color="grey600">{translate('text_1776850998863xqfl9h0n6rc')}</Typography>
          </div>

          <div className="flex flex-col gap-6">
            <Typography variant="subhead1">{translate('text_1776851047915faiji44ys5o')}</Typography>
            <DetailsPage.InfoGrid
              grid={[
                {
                  label: translate('text_177581001572954eedouxq5u'),
                  value: quote?.number,
                },
                {
                  label: translate('text_65201c5a175a4b0238abf29a'),
                  value: quote?.customer.name,
                },
                {
                  label: translate('text_6560809c38fb9de88d8a52fb'),
                  value: quote ? translate(getQuoteOrderTypeTranslationKey(quote.orderType)) : '',
                },
                {
                  label: translate('text_1776851578529wbonlz6ss8y'),
                  value: translate('text_1776851578529rcah0zepkul', {
                    days: 20, // Update when we have the validation date
                  }),
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-6">
            <Typography variant="subhead1" className="pt-6">
              {translate('text_1776851047915xli269uyejs')}
            </Typography>
          </div>
          <div data-test={APPROVE_QUOTE_PREVIEW_TEST_ID}>
            {quote?.content ? (
              <RichTextEditor mode="preview" content={quote.content} />
            ) : (
              <Typography color="grey500">{translate('text_17768523811635qaasto1ziv')}</Typography>
            )}
          </div>
        </CenteredPage.Container>
      )}

      <CenteredPage.StickyFooter>
        <Button
          data-test={APPROVE_QUOTE_CANCEL_BUTTON_TEST_ID}
          variant="quaternary"
          onClick={() => onClose()}
        >
          {translate('text_6411e6b530cb47007488b027')}
        </Button>
        <Button
          data-test={APPROVE_QUOTE_APPROVE_BUTTON_TEST_ID}
          variant="primary"
          onClick={() => onSubmit()}
        >
          {translate('text_1776848720529vv5zmyyq94k')}
        </Button>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default ApproveQuote

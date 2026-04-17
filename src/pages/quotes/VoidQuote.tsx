import { gql } from '@apollo/client'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Status } from '~/components/designSystem/Status'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast } from '~/core/apolloClient'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE } from '~/core/router'
import { useVoidQuoteMutation, VoidReasonEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import { getQuoteOrderTypeTranslationKey } from './common/getQuoteOrderTypeTranslationKey'
import { getQuoteStatusMapping } from './common/getQuoteStatusMapping'
import { useQuote } from './hooks/useQuote'

gql`
  mutation voidQuote($input: VoidQuoteInput!) {
    voidQuote(input: $input) {
      id
      status
    }
  }
`

const VoidQuote = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { quoteId } = useParams()
  const navigate = useNavigate()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const { quote, loading, error } = useQuote(quoteId)

  const [voidQuote] = useVoidQuoteMutation({
    onCompleted(data) {
      if (data?.voidQuote && quoteId) {
        addToast({
          severity: 'success',
          translateKey: 'text_1776414006125gijz56nk7sv',
        })

        navigate(
          generatePath(QUOTE_DETAILS_ROUTE, {
            quoteId,
            tab: QuoteDetailsTabsOptionsEnum.overview,
          }),
        )
      }
    },
    refetchQueries: ['getQuotes'],
  })

  const onSubmit = async () => {
    if (quoteId) {
      await voidQuote({
        variables: {
          input: {
            id: quoteId,
            reason: VoidReasonEnum.Manual,
          },
        },
      })
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
          {translate('text_177641400612565v4yq2wx1u')}
        </Typography>
        <Button variant="quaternary" icon="close" onClick={() => onClose()} />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="void-quote" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <CenteredPage.Container>
          <div className="flex flex-col gap-12">
            <Alert type="warning">
              <Typography className="text-grey-700">
                {translate('text_1776414006125a67i2j1xl8s')}
              </Typography>
            </Alert>

            <div className="flex flex-col gap-1">
              <Typography variant="headline" color="grey700">
                {translate('text_1776414006125vf2t8yuiwka', {
                  quoteNumber: quote?.number,
                })}
              </Typography>
              <Typography variant="body" color="grey600">
                {translate('text_177641400612546jssznk1w0')}
              </Typography>
            </div>

            <div className="flex flex-col gap-6">
              <Table
                name="quote-void-details"
                data={quote ? [quote] : []}
                containerSize={0}
                columns={[
                  {
                    key: 'status',
                    title: translate('text_63ac86d797f728a87b2f9fa7'),
                    content: ({ status }) => (
                      <Status {...getQuoteStatusMapping(status, translate)} />
                    ),
                  },
                  {
                    key: 'number',
                    title: translate('text_177581001572954eedouxq5u'),
                    maxSpace: true,
                    content: ({ number }) => number,
                  },
                  {
                    key: 'version',
                    title: translate('text_1775747115932pql5mtb30dc'),
                    content: ({ version }) => `v${version}`,
                  },
                  {
                    key: 'orderType',
                    title: translate('text_6560809c38fb9de88d8a52fb'),
                    content: ({ orderType }) =>
                      translate(getQuoteOrderTypeTranslationKey(orderType)),
                  },
                  {
                    key: 'createdAt',
                    title: translate('text_17758254440392sc27lxm6ua'),
                    content: ({ createdAt }) => intlFormatDateTimeOrgaTZ(createdAt).date,
                  },
                ]}
              />
            </div>
          </div>
        </CenteredPage.Container>
      )}

      <CenteredPage.StickyFooter>
        <div className="flex w-full items-center justify-end gap-3">
          <Button variant="quaternary" onClick={() => onClose()}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button variant="primary" danger onClick={() => onSubmit()}>
            {translate('text_177641400612565v4yq2wx1u')}
          </Button>
        </div>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default VoidQuote

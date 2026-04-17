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
import { EDIT_QUOTE_ROUTE, QUOTE_DETAILS_ROUTE } from '~/core/router'
import { useCloneQuoteMutation, useVoidQuoteMutation, VoidReasonEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import { getQuoteOrderTypeTranslationKey } from './common/getQuoteOrderTypeTranslationKey'
import { getQuoteStatusMapping } from './common/getQuoteStatusMapping'
import { useQuote } from './hooks/useQuote'

export const VOID_QUOTE_CLOSE_BUTTON_TEST_ID = 'void-quote-close-button'
export const VOID_QUOTE_VOID_BUTTON_TEST_ID = 'void-quote-void-button'
export const VOID_QUOTE_CANCEL_BUTTON_TEST_ID = 'void-quote-cancel-button'
export const VOID_QUOTE_VOID_AND_GENERATE_BUTTON_TEST_ID = 'void-quote-void-and-generate-button'
export const VOID_QUOTE_ALERT_TEST_ID = 'void-quote-alert'

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
  const { hasPermissions } = usePermissions()

  const canVoidAndGenerate = hasPermissions(['quotesVoid', 'quotesClone'])

  const [voidQuote] = useVoidQuoteMutation({
    refetchQueries: ['getQuotes'],
  })

  const [cloneQuote] = useCloneQuoteMutation()

  const onSubmit = async () => {
    if (quoteId) {
      const result = await voidQuote({
        variables: {
          input: {
            id: quoteId,
            reason: VoidReasonEnum.Manual,
          },
        },
      })

      if (result.data?.voidQuote) {
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
    }
  }

  const onVoidAndGenerateNewVersion = async () => {
    if (quoteId) {
      const voidResult = await voidQuote({
        variables: {
          input: {
            id: quoteId,
            reason: VoidReasonEnum.Manual,
          },
        },
      })

      if (voidResult.data?.voidQuote) {
        const cloneResult = await cloneQuote({
          variables: { input: { id: quoteId } },
        })

        if (cloneResult.data?.cloneQuote) {
          navigate(
            generatePath(EDIT_QUOTE_ROUTE, {
              quoteId: cloneResult.data.cloneQuote.id,
            }),
          )
        }
      }
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
        <Button
          data-test={VOID_QUOTE_CLOSE_BUTTON_TEST_ID}
          variant="quaternary"
          icon="close"
          onClick={() => onClose()}
        />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="void-quote" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <CenteredPage.Container>
          <div className="flex flex-col gap-12">
            <Alert data-test={VOID_QUOTE_ALERT_TEST_ID} type="warning">
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
              <Typography variant="subhead1">
                {translate('text_1776417249197vhv63ozviur')}
              </Typography>
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
                    content: ({ number, version }) => `${number} - v${version}`,
                  },
                  {
                    key: 'customer.name',
                    title: translate('text_65201c5a175a4b0238abf29a'),
                    maxSpace: true,
                    content: ({ customer }) => customer.name,
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
        <div className="flex w-full items-center justify-between">
          <Button
            data-test={VOID_QUOTE_VOID_BUTTON_TEST_ID}
            variant="inline"
            danger
            onClick={() => onSubmit()}
          >
            {translate('text_177641400612565v4yq2wx1u')}
          </Button>

          <div className="flex gap-3">
            <Button
              data-test={VOID_QUOTE_CANCEL_BUTTON_TEST_ID}
              variant="quaternary"
              onClick={() => onClose()}
            >
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            {canVoidAndGenerate && (
              <Button
                data-test={VOID_QUOTE_VOID_AND_GENERATE_BUTTON_TEST_ID}
                variant="primary"
                onClick={() => onVoidAndGenerateNewVersion()}
              >
                {translate('text_17764159264034mafl126pox')}
              </Button>
            )}
          </div>
        </div>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default VoidQuote

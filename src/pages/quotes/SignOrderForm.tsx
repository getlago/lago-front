import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useMemo } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import RichTextEditor from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { Typography } from '~/components/designSystem/Typography'
import { DocumentUploader } from '~/components/form/DocumentUploader'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast } from '~/core/apolloClient'
import { QuoteDetailsTabsOptionsEnum, QuotesTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE, QUOTES_TAB_ROUTE, useNavigate } from '~/core/router'
import {
  OrderExecutionModeEnum,
  useGetOrderFormForSignQuery,
  useMarkOrderFormAsSignedMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useAppForm } from '~/hooks/forms/useAppform'
import ErrorImage from '~/public/images/maneki/error.svg'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import { buildQuotePreviewProps } from './common/buildQuotePreviewProps'
import { getQuoteOrderTypeTranslationKey } from './common/getQuoteOrderTypeTranslationKey'
import {
  buildSignOrderFormInput,
  signOrderFormDefaultValues,
  signOrderFormValidationSchema,
} from './signOrderForm/validationSchema'

export const SIGN_ORDER_FORM_CLOSE_BUTTON_TEST_ID = 'sign-order-form-close-button'
export const SIGN_ORDER_FORM_CANCEL_BUTTON_TEST_ID = 'sign-order-form-cancel-button'
export const SIGN_ORDER_FORM_SUBMIT_BUTTON_TEST_ID = 'sign-order-form-submit-button'
export const SIGN_ORDER_FORM_EXECUTION_TYPE_TEST_ID = 'sign-order-form-execution-type'
export const SIGN_ORDER_FORM_ALERT_TEST_ID = 'sign-order-form-alert'
export const SIGN_ORDER_FORM_PREVIEW_TEST_ID = 'sign-order-form-preview'

const MAX_FILE_SIZE_IN_MB = 10 // 10MB
const MB_TO_BYTES = 1024 * 1024

gql`
  query getOrderFormForSign($id: ID!) {
    orderForm(id: $id) {
      id
      number
      status
      createdAt
      customer {
        id
        name
      }
      quote {
        ...QuoteDetailItem
      }
    }
  }
`

gql`
  mutation markOrderFormAsSigned($input: MarkOrderFormAsSignedInput!) {
    markOrderFormAsSigned(input: $input) {
      id
      status
    }
  }
`

const SignOrderForm = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { orderFormId } = useParams()
  const navigate = useNavigate()

  const { data, loading, error } = useGetOrderFormForSignQuery({
    variables: { id: orderFormId || '' },
    skip: !orderFormId,
  })

  const orderForm = data?.orderForm

  const [markOrderFormAsSignedMutation] = useMarkOrderFormAsSignedMutation({
    refetchQueries: ['getOrderForms'],
  })

  // Single source of truth for preview inputs (shared with the PDF renderer).
  const previewProps = useMemo(
    () => buildQuotePreviewProps(orderForm?.quote?.currentVersion, orderForm?.quote?.customer),
    [orderForm?.quote?.currentVersion, orderForm?.quote?.customer],
  )

  const form = useAppForm({
    defaultValues: signOrderFormDefaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: signOrderFormValidationSchema },
    onSubmit: async ({ value }) => {
      const quoteId = orderForm?.quote?.id

      if (!orderFormId || !quoteId) return

      const result = await markOrderFormAsSignedMutation({
        variables: { input: buildSignOrderFormInput(orderFormId, value) },
      })

      if (result.data?.markOrderFormAsSigned) {
        addToast({ severity: 'success', translateKey: 'text_1781686594125pop15l3s7yw' })

        navigate(
          generatePath(QUOTE_DETAILS_ROUTE, {
            quoteId,
            tab: QuoteDetailsTabsOptionsEnum.orderForms,
          }),
        )
      }
    },
  })

  const onClose = () => {
    goBack(generatePath(QUOTES_TAB_ROUTE, { tab: QuotesTabsOptionsEnum.orderForms }))
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
          {translate('text_1781686594125upfeikkemuy')}
        </Typography>
        <Button
          data-test={SIGN_ORDER_FORM_CLOSE_BUTTON_TEST_ID}
          variant="quaternary"
          icon="close"
          onClick={onClose}
        />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="sign-order-form" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <CenteredPage.Container>
          <div className="flex flex-col gap-12">
            <Alert data-test={SIGN_ORDER_FORM_ALERT_TEST_ID} type="info">
              <Typography className="text-grey-700">
                {translate('text_1781686594125tgfd5ypl1h6')}
              </Typography>
            </Alert>

            <div className="flex flex-col gap-1">
              <Typography variant="headline" color="grey700">
                {translate('text_1781686594125csy9lu7em4h', {
                  orderFormNumber: orderForm?.number,
                })}
              </Typography>
              <Typography variant="body" color="grey600">
                {translate('text_178168659412503g50mhn67p')}
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
                    {orderForm?.number}
                  </Typography>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="grey600">
                    {translate('text_65201c5a175a4b0238abf29a')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {orderForm?.customer.name}
                  </Typography>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="grey600">
                    {translate('text_1781686594125ilr4k8xhb5m')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {orderForm?.quote.orderType
                      ? translate(getQuoteOrderTypeTranslationKey(orderForm.quote.orderType))
                      : ''}
                  </Typography>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="grey600">
                    {translate('text_1779695273381h7tmhdzrv48')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {orderForm
                      ? `${orderForm.quote.number} - v${orderForm.quote.currentVersion.version}`
                      : ''}
                  </Typography>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <Typography variant="subhead1">
                {translate('text_1781686594125jxy4tktm5sv')}
              </Typography>

              <form.AppField name="executionMode">
                {(field) => (
                  <field.ComboBoxField
                    dataTest={SIGN_ORDER_FORM_EXECUTION_TYPE_TEST_ID}
                    label={translate('text_17816865941251f6epdwidgk')}
                    placeholder={translate('text_1781686594125cgczfi8sgbt')}
                    disableClearable
                    data={[
                      {
                        value: OrderExecutionModeEnum.ExecuteInLago,
                        label: translate('text_1781686594125wc395bj9cul'),
                        description: translate('text_17817078224635v32b58mejt'),
                      },
                      {
                        value: OrderExecutionModeEnum.OrderOnly,
                        label: translate('text_1781686594125ibfjmzae7cy'),
                        description: translate('text_17817078224637p2veq3bqwe'),
                      },
                    ]}
                  />
                )}
              </form.AppField>

              <form.AppField name="executeAt">
                {(field) => (
                  <field.DatePickerField
                    label={translate('text_17816865941256grf5qs2924')}
                    placeholder={translate('text_17816865941253r8yqeoibh1')}
                  />
                )}
              </form.AppField>
            </div>

            <div className="flex flex-col gap-6">
              <Typography variant="subhead1">
                {translate('text_1781686594125byrh8211ju7')}
              </Typography>
              <form.AppField name="signedDocument">
                {(field) => (
                  <DocumentUploader
                    value={field.state.value ?? null}
                    onChange={(value) => field.handleChange(value ?? undefined)}
                    accept="application/pdf,image/jpeg,image/png"
                    acceptedMimeTypes={['application/pdf', 'image/jpeg', 'image/png']}
                    maxSize={MAX_FILE_SIZE_IN_MB * MB_TO_BYTES}
                    description={translate('text_1781686594125j2s47tpkzvo')}
                    invalidTypeError={translate('text_1781686594125m4b2ej18zyb')}
                    tooLargeError={translate('text_1781686594125tj83pbtkkad')}
                  />
                )}
              </form.AppField>
            </div>

            <div className="flex flex-col gap-6 py-6">
              <Typography variant="subhead1">
                {translate('text_1781707135171i07z6v50cd2')}
              </Typography>
              <div data-test={SIGN_ORDER_FORM_PREVIEW_TEST_ID}>
                {orderForm?.quote?.currentVersion?.content ? (
                  <RichTextEditor mode="preview" isCompact {...previewProps} />
                ) : (
                  <Typography color="grey500">
                    {translate('text_17768523811635qaasto1ziv')}
                  </Typography>
                )}
              </div>
            </div>
          </div>
        </CenteredPage.Container>
      )}

      <CenteredPage.StickyFooter>
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            data-test={SIGN_ORDER_FORM_CANCEL_BUTTON_TEST_ID}
            variant="quaternary"
            onClick={onClose}
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button
            data-test={SIGN_ORDER_FORM_SUBMIT_BUTTON_TEST_ID}
            variant="primary"
            onClick={() => form.handleSubmit()}
          >
            {translate('text_1781686594125upfeikkemuy')}
          </Button>
        </div>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default SignOrderForm

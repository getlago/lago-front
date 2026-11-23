import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useState } from 'react'
import { useParams } from 'react-router'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import {
  addToast,
  getDetailError,
  getGraphQLErrorCode,
  hasDefinedGQLError,
  isSilencedGQLError,
} from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import {
  LagoApiError,
  useGetAgentClaimPageQuery,
  useStartAgentClaimMutation,
  useVerifyAgentClaimMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import Error404 from '~/pages/Error404'
import { Card, Page, Subtitle, Title } from '~/styles/auth'

import {
  AGENT_CLAIM_CODE_FIELD_TEST_ID,
  AGENT_CLAIM_EMAIL_FIELD_TEST_ID,
  AGENT_CLAIM_ERROR_ALERT_TEST_ID,
  AGENT_CLAIM_LOADING_TEST_ID,
  AGENT_CLAIM_NEW_CODE_BUTTON_TEST_ID,
  AGENT_CLAIM_START_SUBMIT_BUTTON_TEST_ID,
  AGENT_CLAIM_SUCCESS_ALERT_TEST_ID,
  AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID,
  AGENT_CLAIM_VERIFY_SUBMIT_BUTTON_TEST_ID,
  AGENT_CLAIM_VERIFY_SUBTITLE_TEST_ID,
} from './agentClaimTestIds'
import {
  CLAIM_CODE_ERRORS,
  claimDefaultValues,
  claimSchema,
  EMAIL_ERRORS,
  START_SILENT_ERROR_DETAILS,
  TOAST_ERROR_DETAILS,
  VERIFICATION_CODE_ERRORS,
  VERIFY_SILENT_ERROR_DETAILS,
  verifyDefaultValues,
  verifySchema,
} from './validationSchema'

gql`
  query getAgentClaimPage($storefrontId: ID!) {
    agentClaimPage(storefrontId: $storefrontId) {
      storefrontName
      organizationName
    }
  }

  mutation startAgentClaim($input: StartAgentClaimInput!) {
    startAgentClaim(input: $input) {
      expiresIn
    }
  }

  mutation verifyAgentClaim($input: VerifyAgentClaimInput!) {
    verifyAgentClaim(input: $input) {
      status
    }
  }
`

type Step = 'claim' | 'verify' | 'claimed'

const CLAIM_FORM_ID = 'agent-claim-form'
const VERIFY_FORM_ID = 'agent-claim-verify-form'

const GENERIC_ERROR = 'text_622f7a3dc32ce100c46a5154'
const TOO_MANY_REQUESTS_ERROR = 'text_1793898059309ltbe60gt6pd'

const showErrorToast = (translateKey: string): void => {
  addToast({ severity: 'danger', translateKey })
}

const getToastErrorKey = (errors?: readonly GraphQLFormattedError[]): string | null => {
  const extensions = errors?.[0]?.extensions

  if (getGraphQLErrorCode(extensions) === LagoApiError.TooManyRequests) {
    return TOO_MANY_REQUESTS_ERROR
  }

  const isToastError = isSilencedGQLError({
    extensions,
    silentErrorCodes: [LagoApiError.TooManyRequests, LagoApiError.NotFound],
    silentErrorDetails: TOAST_ERROR_DETAILS,
  })

  return isToastError ? GENERIC_ERROR : null
}

const AgentClaim = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { storefrontId = '' } = useParams()
  const [step, setStep] = useState<Step>('claim')
  const [submittedClaim, setSubmittedClaim] = useState(claimDefaultValues)
  const [expiresIn, setExpiresIn] = useState(0)

  const { data, loading, error } = useGetAgentClaimPageQuery({
    variables: { storefrontId },
    context: { silentError: true },
  })
  // `retryLink` replays network errors on mutations too: a replayed `startAgentClaim` mails
  // a second code and invalidates the one already read, `verifyAgentClaim` errors on it.
  const [startClaim] = useStartAgentClaimMutation({
    context: {
      disableRetry: true,
      silentErrorCodes: [LagoApiError.TooManyRequests, LagoApiError.NotFound],
      silentErrorDetails: START_SILENT_ERROR_DETAILS,
    },
  })
  const [verifyClaim] = useVerifyAgentClaimMutation({
    context: {
      disableRetry: true,
      silentErrorCodes: [LagoApiError.TooManyRequests, LagoApiError.NotFound],
      silentErrorDetails: VERIFY_SILENT_ERROR_DETAILS,
    },
  })

  const claimForm = useAppForm({
    defaultValues: claimDefaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: claimSchema },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(CLAIM_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value, formApi }) => {
      const claim = { claimCode: value.claimCode.trim(), email: value.email.trim() }

      try {
        const result = await startClaim({ variables: { input: { storefrontId, ...claim } } })

        if (result.data?.startAgentClaim) {
          setSubmittedClaim(claim)
          setExpiresIn(result.data.startAgentClaim.expiresIn)
          setStep('verify')

          return
        }

        const details = result.errors?.[0]?.extensions?.details
        const claimCodeError = getDetailError(details, 'claimCode', CLAIM_CODE_ERRORS)
        const emailError = getDetailError(details, 'email', EMAIL_ERRORS)

        if (claimCodeError || emailError) {
          formApi.setErrorMap({
            onDynamic: {
              fields: {
                ...(claimCodeError && {
                  claimCode: { message: claimCodeError, path: ['claimCode'] },
                }),
                ...(emailError && { email: { message: emailError, path: ['email'] } }),
              },
            },
          })

          return
        }

        const toastErrorKey = getToastErrorKey(result.errors)

        if (toastErrorKey) showErrorToast(toastErrorKey)
      } catch {
        showErrorToast(GENERIC_ERROR)
      }
    },
  })

  const verifyForm = useAppForm({
    defaultValues: verifyDefaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: verifySchema },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(VERIFY_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await verifyClaim({
          variables: {
            input: {
              storefrontId,
              claimCode: submittedClaim.claimCode,
              verificationCode: value.verificationCode.replace(/\s/g, ''),
            },
          },
        })

        if (result.data?.verifyAgentClaim) {
          setStep('claimed')

          return
        }

        const details = result.errors?.[0]?.extensions?.details
        const claimCodeError = getDetailError(details, 'claimCode', CLAIM_CODE_ERRORS)
        const verificationCodeError = getDetailError(
          details,
          'verificationCode',
          VERIFICATION_CODE_ERRORS,
        )

        if (claimCodeError) {
          backToClaim()
          claimForm.setErrorMap({
            onDynamic: {
              fields: { claimCode: { message: claimCodeError, path: ['claimCode'] } },
            },
          })

          return
        }

        if (verificationCodeError) {
          formApi.setErrorMap({
            onDynamic: {
              fields: {
                verificationCode: { message: verificationCodeError, path: ['verificationCode'] },
              },
            },
          })

          return
        }

        const toastErrorKey = getToastErrorKey(result.errors)

        if (toastErrorKey) showErrorToast(toastErrorKey)
      } catch {
        showErrorToast(GENERIC_ERROR)
      }
    },
  })

  const backToClaim = (): void => {
    verifyForm.reset()
    setStep('claim')
  }

  const handleClaimSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    claimForm.handleSubmit()
  }

  const handleVerifySubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    verifyForm.handleSubmit()
  }

  const renderClaimStep = (): JSX.Element => (
    <form
      id={CLAIM_FORM_ID}
      className="flex flex-col gap-8"
      onSubmit={handleClaimSubmit}
      noValidate
    >
      <div>
        <Title>{translate('text_1795167825510gf7q8faqjwn')}</Title>
        <Subtitle noMargins>{translate('text_17951678255102qem2bsaesn')}</Subtitle>
      </div>

      <div className="flex flex-col gap-6">
        <claimForm.AppField name="claimCode">
          {(field) => (
            <field.TextInputField
              label={translate('text_1795167825510w1yoqc95877')}
              placeholder={translate('text_1795167825510cmh1j0yw04t')}
              data-test={AGENT_CLAIM_CODE_FIELD_TEST_ID}
            />
          )}
        </claimForm.AppField>
        <claimForm.AppField name="email">
          {(field) => (
            <field.TextInputField
              label={translate('text_62ab2d0396dd6b0361614d60')}
              placeholder={translate('text_1795167825511x1o1jjet84p')}
              beforeChangeFormatter={['lowercase']}
              data-test={AGENT_CLAIM_EMAIL_FIELD_TEST_ID}
            />
          )}
        </claimForm.AppField>
      </div>

      <claimForm.AppForm>
        <claimForm.SubmitButton
          dataTest={AGENT_CLAIM_START_SUBMIT_BUTTON_TEST_ID}
          size="large"
          fullWidth
        >
          {translate('text_1795167825511s8i33de9eng')}
        </claimForm.SubmitButton>
      </claimForm.AppForm>
    </form>
  )

  const renderVerifyStep = (): JSX.Element => {
    const minutes = Math.ceil(expiresIn / 60)

    return (
      <form
        id={VERIFY_FORM_ID}
        className="flex flex-col gap-8"
        onSubmit={handleVerifySubmit}
        noValidate
      >
        <div>
          <Title>{translate('text_1795167825511f1be0mnnlmz')}</Title>
          <Typography
            data-test={AGENT_CLAIM_VERIFY_SUBTITLE_TEST_ID}
            html={translate(
              'text_1795167825511w97mt3pna1z',
              { email: submittedClaim.email, minutes },
              minutes,
            )}
          />
        </div>

        <verifyForm.AppField name="verificationCode">
          {(field) => (
            <field.TextInputField
              label={translate('text_1795167825511nmfd1sbieiz')}
              placeholder={translate('text_1795167825511cqwa62wtib0')}
              autoComplete="one-time-code"
              data-test={AGENT_CLAIM_VERIFICATION_CODE_FIELD_TEST_ID}
            />
          )}
        </verifyForm.AppField>

        <div className="flex flex-col gap-4">
          <verifyForm.AppForm>
            <verifyForm.SubmitButton
              dataTest={AGENT_CLAIM_VERIFY_SUBMIT_BUTTON_TEST_ID}
              size="large"
              fullWidth
            >
              {translate('text_1795167825511lkxgt2p85ps')}
            </verifyForm.SubmitButton>
          </verifyForm.AppForm>
          <Button
            variant="quaternary"
            size="large"
            fullWidth
            onClick={backToClaim}
            data-test={AGENT_CLAIM_NEW_CODE_BUTTON_TEST_ID}
          >
            {translate('text_17951678255111532h15xuvl')}
          </Button>
        </div>
      </form>
    )
  }

  const renderContent = (): JSX.Element => {
    if (loading && !data) {
      return (
        <div data-test={AGENT_CLAIM_LOADING_TEST_ID}>
          <Skeleton variant="text" className="mb-8 w-52" />
          <Skeleton variant="text" className="mb-4 w-110" />
          <Skeleton variant="text" className="w-76" />
        </div>
      )
    }

    if (!data?.agentClaimPage) {
      return (
        <Alert type="danger" data-test={AGENT_CLAIM_ERROR_ALERT_TEST_ID}>
          {translate(GENERIC_ERROR)}
        </Alert>
      )
    }

    if (step === 'claim') return renderClaimStep()

    if (step === 'verify') return renderVerifyStep()

    return (
      <>
        <Title>{translate('text_1795167825511l8qc32om7wd')}</Title>
        <Subtitle>{translate('text_1795167825511h1b03dixq4v')}</Subtitle>
        <Alert type="success" data-test={AGENT_CLAIM_SUCCESS_ALERT_TEST_ID}>
          {translate('text_1795167825511fhk9smssb8r', {
            storefrontName: data.agentClaimPage.storefrontName,
            email: submittedClaim.email,
            organizationName: data.agentClaimPage.organizationName,
          })}
        </Alert>
      </>
    )
  }

  if (hasDefinedGQLError('NotFound', error)) return <Error404 />

  return (
    <Page>
      <Card>{renderContent()}</Card>
    </Page>
  )
}

export default AgentClaim

import { revalidateLogic } from '@tanstack/react-form'

import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { Card, Page, StyledLogo, Title } from '~/styles/auth'

import { useRecaptchaCleanup } from './common/useRecaptcha'
import { useVerifyEmail } from './verifyEmail/useVerifyEmail'
import { VerifyEmailCheckFailed } from './verifyEmail/VerifyEmailCheckFailed'
import { VerifyEmailConfirmForm } from './verifyEmail/VerifyEmailConfirmForm'
import { VerifyEmailLinkState } from './verifyEmail/VerifyEmailLinkState'
import {
  verifyEmailDefaultValues,
  verifyEmailPasswordSchema,
  verifyEmailSecretSchema,
} from './verifyEmailForm/validationSchema'

const VerifyEmail = (): JSX.Element => {
  const { translate } = useInternationalization()
  const verifyEmail = useVerifyEmail()

  useRecaptchaCleanup()

  const form = useAppForm({
    defaultValues: verifyEmailDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: verifyEmail.isPasswordRequired
        ? verifyEmailPasswordSchema
        : verifyEmailSecretSchema,
    },
    onSubmit: ({ value }) => verifyEmail.confirm(value.password),
  })

  const renderContent = (): JSX.Element => {
    const { linkState, checkError } = verifyEmail

    if (verifyEmail.isChecking) return <Spinner />
    if (!linkState && checkError) {
      return <VerifyEmailCheckFailed error={checkError} onRetry={verifyEmail.retryCheck} />
    }
    if (!linkState) return <Spinner />

    if (verifyEmail.isVerifying) {
      return (
        <div className="flex flex-col gap-3">
          <Title>{translate('text_1793909885493mi63u2s2ync')}</Title>
          <Typography>{translate('text_17939098854934yp8t80140w')}</Typography>
        </div>
      )
    }

    if (linkState === 'valid') {
      return (
        <VerifyEmailConfirmForm
          form={form}
          email={verifyEmail.email}
          isPasswordRequired={verifyEmail.isPasswordRequired}
          bannerError={verifyEmail.bannerError}
          passwordError={verifyEmail.passwordError}
          onPasswordChange={verifyEmail.clearPasswordError}
        />
      )
    }

    return (
      <VerifyEmailLinkState
        linkState={linkState}
        hasSignupSecret={verifyEmail.hasSignupSecret}
        resendNotice={verifyEmail.resendNotice}
        bannerError={verifyEmail.bannerError}
        isResending={verifyEmail.isResending}
        onSendNewLink={verifyEmail.sendNewLink}
      />
    )
  }

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        {renderContent()}
      </Card>
    </Page>
  )
}

export default VerifyEmail

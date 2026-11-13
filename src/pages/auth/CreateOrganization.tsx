import { useApolloClient } from '@apollo/client'
import { useEffect } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { logOut } from '~/core/apolloClient'
import { HOME_ROUTE, useNavigate } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useNeedsOrganization } from '~/hooks/useNeedsOrganization'
import { Card, Page, StyledLogo, Title } from '~/styles/auth'

import { CreateOrganizationForm } from './createOrganizationForm/CreateOrganizationForm'
import {
  SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_RETRY_BUTTON_TEST_ID,
} from './signUpTestIds'

const CreateOrganization = (): JSX.Element => {
  const { translate } = useInternationalization()
  const client = useApolloClient()
  const navigate = useNavigate()
  const { needsOrganization, loading, hasError, retry } = useNeedsOrganization()
  const { currentUser, loading: isUserLoading, refetchCurrentUserInfos } = useCurrentUser()

  useEffect(() => {
    if (loading || hasError || needsOrganization) return

    navigate(HOME_ROUTE, { replace: true })
  }, [loading, hasError, needsOrganization, navigate])

  const onUserNotEligible = async (): Promise<void> => {
    await refetchCurrentUserInfos()
    await retry()
  }

  const renderContent = (): JSX.Element => {
    if (loading || (!needsOrganization && !hasError)) return <Spinner />
    if (!hasError && isUserLoading && !currentUser) return <Spinner />

    return (
      <div className="flex flex-col gap-8">
        <div>
          <Title>{translate('text_660bf95c75dd928ced0ecb04')}</Title>
          <Typography>{translate('text_17943151604897omblal8362')}</Typography>
        </div>
        {hasError && (
          <>
            <Alert type="danger">{translate('text_1793898059309m0mmb7g8tw4')}</Alert>
            <Button
              size="large"
              fullWidth
              data-test={SELF_SERVE_CREATE_ORGANIZATION_RETRY_BUTTON_TEST_ID}
              onClick={retry}
            >
              {translate('text_63e27c56dfe64b846474efa3')}
            </Button>
          </>
        )}
        {!hasError && (
          <CreateOrganizationForm
            email={currentUser?.email ?? undefined}
            onUserNotEligible={onUserNotEligible}
          />
        )}
        <Button
          variant="quaternary"
          data-test={SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID}
          onClick={() => logOut(client, true)}
        >
          {translate('text_623b497ad05b960101be3444')}
        </Button>
      </div>
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

export default CreateOrganization

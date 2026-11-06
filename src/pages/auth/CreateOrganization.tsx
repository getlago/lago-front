import { useApolloClient } from '@apollo/client'
import { useEffect } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Spinner } from '~/components/designSystem/Spinner'
import { logOut } from '~/core/apolloClient'
import { HOME_ROUTE, useNavigate } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { Card, Page, StyledLogo, Title } from '~/styles/auth'

import { SELF_SERVE_CREATE_ORGANIZATION_LOG_OUT_BUTTON_TEST_ID } from './signUpTestIds'

const CreateOrganization = (): JSX.Element => {
  const { translate } = useInternationalization()
  const client = useApolloClient()
  const navigate = useNavigate()
  const { currentUser, loading } = useCurrentUser()

  useEffect(() => {
    if (loading || !currentUser || currentUser.needsOrganization) return

    navigate(HOME_ROUTE, { replace: true })
  }, [loading, currentUser, navigate])

  const renderContent = (): JSX.Element => {
    if (!currentUser?.needsOrganization) return <Spinner />

    return (
      <div className="flex flex-col gap-8">
        <Title>{translate('text_660bf95c75dd928ced0ecb04')}</Title>
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

import { gql } from '@apollo/client'
import { Spinner } from 'lago-design-system'
import { useEffect } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import { ButtonLink, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { GOCARDLESS_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import {
  AddGocardlessProviderDialogFragmentDoc,
  useAddGocardlessApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Gocardless from '~/public/images/gocardless.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { PageHeader } from '~/styles'

gql`
  fragment GocardlessIntegrationOauthCallback on GocardlessProvider {
    id
    name
    code
  }

  mutation addGocardlessApiKey($input: AddGocardlessPaymentProviderInput!) {
    addGocardlessPaymentProvider(input: $input) {
      id
      ...AddGocardlessProviderDialog
      ...GocardlessIntegrationOauthCallback
    }
  }

  ${AddGocardlessProviderDialogFragmentDoc}
`

const GocardlessIntegrationOauthCallback = () => {
  const [searchParams] = useSearchParams()
  const accessCode = searchParams.get('code') || ''
  const code = searchParams.get('lago_code') || ''
  const name = searchParams.get('lago_name') || ''

  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const [addGocardlessApiKey, { loading, error }] = useAddGocardlessApiKeyMutation()

  useEffect(() => {
    const createIntegration = async () => {
      const res = await addGocardlessApiKey({
        variables: {
          input: {
            accessCode,
            code,
            name,
          },
        },
      })

      navigate(
        generatePath(GOCARDLESS_INTEGRATION_DETAILS_ROUTE, {
          integrationId: res.data?.addGocardlessPaymentProvider?.id as string,
          integrationGroup: IntegrationsTabsOptionsEnum.Lago,
        }),
      )
    }

    if (!!code && !!accessCode && !!name) {
      createIntegration()
    } else {
      navigate(
        generatePath(INTEGRATIONS_ROUTE, { integrationGroup: IntegrationsTabsOptionsEnum.Lago }),
      )

      addToast({
        severity: 'danger',
        translateKey: 'text_622f7a3dc32ce100c46a5154',
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <ButtonLink
            disabled={loading}
            to={generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Lago,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" className="w-30" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_634ea0ecc6147de10ddb6625')}
            </Typography>
          )}
        </PageHeader.Group>
      </PageHeader.Wrapper>

      <IntegrationsPage.Header
        isLoading={loading}
        integrationLogo={<Gocardless />}
        integrationName={translate('text_634ea0ecc6147de10ddb6625')}
        integrationChip={translate('text_62b1edddbf5f461ab971270d')}
        integrationDescription={translate('text_62b1edddbf5f461ab971271f')}
      />

      {loading || !error ? (
        <Spinner />
      ) : (
        <GenericPlaceholder
          image={<ErrorImage width="136" height="104" />}
          title={translate('text_62bac37900192b773560e82d')}
          subtitle={translate('text_62bac37900192b773560e82f')}
          buttonTitle={translate('text_62bac37900192b773560e831')}
          buttonAction={() =>
            navigate(
              generatePath(INTEGRATIONS_ROUTE, {
                integrationGroup: IntegrationsTabsOptionsEnum.Lago,
              }),
            )
          }
        />
      )}
    </>
  )
}

export default GocardlessIntegrationOauthCallback

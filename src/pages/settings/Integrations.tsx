import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { useNavigate } from 'react-router'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { Typography, Selector, Avatar, SelectorSkeleton, Chip } from '~/components/designSystem'
import Stripe from '~/public/images/stripe.svg'
import { useIntegrationsSettingQuery } from '~/generated/graphql'
import { STRIPE_INTEGRATION_ROUTE } from '~/core/router'
import {
  AddStripeDialog,
  AddStripeDialogRef,
} from '~/components/settings/integrations/AddStripeDialog'

gql`
  query integrationsSetting {
    currentUser {
      id
      organizations {
        id
        stripePaymentProvider {
          id
        }
      }
    }
  }
`

const Integrations = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const addDialogRef = useRef<AddStripeDialogRef>(null)
  const { data, loading } = useIntegrationsSettingQuery()
  const hasStripeIntegration = !!(data?.currentUser?.organizations || [])[0]?.stripePaymentProvider
    ?.id

  return (
    <Page>
      <Title variant="headline">{translate('text_62b1edddbf5f461ab9712750')}</Title>
      <Subtitle>{translate('text_62b1edddbf5f461ab9712765')}</Subtitle>

      {loading ? (
        <LoadingContainer>
          {[0, 1, 2].map((i) => (
            <SelectorSkeleton fullWidth key={`skeleton-${i}`} />
          ))}
        </LoadingContainer>
      ) : (
        <Selector
          title={translate('text_62b1edddbf5f461ab971277d')}
          subtitle={translate('text_62b1edddbf5f461ab9712795')}
          icon={
            <Avatar variant="connector">
              <Stripe />
            </Avatar>
          }
          endIcon={
            hasStripeIntegration ? (
              <Chip label={translate('text_62b1edddbf5f461ab97127ad')} />
            ) : undefined
          }
          onClick={() => {
            if (hasStripeIntegration) {
              navigate(STRIPE_INTEGRATION_ROUTE)
            } else {
              const element = document.activeElement as HTMLElement

              element.blur && element.blur()
              addDialogRef.current?.openDialog()
            }
          }}
          fullWidth
        />
      )}
      <AddStripeDialog ref={addDialogRef} />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(12)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const LoadingContainer = styled.div`
  > * {
    margin-bottom: ${theme.spacing(4)};
  }
`

export default Integrations

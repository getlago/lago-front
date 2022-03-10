import styled from 'styled-components'

import { useCurrentUserInfosVar, addToast } from '~/core/apolloClient'
import { useI18nContext } from '~/core/I18nContext'
import { Typography, Button } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { theme } from '~/styles'

const ApiKeys = () => {
  const { currentOrganization } = useCurrentUserInfosVar()
  const { translate } = useI18nContext()
  const apiKey = currentOrganization?.apiKey.replace(/.(?=.{3,}$)/g, '•')

  return (
    <Page>
      <Typography variant="headline">{translate('text_6227a2e847fcd700e903893f')}</Typography>
      <Subtitle>{translate('text_6227a2e847fcd700e9038947')}</Subtitle>
      <CopyBlock>
        <StyledTextInput disabled value={apiKey} />
        <Button
          variant="quaternary"
          size="large"
          startIcon="duplicate"
          onClick={() => {
            navigator.clipboard.writeText(currentOrganization?.apiKey || '')
            addToast({
              severity: 'info',
              translateKey: 'text_6227a2e847fcd700e9038952',
            })
          }}
        >
          {translate('text_6227a2e847fcd700e903894f')}
        </Button>
      </CopyBlock>
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(12)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const StyledTextInput = styled(TextInput)`
  width: 244px;
  margin-right: ${theme.spacing(3)};
`

const CopyBlock = styled.div`
  display: flex;
`

export default ApiKeys

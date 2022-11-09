import styled from 'styled-components'

import { theme, NAV_HEIGHT } from '~/styles'
import { Typography, Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const InvoiceCreditNoteList = () => {
  const { translate } = useInternationalization()

  return (
    <div>
      <Header>
        <Typography variant="subhead">{translate('text_636bdef6565341dcb9cfb129')}</Typography>
        <Button variant="quaternary">{translate('text_636bdef6565341dcb9cfb127')} </Button>
      </Header>
      <Typography>{translate('text_636bdef6565341dcb9cfb12b')}</Typography>
    </div>
  )
}

InvoiceCreditNoteList.displayName = 'InvoiceCreditNoteList'

export default InvoiceCreditNoteList

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing(6)};
`

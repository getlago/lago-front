import { forwardRef } from 'react'
import styled from 'styled-components'

import { Dialog, DialogRef, Typography, Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { envGlobalVar, useCurrentUserInfosVar, addToast } from '~/core/apolloClient'
import { theme } from '~/styles'

const { appEnv, apiUrl, appVersion } = envGlobalVar()

export interface DebugInfoDialogRef extends DialogRef {}

export const DebugInfoDialog = forwardRef<DialogRef>(({}, ref) => {
  const { translate } = useInternationalization()
  const { user } = useCurrentUserInfosVar()

  return (
    <Dialog
      ref={ref}
      title={translate('text_62f50d26c989ab0319688498')}
      description={<Typography html={translate('text_62f50d26c989ab031968849a')} />}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              navigator.clipboard.writeText(
                `### Environment informations
**App environment :** ${appEnv}
**API URL :** ${apiUrl} 
**Version :** ${appVersion}` +
                  (!!user?.id
                    ? `
**User Id :** ${user?.id}`
                    : '')
              )

              addToast({
                severity: 'info',
                translateKey: 'text_62f50d3cc15266f3bd1d83ce',
              })
            }}
          >
            {translate('text_62f50d26c989ab03196884ac')}
          </Button>
          <Button onClick={closeDialog}>{translate('text_62f50d26c989ab03196884ae')}</Button>
        </>
      )}
    >
      <Content>
        <Line>
          <Typography variant="caption">{translate('text_62f50d26c989ab031968849e')}</Typography>
          <Typography color="textSecondary">{appEnv}</Typography>
        </Line>
        <Line>
          <Typography variant="caption">{translate('text_62f50d26c989ab03196884a2')}</Typography>
          <Typography color="textSecondary">{apiUrl}</Typography>
        </Line>
        <Line>
          <Typography variant="caption">{translate('text_62f50d26c989ab03196884aa')}</Typography>
          <Typography color="textSecondary">{appVersion}</Typography>
        </Line>
        {user?.id && (
          <Line>
            <Typography variant="caption">{translate('text_62f50d26c989ab03196884a6')}</Typography>
            <Typography color="textSecondary">{user?.id}</Typography>
          </Line>
        )}
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
  > *:last-child {
    margin-bottom: ${theme.spacing(8)};
  }
`

const Line = styled.div`
  display: flex;
  align-items: baseline;

  > *:first-child {
    width: 140px;
    min-width: 140px;
    margin-right: ${theme.spacing(3)};
  }
`

DebugInfoDialog.displayName = 'DebugInfoDialog'

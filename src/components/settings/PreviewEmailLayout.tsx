import { FC, PropsWithChildren, useRef } from 'react'
import styled from 'styled-components'

import { LocaleEnum } from '~/core/translations'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { theme } from '~/styles'

import {
  UpdateOrganizationLogoDialog,
  UpdateOrganizationLogoDialogRef,
} from './emails/UpdateOrganizationLogoDialog'

import { Avatar, Button, Tooltip, Typography } from '../designSystem'

interface PreviewEmailLayoutProps extends PropsWithChildren {
  language: LocaleEnum
  emailObject: string
}

export const PreviewEmailLayout: FC<PreviewEmailLayoutProps> = ({
  language,
  emailObject,
  children,
}) => {
  const updateLogoDialogRef = useRef<UpdateOrganizationLogoDialogRef>(null)

  const { translate } = useInternationalization()
  const { translateWithContextualLocal } = useContextualLocale(language)

  const { logoUrl, name } = useEmailConfig()

  return (
    <>
      <InvoicePreviewContent>
        <InvoiceTitle variant="bodyHl" color="grey700">
          {emailObject}
        </InvoiceTitle>
        <InvoiceHead>
          <EmptyAvatar />
          <div>
            <div>
              <Typography variant="captionHl" color="grey700" component="span">
                {name}
              </Typography>
              <FromEmail>{translate('text_64188b3d9735d5007d712260')}</FromEmail>
            </div>
            <ToEmail>{translateWithContextualLocal('text_64188b3d9735d5007d712262')}</ToEmail>
          </div>
        </InvoiceHead>
        <div>
          <Company>
            {!!logoUrl ? (
              <Avatar size="medium" variant="connector">
                <img src={logoUrl} alt="company-logo" />
              </Avatar>
            ) : (
              <Tooltip title={translate('text_6411e0aa915fd500a4d92cfb')} placement="top">
                <Button
                  icon="plus"
                  size="small"
                  variant="secondary"
                  onClick={() => {
                    updateLogoDialogRef?.current?.openDialog()
                  }}
                />
              </Tooltip>
            )}
            <Typography variant="subhead">{name}</Typography>
          </Company>
          <TemplateContent>{children}</TemplateContent>
          <Footer>
            <Typography variant="note" color="grey500">
              {translateWithContextualLocal('text_64188b3d9735d5007d712278')}
            </Typography>
            <Logo height="12px" />
          </Footer>
        </div>
      </InvoicePreviewContent>

      <UpdateOrganizationLogoDialog ref={updateLogoDialogRef} />
    </>
  )
}

const InvoicePreviewContent = styled.div`
  display: flex;
  flex-direction: column;
`

const Company = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const TemplateContent = styled.div`
  background-color: ${theme.palette.common.white};
  padding: ${theme.spacing(8)};
  border-radius: 12px;
  border: ${theme.palette.grey[300]};
  margin-bottom: ${theme.spacing(8)};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const Footer = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: -0.16px;
  color: ${theme.palette.grey[500]};
  margin-bottom: ${theme.spacing(20)};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    margin: 0 4px;
  }
`

const FromEmail = styled.span`
  margin-left: ${theme.spacing(1)};
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: -0.16px;
  text-align: left;
  color: ${theme.palette.grey[600]};
`

const ToEmail = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: -0.16px;
  text-align: left;
  color: ${theme.palette.grey[600]};
`

const InvoiceTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(4)};
  flex: 1;
`

const EmptyAvatar = styled.div`
  height: 40px;
  min-height: 40px;
  min-width: 40px;
  width: 40px;
  border-radius: 50%;
  background-color: ${theme.palette.grey[300]};
  margin-right: ${theme.spacing(4)};
`

const InvoiceHead = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: ${theme.spacing(12)};
`

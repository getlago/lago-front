import { FC, PropsWithChildren, useRef } from 'react'

import { LocaleEnum } from '~/core/translations'
import { useContextualLocale } from '~/hooks/core/useContextualLocale'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useEmailConfig } from '~/hooks/useEmailConfig'
import Logo from '~/public/images/logo/lago-logo-grey.svg'

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
      <div>
        <Typography className="mb-4" variant="bodyHl" color="grey700">
          {emailObject}
        </Typography>
        <div className="mb-12 flex w-full items-center">
          <div className="mr-4 size-10 rounded-full bg-grey-300" />
          <div>
            <div className="h-[1em]">
              <Typography variant="captionHl" color="grey700" component="span">
                {name}
              </Typography>
              <Typography variant="note" component="span" className="ml-1">
                {translate('text_64188b3d9735d5007d712260')}
              </Typography>
            </div>
            <Typography variant="note" component="span">
              {translateWithContextualLocal('text_64188b3d9735d5007d712262')}
            </Typography>
          </div>
        </div>
        <div>
          <div className="mb-8 flex items-center justify-center not-last-child:mr-3">
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
          </div>
          <section className="mb-8 flex flex-col items-center justify-center rounded-xl border border-grey-300 bg-white p-8">
            {children}
          </section>
          <div className="mb-20 flex items-center justify-center [&>svg]:mx-1">
            <Typography variant="note" color="grey500">
              {translateWithContextualLocal('text_64188b3d9735d5007d712278')}
            </Typography>
            <Logo height="12px" />
          </div>
        </div>
      </div>

      <UpdateOrganizationLogoDialog ref={updateLogoDialogRef} />
    </>
  )
}

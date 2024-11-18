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

import { Avatar, Button, Skeleton, Tooltip, Typography } from '../designSystem'

interface PreviewEmailLayoutProps extends PropsWithChildren {
  language: LocaleEnum
  emailObject: string
  emailFrom?: string
  emailTo?: string
  isLoading?: boolean
}

export const PreviewEmailLayout: FC<PreviewEmailLayoutProps> = ({
  language,
  emailObject,
  emailFrom,
  emailTo,
  isLoading,
  children,
}) => {
  const updateLogoDialogRef = useRef<UpdateOrganizationLogoDialogRef>(null)

  const { translate } = useInternationalization()
  const { translateWithContextualLocal } = useContextualLocale(language)

  const { logoUrl, name } = useEmailConfig()

  return (
    <>
      <div>
        {isLoading ? (
          <Skeleton color="dark" variant="text" width={360} className="mb-5" />
        ) : (
          <Typography className="mb-4" variant="bodyHl" color="grey700">
            {emailObject}
          </Typography>
        )}

        <div className="mb-12 flex w-full items-center">
          {isLoading ? (
            <>
              <Skeleton color="dark" variant="circular" size="big" className="mr-4" />
              <div>
                <Skeleton color="dark" variant="text" width={240} className="mb-2" />
                <Skeleton color="dark" variant="text" width={120} />
              </div>
            </>
          ) : (
            <>
              <div className="mr-4 size-10 rounded-full bg-grey-300" />
              <div>
                <div className="h-[1em]">
                  <Typography variant="captionHl" color="grey700" component="span">
                    {name}
                  </Typography>
                  <Typography variant="note" component="span" className="ml-1">
                    {emailFrom || translate('text_64188b3d9735d5007d712260')}
                  </Typography>
                </div>
                <Typography variant="note" component="span">
                  {emailTo || translateWithContextualLocal('text_64188b3d9735d5007d712262')}
                </Typography>
              </div>
            </>
          )}
        </div>

        <div>
          <div className="mb-8 flex items-center justify-center not-last-child:mr-3">
            {isLoading ? (
              <>
                <Skeleton color="dark" variant="connectorAvatar" size="medium" className="mr-3" />
                <Skeleton color="dark" variant="text" width={120} />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <section className="mb-8 rounded-xl border border-grey-300 bg-white p-8">
            {children}
          </section>

          <div className="mb-20 flex items-center justify-center [&>svg]:mx-1">
            {isLoading ? (
              <Skeleton color="dark" variant="text" width={220} />
            ) : (
              <>
                <Typography variant="note" color="grey500">
                  {translateWithContextualLocal('text_64188b3d9735d5007d712278')}
                </Typography>
                <Logo height="12px" />
              </>
            )}
          </div>
        </div>
      </div>

      <UpdateOrganizationLogoDialog ref={updateLogoDialogRef} />
    </>
  )
}

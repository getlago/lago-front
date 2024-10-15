import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Button, Drawer, DrawerRef, Skeleton, Typography } from '~/components/designSystem'
import { LocaleEnum } from '~/core/translations'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LanguageSettingsButton } from '../LanguageSettingsButton'
import { PreviewEmailLayout } from '../PreviewEmailLayout'

export interface PreviewCampaignEmailDrawerRef extends DrawerRef {
  openDrawer: (data?: any) => unknown
  closeDrawer: () => void
}

export const PreviewCampaignEmailDrawer = forwardRef<PreviewCampaignEmailDrawerRef>(
  (props, ref) => {
    const { translate } = useInternationalization()
    const drawerRef = useRef<DrawerRef>(null)
    const [locale, setLocale] = useState<LocaleEnum>(LocaleEnum.en)
    const [localData, setLocalData] = useState<any>()

    const loading = false

    useImperativeHandle(ref, () => ({
      openDrawer: (data) => {
        setLocalData(data)
        drawerRef.current?.openDrawer()
      },
      closeDrawer: () => drawerRef.current?.closeDrawer(),
    }))

    return (
      <Drawer
        ref={drawerRef}
        withPadding={false}
        stickyBottomBar={({ closeDrawer }) => (
          <div className="flex justify-end">
            <Button onClick={closeDrawer}>{translate('Close preview')}</Button>
          </div>
        )}
        title={
          <div className="flex flex-1 flex-row items-center justify-between gap-1">
            <Typography variant="bodyHl" color="textSecondary">
              {translate('Preview email template')}
            </Typography>
            <LanguageSettingsButton
              language={locale}
              onChange={(currentLocale) => setLocale(currentLocale)}
            />
          </div>
        }
      >
        <div className="h-full bg-grey-100 p-12">
          <PreviewEmailLayout
            isLoading={loading}
            language={locale}
            emailObject={translate('Your overdue balance from Banco')}
          >
            {loading ? (
              <div className="flex flex-col gap-7">
                <Skeleton color="dark" variant="text" width={104} />
                <Skeleton color="dark" variant="text" width="100%" />
                <Skeleton color="dark" variant="text" width={160} />
              </div>
            ) : (
              // TODO: Extract from manual dunning
              <></>
            )}
          </PreviewEmailLayout>
        </div>
      </Drawer>
    )
  },
)

PreviewCampaignEmailDrawer.displayName = 'PreviewCampaignEmailDrawer'

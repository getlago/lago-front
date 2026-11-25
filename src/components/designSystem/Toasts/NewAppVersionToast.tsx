import { useNewAppVersionCheck } from '~/core/appVersion/useNewAppVersionCheck'
import { reloadWithCacheBust } from '~/core/utils/reloadWithCacheBust'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { Button } from '../Button'
import { Icon } from '../Icon'
import { Typography } from '../Typography'

export const NEW_APP_VERSION_TOAST_TEST_ID = 'new-app-version-toast'
export const NEW_APP_VERSION_TOAST_RELOAD_TEST_ID = 'new-app-version-toast-reload'
export const NEW_APP_VERSION_TOAST_CLOSE_TEST_ID = 'new-app-version-toast-close'

// Not in toastsVar: Toast has no slot for an action button, and only the newest three toasts
// show, so a burst of others could push this one out.
export const NewAppVersionToast = () => {
  const { translate } = useInternationalization()
  const { isNewAppVersionAvailable, dismiss } = useNewAppVersionCheck()

  if (!isNewAppVersionAvailable) return null

  // z-sideNav, below drawers and dialogs: it never auto-closes, so above them it would cover
  // their bottom-right Save/Cancel bar. An open drawer hides it until it closes.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-sideNav box-border flex w-[360px] max-w-[calc(100vw-32px)] animate-fade-in-right cursor-default items-start gap-3 rounded-xl bg-grey-700 p-4 text-white shadow-lg"
      data-test={NEW_APP_VERSION_TOAST_TEST_ID}
    >
      <Icon name="info-circle" color="light" className="mt-1" />
      <div className="flex flex-1 flex-col items-start gap-1">
        <Typography variant="bodyHl" color="white">
          {translate('text_1795447103881sn8hk9lt6p3')}
        </Typography>
        <Typography variant="caption" color="grey400">
          {translate('text_1795447103881r6o3v1c9l0r')}
        </Typography>
        <Button
          className="mt-2"
          size="small"
          onClick={reloadWithCacheBust}
          data-test={NEW_APP_VERSION_TOAST_RELOAD_TEST_ID}
        >
          {translate('text_1795447103882bgclf5mgvyz')}
        </Button>
      </div>
      <Button
        variant="quaternary-light"
        inheritColor
        size="small"
        icon="close"
        aria-label={translate('text_62f50d26c989ab03196884ae')}
        onClick={dismiss}
        data-test={NEW_APP_VERSION_TOAST_CLOSE_TEST_ID}
      />
    </div>
  )
}

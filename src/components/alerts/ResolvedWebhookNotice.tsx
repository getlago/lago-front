import { Alert } from '~/components/designSystem/Alert'
import { WEBHOOKS_ROUTE } from '~/components/developers/devtoolsRoutes'
import { Link } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DEVTOOL_TAB_PARAMS } from '~/hooks/useDeveloperTool'
import { usePermissions } from '~/hooks/usePermissions'

export const RESOLVED_WEBHOOK_NOTICE_TEST_ID = 'resolved-webhook-notice'

export const ResolvedWebhookNotice = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

  const renderWebhooksLink = (): JSX.Element | null => {
    if (!hasPermissions(['developersManage'])) return null

    const webhooksUrl = new URL(window.location.href)

    webhooksUrl.searchParams.set(DEVTOOL_TAB_PARAMS, WEBHOOKS_ROUTE)

    return (
      <Link
        className="ml-1 text-blue-600 hover:underline"
        to={webhooksUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
      >
        {translate('text_6271200984178801ba8bdede')}
      </Link>
    )
  }

  return (
    <Alert type="info" data-test={RESOLVED_WEBHOOK_NOTICE_TEST_ID}>
      {translate('text_1792525787885ii787mch1rx')}
      {renderWebhooksLink()}
    </Alert>
  )
}

import { tw } from 'lago-design-system'
import { useState } from 'react'
import { Panel } from 'react-resizable-panels'
import { matchRoutes } from 'react-router-dom'

import { ChatHistory } from '~/components/aiAgent/ChatHistory'
import { NavigationBar } from '~/components/aiAgent/NavigationBar'
import { PanelAiAgent } from '~/components/aiAgent/PanelAiAgent'
import { PanelWrapper } from '~/components/aiAgent/PanelWrapper'
import { getHiddenAiAgentPaths } from '~/components/aiAgent/utils'
import { useLocation } from '~/core/router'
import {
  AGENT_TYPE_SHOW_HISTORY,
  AIPanelEnum,
  PANEL_CLOSED,
  PANEL_OPEN,
  useAiAgent,
} from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

export const AiAgent = () => {
  const { agentType, panelRef, currentPanelOpened, panelOpen, state, resetConversation } =
    useAiAgent()
  const { isPremium, currentUser } = useCurrentUser()
  const { translate } = useInternationalization()
  const [showHistory, setShowHistory] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const location = useLocation()
  const { hasPermissions } = usePermissions()

  if (!currentUser) {
    return null
  }

  // Resolve the slug from the URL's first segment + memberships. We can't
  // use `location.strippedPathname` here because `AiAgent` is rendered as a
  // sibling of `RouteWrapper` (not inside `<Routes>`) — `useParams()` has no
  // matched-route context to read the slug from, so the wrapper's strip is a
  // no-op in this component.
  const slugFromPath = location.pathname.split('/')[1] ?? ''
  const isInsideValidOrgContext = !!currentUser.memberships?.some(
    (m) => m.organization.slug === slugFromPath,
  )

  // Hide when the path's first segment isn't a slug the user is a member of:
  // full-page `Error404` (catch-all `*`, `OrganizationLayout` fallback for an
  // unknown slug, or legacy slug-less paths like `/customers`).
  if (!isInsideValidOrgContext) {
    return null
  }

  // Hide when the (slug-stripped) path matches one of the layouts that opt
  // out of the AI agent — object creation, settings creation, customer
  // portal, etc. Route patterns in `~/core/router` are still authored
  // slug-less (e.g. `CREATE_PLAN_ROUTE = '/create/plans'`), so we strip the
  // slug from the actual location before matching. Without this, the migration
  // to `/${slug}/create/plans` would silently turn the AI agent back on for
  // every creation/edit flow.
  const strippedPath = location.pathname.replace(`/${slugFromPath}`, '') || '/'
  const hiddenPaths = getHiddenAiAgentPaths()
  const match = matchRoutes(hiddenPaths, { pathname: strippedPath })

  if (match) {
    return null
  }

  const hasAccessToAiAgent =
    isPremium && hasPermissions(['aiConversationsView', 'aiConversationsCreate'])

  const shouldDisplayWelcomeMessage = !state.messages.length
  const agentHasHistory = AGENT_TYPE_SHOW_HISTORY[agentType]

  const onBackButton = () => {
    if (showHistory) {
      return setShowHistory(false)
    }

    return resetConversation()
  }

  const onFullscreen = () => {
    setIsFullscreen((f) => !f)
  }

  return (
    <>
      <div className="relative">
        <div className="h-screen w-12 bg-white shadow-l">
          <div className="absolute rotate-90-tl">
            <NavigationBar hasAccessToAiAgent={hasAccessToAiAgent} />
          </div>
        </div>
      </div>

      <Panel
        id="ai-panel"
        ref={panelRef}
        defaultSize={PANEL_CLOSED}
        minSize={PANEL_CLOSED}
        maxSize={PANEL_OPEN}
        className={tw(
          panelOpen && isFullscreen && 'fixed left-0 top-0 z-[1700] w-full bg-white',
          panelOpen && !isFullscreen && 'min-w-[360px] max-w-[420px]',
          !panelOpen && 'min-w-[0px]',
          'shadow-l',
        )}
      >
        {currentPanelOpened === AIPanelEnum.ai && (
          <PanelWrapper
            title={
              showHistory
                ? translate('text_17574172258513wv8yozezoz')
                : (state.messages[0]?.message ?? translate('text_1783590769660p6nhcqws986'))
            }
            isBeta={shouldDisplayWelcomeMessage && !showHistory}
            showBackButton={!shouldDisplayWelcomeMessage || showHistory}
            onBackButton={onBackButton}
            showHistoryButton={
              agentHasHistory && shouldDisplayWelcomeMessage && !showHistory && hasAccessToAiAgent
            }
            onShowHistory={() => setShowHistory(true)}
            onFullscreen={() => onFullscreen()}
            isFullscreen={isFullscreen}
          >
            <div className="size-full max-w-5xl">
              {showHistory && (
                <ChatHistory
                  isFullscreen={isFullscreen}
                  hideHistory={() => setShowHistory(false)}
                />
              )}

              {!showHistory && (
                <PanelAiAgent isFullscreen={isFullscreen} hasAccessToAiAgent={hasAccessToAiAgent} />
              )}
            </div>
          </PanelWrapper>
        )}
      </Panel>
    </>
  )
}

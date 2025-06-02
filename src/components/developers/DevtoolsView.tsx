import { Button, Tooltip } from 'lago-design-system'
import { FC, useEffect, useRef, useState } from 'react'
import { ImperativePanelHandle, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { useLocation, useNavigate } from 'react-router-dom'

import { NavigationTab, TabManagedBy } from '~/components/designSystem'
import { devToolsNavigationMapping, DevtoolsRouter } from '~/components/developers/DevtoolsRouter'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DEVTOOL_TAB_PARAMS, useDeveloperTool } from '~/hooks/useDeveloperTool'
import { usePermissions } from '~/hooks/usePermissions'

const MAX_RESIZABLE_HEIGHT = 88
const MIN_RESIZABLE_HEIGHT = 20
const DEFAULT_RESIZABLE_HEIGHT = 40
const FULLSCREEN = 100

export const DevtoolsView: FC = () => {
  const { isOpen, close, setSize, url, setUrl } = useDeveloperTool()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { translate } = useInternationalization()
  const { pathname } = useLocation()
  const panel = useRef<ImperativePanelHandle>(null)
  const { hasPermissions } = usePermissions()

  const navigate = useNavigate()

  const expandPanel = () => {
    let isLocalFullscreen = false
    let height

    if (isFullscreen) {
      isLocalFullscreen = false
      height = DEFAULT_RESIZABLE_HEIGHT
    } else {
      isLocalFullscreen = true
      height = FULLSCREEN
    }
    setIsFullscreen(isLocalFullscreen)
    requestAnimationFrame(() => {
      panel.current?.resize(height)
    })
  }

  const closePanel = () => {
    setIsFullscreen(false)
    close()
  }

  const copyInspectorLink = () => {
    const windowUrl = new URL(window.location.href)
    const encodedPathname = encodeURIComponent(pathname)

    windowUrl.searchParams.set(DEVTOOL_TAB_PARAMS, encodedPathname)
    copyToClipboard(windowUrl.toString())
    addToast({
      severity: 'info',
      translateKey: 'text_1747726772472cm6yllhi7eh',
    })
  }

  // The following effect listens for changes to the devtools URL intent (set via setUrl in the context).
  // It must be placed here (inside DevtoolsView) because useNavigate must be called within the MemoryRouter context
  // that wraps the devtools panel.
  // Placing this logic in the useDeveloperTool hook would use the wrong router context (the main app's BrowserRouter),
  // causing navigation to happen in the wrong place or throw errors.
  useEffect(() => {
    if (url) {
      navigate(url)
      setUrl('')
    }
  }, [url, navigate, setUrl])

  if (!isOpen) return null

  return (
    <>
      <PanelResizeHandle
        className="relative z-[calc(theme(zIndex.console)+1)] h-0 before:absolute before:-top-px before:left-0 before:h-[2px] before:w-full before:bg-grey-300 before:opacity-0 before:transition-opacity data-[resize-handle-state=hover]:before:opacity-100 data-[resize-handle-state=pointer]:before:opacity-100"
        hitAreaMargins={{
          coarse: 15,
          fine: 10,
        }}
      >
        <div className="mx-auto h-2 w-20 translate-y-2 rounded-full bg-grey-300" />
      </PanelResizeHandle>
      <Panel
        id="devtools-panel"
        order={2}
        ref={panel}
        defaultSize={DEFAULT_RESIZABLE_HEIGHT}
        minSize={MIN_RESIZABLE_HEIGHT}
        maxSize={isFullscreen ? FULLSCREEN : MAX_RESIZABLE_HEIGHT}
        className="z-console min-h-50 bg-white shadow-[0_-6px_8px_0px_#19212E1F]"
        onResize={(size) => {
          setSize(size)

          if (size === FULLSCREEN) {
            setIsFullscreen(true)
          } else if (size < FULLSCREEN) {
            setIsFullscreen(false)
          }
        }}
      >
        <div className="relative size-full overflow-auto">
          <NavigationTab
            name="devtools"
            managedBy={TabManagedBy.URL}
            className="sticky top-0 z-navBar bg-white px-4"
            tabs={devToolsNavigationMapping(translate, hasPermissions)}
          >
            <Button
              startIcon="link"
              size="small"
              variant="quaternary"
              onClick={() => copyInspectorLink()}
            >
              {translate('text_17460208605597iyd249v26z')}
            </Button>
            <Tooltip
              title={translate(
                isFullscreen ? 'text_1746019984781u1ftea09d0b' : 'text_1746019984781hsxx9jjjska',
              )}
              placement="top"
            >
              <Button
                size="small"
                icon={isFullscreen ? 'resize-reduce' : 'resize-expand'}
                variant="quaternary"
                onClick={expandPanel}
              />
            </Tooltip>
            <Tooltip title={translate('text_62f50d26c989ab03196884ae')} placement="top">
              <Button size="small" icon="close" variant="quaternary" onClick={closePanel} />
            </Tooltip>
          </NavigationTab>
          <DevtoolsRouter />
        </div>
      </Panel>
    </>
  )
}

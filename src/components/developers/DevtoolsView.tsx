import { FC, useRef, useState } from 'react'
import { ImperativePanelHandle, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { useLocation } from 'react-router-dom'

import { Button, NavigationTab, TabManagedBy, Tooltip } from '~/components/designSystem'
import { devToolsNavigationMapping, DevtoolsRouter } from '~/components/developers/DevtoolsRouter'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DEVTOOL_TAB_PARAMS, useDeveloperTool } from '~/hooks/useDeveloperTool'
import { usePermissions } from '~/hooks/usePermissions'

const MAX_RESIZABLE_HEIGHT = 88
const MIN_RESIZABLE_HEIGHT = 20
const DEFAULT_RESIZABLE_HEIGHT = 40
const FULLSCREEN = 100

export const DevtoolsView: FC = () => {
  const { isOpen, close, setSize } = useDeveloperTool()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { translate } = useInternationalization()
  const { pathname } = useLocation()
  const panel = useRef<ImperativePanelHandle>(null)
  const { hasPermissions } = usePermissions()

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
    const url = new URL(window.location.href)
    const encodedPathname = encodeURIComponent(pathname)

    url.searchParams.set(DEVTOOL_TAB_PARAMS, encodedPathname)
    copyToClipboard(url.toString())
  }

  if (!isOpen) return null

  return (
    <>
      <PanelResizeHandle
        className="z-[calc(theme(zIndex.console)+1)] h-0"
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
            <div className="ml-auto flex items-center gap-3">
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
            </div>
          </NavigationTab>
          <DevtoolsRouter />
        </div>
      </Panel>
    </>
  )
}

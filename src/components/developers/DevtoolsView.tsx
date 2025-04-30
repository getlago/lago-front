import { FC, useRef, useState } from 'react'
import { ImperativePanelHandle, Panel, PanelResizeHandle } from 'react-resizable-panels'

import { Button, NavigationTab, TabManagedBy, Tooltip } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

const MAX_RESIZABLE_HEIGHT = 88
const MIN_RESIZABLE_HEIGHT = 20
const DEFAULT_RESIZABLE_HEIGHT = 40
const FULLSCREEN = 100

export const DevtoolsView: FC = () => {
  const { isOpen, close } = useDeveloperTool()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { translate } = useInternationalization()
  const panel = useRef<ImperativePanelHandle>(null)

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
        ref={panel}
        defaultSize={DEFAULT_RESIZABLE_HEIGHT}
        minSize={MIN_RESIZABLE_HEIGHT}
        maxSize={isFullscreen ? FULLSCREEN : MAX_RESIZABLE_HEIGHT}
        className="z-console bg-white shadow-[0_-6px_8px_0px_#19212E1F]"
        onResize={(size) => {
          if (size === FULLSCREEN) {
            setIsFullscreen(true)
          } else if (size < FULLSCREEN) {
            setIsFullscreen(false)
          }
        }}
      >
        <div className="relative w-full">
          <NavigationTab
            managedBy={TabManagedBy.INDEX}
            className="px-4"
            tabs={[
              {
                title: 'API keys & ID',
                component: <div>API keys & ID</div>,
              },
              {
                title: 'Webhooks',
                component: <div>Webhooks</div>,
              },
              {
                title: 'Events',
                component: <div>Events</div>,
              },
            ]}
          />
          <div className="absolute right-4 top-[14px] flex gap-3">
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
        </div>
      </Panel>
    </>
  )
}

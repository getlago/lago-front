import { AiBadge, Button, Icon } from 'lago-design-system'

import { AIPanelEnum, useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const NavigationBar = () => {
  const { togglePanel, currentPanelOpened } = useAiAgent()
  const { translate } = useInternationalization()

  const getCurrentPanelVariant = (panel: AIPanelEnum) =>
    currentPanelOpened === panel ? 'secondary' : 'quaternary'

  return (
    <div className="flex flex-row gap-2 p-2">
      <Button
        size="small"
        variant={getCurrentPanelVariant(AIPanelEnum.ai)}
        onClick={() => togglePanel(AIPanelEnum.ai)}
      >
        <div className="flex flex-row items-center gap-2">
          {currentPanelOpened === AIPanelEnum.ai ? (
            <Icon name="sparkles-base" size="small" color="primary" />
          ) : (
            <AiBadge />
          )}
          <div>{translate('text_175741722585199myqwj6vyw')}</div>
        </div>
      </Button>
    </div>
  )
}

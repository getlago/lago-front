import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { AGENT_TYPE_LABELS, AiAgentTypeEnum, useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

type PanelWrapperProps = {
  children: React.ReactNode
  title: string
  isBeta: boolean
  showAgentSelector?: boolean
  showBackButton?: boolean
  onBackButton?: () => void
  showHistoryButton?: boolean
  onShowHistory?: () => void
}

export const PanelWrapper = ({
  children,
  title,
  isBeta,
  showAgentSelector,
  showBackButton,
  onBackButton,
  showHistoryButton,
  onShowHistory,
}: PanelWrapperProps) => {
  const { agentType, closePanel, setAgentType } = useAiAgent()
  const { translate } = useInternationalization()
  const agentOptions = Object.values(AiAgentTypeEnum).map((value) => ({
    value,
    label: translate(AGENT_TYPE_LABELS[value]),
  }))
  const selectedAgentLabel = agentOptions.find((option) => option.value === agentType)?.label

  const titleElement = showAgentSelector ? (
    <Popper
      PopperProps={{
        placement: 'bottom-start',
        modifiers: [
          {
            name: 'offset',
            enabled: true,
            options: {
              offset: [-1, 8],
            },
          },
        ],
      }}
      opener={
        <Button className="px-0" variant="inline" endIcon="chevron-down">
          {selectedAgentLabel}
        </Button>
      }
    >
      {({ closePopper }) => (
        <MenuPopper className="-ml-1 w-50">
          {agentOptions.map((option) => (
            <Button
              align="left"
              key={option.value}
              variant={agentType === option.value ? 'secondary' : 'quaternary'}
              onClick={() => {
                setAgentType(option.value)
                closePopper()
              }}
            >
              {option.label}
            </Button>
          ))}
        </MenuPopper>
      )}
    </Popper>
  ) : (
    <Typography variant="bodyHl" className="!truncate" color="grey700">
      {title}
    </Typography>
  )

  return (
    <div>
      <div className="flex flex-row items-center justify-between gap-2 px-6 py-4 shadow-b">
        {!!showBackButton && (
          <Button size="medium" variant="quaternary" icon="arrow-left" onClick={onBackButton} />
        )}
        <div className="flex h-8 flex-1 items-center gap-2 truncate">
          {titleElement}
          {isBeta && (
            <Chip
              className="min-h-6 border-purple-200 bg-purple-100"
              color="infoMain"
              label={translate('text_65d8d71a640c5400917f8a13')}
            />
          )}
        </div>
        <div className="flex flex-row items-center gap-3">
          {showHistoryButton && (
            <Button size="medium" variant="quaternary" icon="history" onClick={onShowHistory} />
          )}
          <Button size="medium" variant="quaternary" icon="close" onClick={closePanel} />
        </div>
      </div>
      <div className="height-minus-nav flex flex-col justify-between overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

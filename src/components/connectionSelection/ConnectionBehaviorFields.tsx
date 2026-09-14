import { ReactNode, useState } from 'react'

import { Radio } from '~/components/form/Radio/Radio'
import { tw } from '~/styles/utils'

import {
  ConnectionBehavior,
  deriveConnectionBehavior,
  SelectedConnection,
  toConnectionChoice,
} from './types'

export const CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID = 'connection-behavior-fields-inherit-radio'
export const CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID = 'connection-behavior-fields-specific-radio'
export const CONNECTION_FIELDS_SKIP_RADIO_TEST_ID = 'connection-behavior-fields-skip-radio'

const TEST_ID_BY_BEHAVIOR: Record<ConnectionBehavior, string> = {
  [ConnectionBehavior.INHERIT]: CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID,
  [ConnectionBehavior.SPECIFIC]: CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID,
  [ConnectionBehavior.SKIP]: CONNECTION_FIELDS_SKIP_RADIO_TEST_ID,
}

const BEHAVIOR_ORDER: ConnectionBehavior[] = [
  ConnectionBehavior.INHERIT,
  ConnectionBehavior.SPECIFIC,
  ConnectionBehavior.SKIP,
]

interface ConnectionBehaviorOptionLabels {
  label: string
  sublabel?: string
}

interface ConnectionBehaviorFieldsProps {
  name: string
  labels: Record<ConnectionBehavior, ConnectionBehaviorOptionLabels>
  value?: SelectedConnection
  onChange: (value: SelectedConnection) => void
  /** Rendered under the option's label, for the badges the category attaches to a behavior */
  renderBadge?: (behavior: ConnectionBehavior) => ReactNode
  /** Rendered inside the selected option's card, under the label block */
  renderSelectedContent?: (props: {
    behavior: ConnectionBehavior
    code: string
    onCodeChange: (code: string) => void
  }) => ReactNode
}

export const ConnectionBehaviorFields = ({
  name,
  labels,
  value,
  onChange,
  renderBadge,
  renderSelectedContent,
}: ConnectionBehaviorFieldsProps) => {
  const [behavior, setBehavior] = useState<ConnectionBehavior>(() =>
    deriveConnectionBehavior(value),
  )
  const [code, setCode] = useState<string>(() => value?.code || '')

  const handleBehaviorChange = (next: ConnectionBehavior): void => {
    setBehavior(next)
    onChange(toConnectionChoice(next, code))
  }

  const handleCodeChange = (nextCode: string): void => {
    setCode(nextCode)
    onChange(toConnectionChoice(ConnectionBehavior.SPECIFIC, nextCode))
  }

  const renderOption = (optionBehavior: ConnectionBehavior) => {
    const isSelected = behavior === optionBehavior
    const badge = renderBadge?.(optionBehavior)
    const selectedContent = isSelected
      ? renderSelectedContent?.({
          behavior: optionBehavior,
          code,
          onCodeChange: handleCodeChange,
        })
      : null

    return (
      <div
        key={optionBehavior}
        className={tw(
          'flex flex-col gap-4 rounded-xl border bg-white p-4',
          isSelected ? 'border-blue-600' : 'border-grey-400',
        )}
        data-test={TEST_ID_BY_BEHAVIOR[optionBehavior]}
      >
        <div className="flex flex-col gap-2">
          <Radio
            name={name}
            value={optionBehavior}
            checked={isSelected}
            onChange={(next) => handleBehaviorChange(next as ConnectionBehavior)}
            label={labels[optionBehavior].label}
            sublabel={labels[optionBehavior].sublabel}
            labelVariant="body"
          />
          {!!badge && <div className="ml-9">{badge}</div>}
        </div>

        {!!selectedContent && <div className="ml-9">{selectedContent}</div>}
      </div>
    )
  }

  return <div className="flex flex-col gap-4">{BEHAVIOR_ORDER.map(renderOption)}</div>
}

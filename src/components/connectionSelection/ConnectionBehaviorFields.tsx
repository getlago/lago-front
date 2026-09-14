import { ReactNode, useState } from 'react'

import { Radio } from '~/components/form/Radio/Radio'

import {
  ConnectionBehavior,
  deriveConnectionBehavior,
  SelectedConnection,
  toConnectionChoice,
} from './types'

export const CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID = 'connection-behavior-fields-inherit-radio'
export const CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID = 'connection-behavior-fields-specific-radio'
export const CONNECTION_FIELDS_SKIP_RADIO_TEST_ID = 'connection-behavior-fields-skip-radio'

interface ConnectionBehaviorOptionLabels {
  label: string
  sublabel: string
}

interface ConnectionBehaviorFieldsProps {
  name: string
  labels: Record<ConnectionBehavior, ConnectionBehaviorOptionLabels>
  value?: SelectedConnection
  onChange: (value: SelectedConnection) => void
  renderSpecific: (props: { value: string; onChange: (code: string) => void }) => ReactNode
}

export const ConnectionBehaviorFields = ({
  name,
  labels,
  value,
  onChange,
  renderSpecific,
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

  return (
    <div className="flex flex-col gap-4">
      <div data-test={CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID}>
        <Radio
          name={name}
          value={ConnectionBehavior.INHERIT}
          checked={behavior === ConnectionBehavior.INHERIT}
          onChange={(next) => handleBehaviorChange(next as ConnectionBehavior)}
          label={labels[ConnectionBehavior.INHERIT].label}
          sublabel={labels[ConnectionBehavior.INHERIT].sublabel}
          labelVariant="body"
        />
      </div>

      <div data-test={CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID}>
        <Radio
          name={name}
          value={ConnectionBehavior.SPECIFIC}
          checked={behavior === ConnectionBehavior.SPECIFIC}
          onChange={(next) => handleBehaviorChange(next as ConnectionBehavior)}
          label={labels[ConnectionBehavior.SPECIFIC].label}
          sublabel={labels[ConnectionBehavior.SPECIFIC].sublabel}
          labelVariant="body"
        />
        {behavior === ConnectionBehavior.SPECIFIC && (
          <div className="ml-9 mt-4">
            {renderSpecific({ value: code, onChange: handleCodeChange })}
          </div>
        )}
      </div>

      <div data-test={CONNECTION_FIELDS_SKIP_RADIO_TEST_ID}>
        <Radio
          name={name}
          value={ConnectionBehavior.SKIP}
          checked={behavior === ConnectionBehavior.SKIP}
          onChange={(next) => handleBehaviorChange(next as ConnectionBehavior)}
          label={labels[ConnectionBehavior.SKIP].label}
          sublabel={labels[ConnectionBehavior.SKIP].sublabel}
          labelVariant="body"
        />
      </div>
    </div>
  )
}

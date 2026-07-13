import { MutableRefObject, useState } from 'react'

import { Switch } from '~/components/form/Switch/Switch'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CREATE_MORE_SWITCH_TEST_ID = 'create-more-switch'

// Rendered in the FormDrawer footer's left slot (`secondaryAction`). The drawer
// captures the node once at open time, so the toggle owns its visual state
// locally and reports the live value through `valueRef` (read at submit time,
// never stale). FormDrawer fully unmounts on close, so every open remounts this
// control fresh = OFF.
export const CreateMoreControl = ({ valueRef }: { valueRef: MutableRefObject<boolean> }) => {
  const { translate } = useInternationalization()
  const [isChecked, setIsChecked] = useState(false)

  return (
    <Switch
      name="create-more"
      checked={isChecked}
      label={translate('text_1783627031283dglreh36w9d')}
      labelPosition="right"
      data-test={CREATE_MORE_SWITCH_TEST_ID}
      onChange={(value) => {
        setIsChecked(value)
        valueRef.current = value
      }}
    />
  )
}

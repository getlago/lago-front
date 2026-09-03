import { useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'

import { clearExistingCodeError } from '~/core/form/existingCodeError'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import type { CustomerConnectionDrawerFormApi } from './CustomerConnectionDrawer'

export const CONNECTION_CODE_FIELD_TEST_ID = 'connection-code-field'

type ConnectionCodeFieldProps = {
  form: CustomerConnectionDrawerFormApi
}

export const ConnectionCodeField = ({ form }: ConnectionCodeFieldProps) => {
  const { translate } = useInternationalization()

  const providerCode = useStore(form.store, (state) => state.values.providerCode)
  const code = useStore(form.store, (state) => state.values.code)
  const openedRef = useRef({ providerCode, code })

  // The seed writes without touching the meta: that is what tells it apart
  // from a code the user typed.
  useEffect(() => {
    if (!providerCode) return
    if (form.getFieldMeta('code')?.isDirty) return

    const opened = openedRef.current
    const nextCode =
      providerCode === opened.providerCode ? opened.code || providerCode : providerCode

    if (nextCode === code) return

    form.setFieldValue('code', nextCode, { dontUpdateMeta: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerCode])

  return (
    <form.AppField name="code" listeners={{ onChange: () => clearExistingCodeError(form) }}>
      {(field) => (
        <field.TextInputField
          data-test={CONNECTION_CODE_FIELD_TEST_ID}
          label={translate('text_629728388c4d2300e2d380b7')}
          placeholder={translate('text_1788433814031zeagk490c7a')}
          beforeChangeFormatter="code"
        />
      )}
    </form.AppField>
  )
}

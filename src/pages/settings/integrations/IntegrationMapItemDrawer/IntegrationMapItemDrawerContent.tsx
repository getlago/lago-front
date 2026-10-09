import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DEFAULT_MAPPING_KEY } from '~/pages/settings/integrations/common'

import { IntegrationMapItemDrawerContentProps } from './types'

const FIELD_NAMES_SEPARATOR = '\n'

export const IntegrationMapItemDrawerContent = ({
  title,
  description,
  billingEntities,
  form,
  formId,
  renderForm,
}: IntegrationMapItemDrawerContentProps): JSX.Element => {
  const { translate } = useInternationalization()

  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts)
  const fieldsWithErrorSignature = useStore(form.store, (state) =>
    Object.entries(state.errorMap.onDynamic ?? {})
      .filter(([, error]) => !!error)
      .map(([fieldName]) => fieldName)
      .join(FIELD_NAMES_SEPARATOR),
  )
  const handledSubmissionAttemptsRef = useRef(submissionAttempts)
  const shouldScrollToErrorRef = useRef(false)

  const handleTabClick = (_event: React.SyntheticEvent<Element, Event>, newValue: number) =>
    setSelectedTabIndex(newValue)

  const billingEntitiesWithoutDefault = useMemo(() => {
    return billingEntities.filter((be) => be.id !== null)
  }, [billingEntities])

  useEffect(() => {
    if (submissionAttempts === handledSubmissionAttemptsRef.current || !fieldsWithErrorSignature) {
      return
    }

    handledSubmissionAttemptsRef.current = submissionAttempts

    const fieldsWithError = fieldsWithErrorSignature.split(FIELD_NAMES_SEPARATOR)
    const hasError = (billingEntityKey: string): boolean =>
      fieldsWithError.some((fieldName) => fieldName.startsWith(`${billingEntityKey}.`))

    const selectedKey = billingEntitiesWithoutDefault[selectedTabIndex]?.key

    if (hasError(DEFAULT_MAPPING_KEY) || (selectedKey && hasError(selectedKey))) return

    const firstInvalidTabIndex = billingEntitiesWithoutDefault.findIndex((billingEntity) =>
      hasError(billingEntity.key),
    )

    if (firstInvalidTabIndex === -1) return

    shouldScrollToErrorRef.current = true
    setSelectedTabIndex(firstInvalidTabIndex)
  }, [
    billingEntitiesWithoutDefault,
    fieldsWithErrorSignature,
    selectedTabIndex,
    submissionAttempts,
  ])

  useEffect(() => {
    if (!form.state.submissionAttempts) return

    void form.validate('change')

    if (!shouldScrollToErrorRef.current) return

    shouldScrollToErrorRef.current = false
    scrollToFirstInputError(formId, form.state.errorMap.onDynamic ?? {})
  }, [form, formId, selectedTabIndex])

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-1">
        <Typography variant="headline">{title}</Typography>
        <Typography>{description}</Typography>
      </div>
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Typography variant="subhead1">{translate('text_6630e3210c13c500cd398e97')}</Typography>
          <Typography variant="caption">{translate('text_1762159805730gne2kxieeqo')}</Typography>
        </div>
        {renderForm(DEFAULT_MAPPING_KEY)}
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Typography variant="subhead1">{translate('text_1762159805730r5zfutgdloi')}</Typography>
          <Typography variant="caption">{translate('text_1762159805730hqzi614r672')}</Typography>
        </div>
        <div className="flex flex-row shadow-b">
          <Tabs
            className="min-h-13 w-full flex-1 items-center overflow-visible"
            variant="scrollable"
            role="navigation"
            scrollButtons="auto"
            value={selectedTabIndex}
            onChange={handleTabClick}
          >
            {billingEntitiesWithoutDefault.map((billingEntity, index) => (
              <Tab
                key={`tab-${billingEntity.id || DEFAULT_MAPPING_KEY}`}
                disableFocusRipple
                disableRipple
                role="tab"
                className="relative my-2 h-9 justify-between gap-1 overflow-visible rounded-xl p-2 text-grey-600 no-underline [min-height:unset] [min-width:unset] first:-ml-2 last:-mr-2 hover:bg-grey-100 hover:text-grey-700"
                label={
                  <Typography variant="captionHl" color="inherit">
                    {billingEntity.name}
                  </Typography>
                }
                value={index}
                id={`simple-tab-${index}`}
                aria-controls={`simple-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </div>
        {billingEntitiesWithoutDefault.map((billingEntity, index) => {
          const isSelected = selectedTabIndex === index

          if (!isSelected) return null

          return (
            <div
              key={`tabpanel-${billingEntity.id || DEFAULT_MAPPING_KEY}`}
              role="tabpanel"
              hidden={!isSelected}
              id={`simple-tabpanel-${index}`}
              aria-labelledby={`simple-tab-${index}`}
              className="w-full"
            >
              {renderForm(billingEntity.key || DEFAULT_MAPPING_KEY)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

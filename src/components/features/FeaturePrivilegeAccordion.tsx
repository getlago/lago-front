import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { useId, useMemo, useState } from 'react'

import { Accordion } from '~/components/designSystem/Accordion'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { MultipleComboBox } from '~/components/form'
import {
  getPrivilegeValueTypeTranslationKey,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_PRIVILEGE_SELECT_OPTIONS_INPUT_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import { PrivilegeValueTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { emptyFeatureDefaultValues } from '~/pages/features/featureForm/validationSchema'

gql`
  fragment FeaturePrivilegeAccordion on PrivilegeObject {
    id
    code
    name
    valueType
    config {
      selectOptions
    }
  }
`

export const FEATURE_PRIVILEGE_NAME_INPUT_TEST_ID = 'feature-privilege-name-input'
export const FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID = 'feature-privilege-code-input'
export const FEATURE_PRIVILEGE_DELETE_BUTTON_TEST_ID = 'feature-privilege-delete-button'
export const FEATURE_PRIVILEGE_ADD_OPTION_BUTTON_TEST_ID = 'feature-privilege-add-option-button'
export const FEATURE_PRIVILEGE_HIDE_OPTIONS_BUTTON_TEST_ID = 'feature-privilege-hide-options-button'

type FeaturePrivilegeAccordionProps = {
  id: string
  isEdition: boolean
  privilegeIndex: number
  initialSelectOptions: Array<string>
}

const defaultProps: FeaturePrivilegeAccordionProps = {
  id: '',
  isEdition: false,
  privilegeIndex: 0,
  initialSelectOptions: [],
}

export const FeaturePrivilegeAccordion = withForm({
  defaultValues: emptyFeatureDefaultValues,
  props: defaultProps,
  render: function Render({ form, id, isEdition, privilegeIndex, initialSelectOptions }) {
    const componentId = useId()
    const { translate } = useInternationalization()

    const privilege = useStore(form.store, (state) => state.values.privileges[privilegeIndex])

    const [showSelectOptionsInput, setShowSelectOptionsInput] = useState(false)

    const currentSearchClassName = useMemo(() => {
      // Replace all colons with dashes to make the class name valid for querySelector
      const usableComponentId = componentId.replace(/:/g, '-')

      return `${SEARCH_PRIVILEGE_SELECT_OPTIONS_INPUT_CLASSNAME}-${usableComponentId}`
    }, [componentId])

    const isPersisted = isEdition && !!privilege?.id
    const selectOptions = privilege?.config?.selectOptions

    const privilegeName = useMemo(() => {
      if (privilege?.name) return privilege.name
      if (privilege?.id) return '-'
      return translate('text_1752695518075tkwsxrwmwxh', {
        index: privilegeIndex + 1,
      })
    }, [privilege?.name, privilege?.id, privilegeIndex, translate])

    return (
      <Accordion
        id={id}
        initiallyOpen={!privilege?.code}
        summary={
          <div className="flex w-full items-center justify-between gap-3 overflow-hidden">
            <div className="flex flex-col">
              <Typography variant="bodyHl" color="grey700">
                {privilegeName}
              </Typography>
              <Typography variant="caption" color="grey600">
                {privilege?.code ||
                  translate('text_1752697009139hdybjlkx3w6', {
                    index: privilegeIndex + 1,
                  })}
              </Typography>
            </div>

            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                data-test={FEATURE_PRIVILEGE_DELETE_BUTTON_TEST_ID}
                onClick={(e) => {
                  e.stopPropagation()

                  form.removeFieldValue('privileges', privilegeIndex)
                }}
              />
            </Tooltip>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex gap-6">
            <form.AppField name={`privileges[${privilegeIndex}].name`}>
              {(field) => (
                <field.TextInputField
                  className="flex-1"
                  data-test={FEATURE_PRIVILEGE_NAME_INPUT_TEST_ID}
                  label={translate('text_1753122279978r7koj4iy2vy')}
                  placeholder={translate('text_645bb193927b375079d28ace')}
                />
              )}
            </form.AppField>
            <form.AppField name={`privileges[${privilegeIndex}].code`}>
              {(field) => (
                <field.TextInputField
                  className="flex-1"
                  beforeChangeFormatter="code"
                  data-test={FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID}
                  disabled={isPersisted}
                  label={translate('text_1752845254936jdsefrsvmam')}
                  placeholder={translate('text_645bb193927b375079d28b02')}
                />
              )}
            </form.AppField>
          </div>

          <form.AppField
            name={`privileges[${privilegeIndex}].valueType`}
            listeners={{
              onChange: ({ value }) => {
                if (value !== PrivilegeValueTypeEnum.Select) return

                setShowSelectOptionsInput(true)

                setTimeout(() => {
                  const element = document.querySelector(
                    `.${currentSearchClassName} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                  ) as HTMLElement

                  if (!element) return

                  element.scrollBy({ top: 300, behavior: 'smooth' })
                  element.click()
                }, 0)
              },
            }}
          >
            {(field) => (
              <field.ButtonSelectorField
                disabled={isPersisted}
                label={translate('text_175287350361170qk4c93fmm')}
                description={translate('text_17528462240740oes60zeoas')}
                options={[
                  {
                    label: translate(
                      getPrivilegeValueTypeTranslationKey[PrivilegeValueTypeEnum.Boolean],
                    ),
                    value: PrivilegeValueTypeEnum.Boolean,
                  },
                  {
                    label: translate(
                      getPrivilegeValueTypeTranslationKey[PrivilegeValueTypeEnum.Integer],
                    ),
                    value: PrivilegeValueTypeEnum.Integer,
                  },
                  {
                    label: translate(
                      getPrivilegeValueTypeTranslationKey[PrivilegeValueTypeEnum.String],
                    ),
                    value: PrivilegeValueTypeEnum.String,
                  },
                  {
                    label: translate(
                      getPrivilegeValueTypeTranslationKey[PrivilegeValueTypeEnum.Select],
                    ),
                    value: PrivilegeValueTypeEnum.Select,
                  },
                ]}
              />
            )}
          </form.AppField>

          {privilege?.valueType === PrivilegeValueTypeEnum.Select && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="grey700">
                  {translate('text_1752862804124q8fjgwp3ep9')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_1752862804124sm9d1gl8aha')}
                </Typography>
              </div>

              {!!selectOptions?.length && (
                <div className="flex flex-wrap gap-2">
                  {selectOptions.map((selectOption, selectOptionIndex) => (
                    <Chip
                      key={`privilege-${privilegeIndex}-option-${selectOptionIndex}`}
                      label={selectOption}
                      onDelete={
                        isPersisted && initialSelectOptions.includes(selectOption)
                          ? undefined
                          : () =>
                              form.setFieldValue(
                                `privileges[${privilegeIndex}].config.selectOptions`,
                                selectOptions.filter((_, index) => index !== selectOptionIndex),
                              )
                      }
                    />
                  ))}
                </div>
              )}

              {showSelectOptionsInput ? (
                <div className="flex gap-3">
                  <form.AppField name={`privileges[${privilegeIndex}].config.selectOptions`}>
                    {(field) => (
                      <MultipleComboBox
                        freeSolo
                        hideTags
                        disableClearable
                        disableCloseOnSelect
                        className={tw('w-full', currentSearchClassName)}
                        name={field.name}
                        placeholder={translate('text_1752863499298r6x9j41ndoy')}
                        data={[]}
                        value={(field.state.value || []).map((selectOption) => ({
                          value: selectOption,
                        }))}
                        onChange={(newValue) => {
                          field.handleChange(
                            newValue?.map((item) => item.value.trim()).filter((item) => !!item) ||
                              [],
                          )
                        }}
                      />
                    )}
                  </form.AppField>

                  <Tooltip
                    className="mt-1"
                    placement="top-end"
                    title={translate('text_63aa085d28b8510cd46443ff')}
                  >
                    <Button
                      icon="trash"
                      variant="quaternary"
                      data-test={FEATURE_PRIVILEGE_HIDE_OPTIONS_BUTTON_TEST_ID}
                      onClick={() => {
                        setShowSelectOptionsInput(false)
                      }}
                    />
                  </Tooltip>
                </div>
              ) : (
                <Button
                  fitContent
                  startIcon="plus"
                  variant="inline"
                  data-test={FEATURE_PRIVILEGE_ADD_OPTION_BUTTON_TEST_ID}
                  onClick={() => {
                    setShowSelectOptionsInput(true)

                    scrollToAndClickElement({
                      selector: `.${currentSearchClassName} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                    })
                  }}
                >
                  {translate('text_6661fc17337de3591e29e427')}
                </Button>
              )}
            </div>
          )}
        </div>
      </Accordion>
    )
  },
})

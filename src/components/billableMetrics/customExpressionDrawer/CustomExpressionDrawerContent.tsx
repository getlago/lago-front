import { Icon } from 'lago-design-system'
import { useEffect, useState } from 'react'

import { ValidationResult } from '~/components/billableMetrics/utils'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { SetValidationResultRef } from './CustomExpressionDrawerActions'
import { CUSTOM_EXPRESSION_DEFAULT_VALUES } from './validationSchema'

export const CUSTOM_EXPRESSION_VALIDATION_ERROR_TEST_ID = 'custom-expression-drawer-error'

const CUSTOM_EXPRESSION_EXAMPLES = [
  'event.properties.tokens * event.properties.replicas',
  "concat(event.properties.user_id, '-' , event.properties.app_id)",
  '(event.properties.ended_at - event.timestamp) / 3600',
]

type CustomExpressionDrawerContentProps = {
  isEditable: boolean
  setValidationResultRef: SetValidationResultRef
}

const defaultProps: CustomExpressionDrawerContentProps = {
  isEditable: false,
  setValidationResultRef: { current: () => {} },
}

export const CustomExpressionDrawerContent = withForm({
  defaultValues: CUSTOM_EXPRESSION_DEFAULT_VALUES,
  props: defaultProps,
  render: function CustomExpressionDrawerContentRender({
    form,
    isEditable,
    setValidationResultRef,
  }) {
    const { translate } = useInternationalization()
    const [validationResult, setValidationResult] = useState<ValidationResult>()

    useEffect(() => {
      setValidationResultRef.current = setValidationResult
    }, [setValidationResultRef])

    const renderValidationResult = () => {
      if (validationResult?.error) {
        return (
          <div
            className="flex items-center gap-2"
            data-test={CUSTOM_EXPRESSION_VALIDATION_ERROR_TEST_ID}
          >
            <Icon name="warning-filled" color="warning" />

            <Typography variant="subhead1" color="grey600">
              {validationResult.error}
            </Typography>
          </div>
        )
      }

      if (!validationResult?.result) {
        return (
          <Typography variant="subhead2" color="grey500">
            {translate('text_17297736554178ifm0gd8093')}
          </Typography>
        )
      }

      return (
        <Typography variant="subhead2" color="grey700">
          {validationResult.result}
        </Typography>
      )
    }

    return (
      <div>
        <div className="mb-12">
          <Typography variant="headline" color="grey700" className="mb-1">
            {translate('text_1729771640162lug0w6ztlyr')}
          </Typography>

          <Typography variant="subhead2" color="grey600">
            {translate('text_1729771640162z7ndqn1ju9h')}
          </Typography>
        </div>

        <Typography variant="subhead1" color="grey700" className="mb-6">
          {translate('text_1729771640162c0o1estqusi')}
        </Typography>

        <div className="mb-12 pb-12 shadow-b">
          <form.AppField name="expression">
            {(field) => (
              <field.JsonEditorField
                disabled={!isEditable}
                label={translate('text_17297736554164pkbpqi0ke8')}
                editorMode="text"
                customInvalidError={translate('text_1729864793151rrlucly2t6d')}
                showHelperOnError={true}
                placeholder={translate('text_1729771640162kaf49b93e20') + '\n'}
                helperText={
                  <div className="mt-1">
                    <Typography variant="body" color="grey600">
                      {translate('text_1729773655417n5w5fu02lbm')}
                    </Typography>

                    <div className="mt-1 flex flex-col items-start gap-1">
                      {CUSTOM_EXPRESSION_EXAMPLES.map((example, index) => (
                        <Chip
                          key={`ce-drawer-${index}`}
                          className="!px-2 !py-0.5"
                          size="small"
                          variant="captionCode"
                          color="grey600"
                          label={example}
                        />
                      ))}
                    </div>
                  </div>
                }
              />
            )}
          </form.AppField>
        </div>

        <div className="mb-6">
          <Typography variant="subhead1" color="grey700" className="mb-2">
            {translate('text_1729773655417vo5dm6vqzpu')}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_1729773655417khuj828ti9j')}
          </Typography>
        </div>

        <form.AppField name="eventPayload">
          {(field) => (
            <field.JsonEditorField
              height="300px"
              label={translate('text_1729773655417k0y7nxt5c5j')}
              customInvalidError={translate('text_6638a3538de76801ac2f451b')}
              placeholder={translate('text_17297753616921jc1iyf6mke')}
            />
          )}
        </form.AppField>

        <div className="mt-6">
          <Typography variant="body" color="grey600" className="mb-1">
            {translate('text_1729773655417b4y4j7oatnq')}
          </Typography>

          {renderValidationResult()}
        </div>
      </div>
    )
  },
})

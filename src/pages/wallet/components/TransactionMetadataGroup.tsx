import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { ADD_METADATA_DATA_TEST } from '~/components/wallets/utils/dataTestConstants'
import {
  METADATA_VALUE_MAX_LENGTH_DEFAULT,
  MetadataErrorsEnum,
} from '~/formValidation/metadataSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

type TransactionMetadataGroupValues = {
  metadata: Array<{ key: string; value: string }> | null | undefined
}

const defaultValues: TransactionMetadataGroupValues = {
  metadata: undefined,
}

/**
 * Shared transaction-metadata key/value rows — mounted by both the wallet
 * recurring top-up section and the top-up page via the `fields` mapping,
 * e.g. `fields={{ metadata: 'recurringTransactionRules[0].transactionMetadata' }}`.
 */
export const TransactionMetadataGroup = withFieldGroup({
  defaultValues,
  props: {},
  render: function Render({ group }) {
    const { translate } = useInternationalization()

    return (
      <group.AppField name="metadata" mode="array">
        {(metadataField) => (
          <>
            {(metadataField.state.value ?? []).map((_metadata, index) => {
              return (
                <div
                  className="flex w-full flex-row items-center gap-3"
                  key={`metadata-item-${index}`}
                >
                  <div className="basis-[200px]">
                    <group.AppField name={`metadata[${index}].key`}>
                      {(field) => {
                        const keyError = (
                          field.state.meta.errors as unknown as { message?: string }[]
                        ).find((error) =>
                          Object.keys(MetadataErrorsEnum).includes(error?.message ?? ''),
                        )?.message

                        return (
                          <Tooltip
                            placement="top-end"
                            title={
                              (keyError === MetadataErrorsEnum.uniqueness &&
                                translate('text_63fcc3218d35b9377840f5dd')) ||
                              (keyError === MetadataErrorsEnum.maxLength &&
                                translate('text_63fcc3218d35b9377840f5d9', { max: 20 }))
                            }
                            disableHoverListener={!keyError}
                          >
                            <field.TextInputField
                              label={translate('text_63fcc3218d35b9377840f5a3')}
                              silentError={!keyError}
                              placeholder={translate('text_63fcc3218d35b9377840f5a7')}
                              displayErrorText={false}
                            />
                          </Tooltip>
                        )
                      }}
                    </group.AppField>
                  </div>
                  <div className="grow">
                    <group.AppField name={`metadata[${index}].value`}>
                      {(field) => {
                        const valueError = (
                          field.state.meta.errors as unknown as { message?: string }[]
                        ).find((error) =>
                          Object.keys(MetadataErrorsEnum).includes(error?.message ?? ''),
                        )?.message

                        return (
                          <Tooltip
                            placement="top-end"
                            title={
                              valueError === MetadataErrorsEnum.maxLength
                                ? translate('text_63fcc3218d35b9377840f5e5', {
                                    max: METADATA_VALUE_MAX_LENGTH_DEFAULT,
                                  })
                                : undefined
                            }
                            disableHoverListener={!valueError}
                          >
                            <field.TextInputField
                              label={translate('text_63fcc3218d35b9377840f5ab')}
                              silentError={!valueError}
                              placeholder={translate('text_63fcc3218d35b9377840f5af')}
                              displayErrorText={false}
                            />
                          </Tooltip>
                        )
                      }}
                    </group.AppField>
                  </div>
                  <Tooltip
                    className="flex items-center"
                    placement="top-end"
                    title={translate('text_63fcc3218d35b9377840f5e1')}
                  >
                    <Button
                      className="mt-7"
                      variant="quaternary"
                      size="medium"
                      icon="trash"
                      onClick={() => {
                        // whole-array set: the base array can start undefined
                        group.setFieldValue(
                          'metadata',
                          (metadataField.state.value ?? []).filter((_, i) => i !== index),
                        )
                      }}
                    />
                  </Tooltip>
                </div>
              )
            })}

            <Button
              className="self-start"
              startIcon="plus"
              variant="inline"
              onClick={() =>
                group.setFieldValue('metadata', [
                  ...(metadataField.state.value ?? []),
                  { key: '', value: '' },
                ])
              }
              data-test={ADD_METADATA_DATA_TEST}
            >
              {translate('text_63fcc3218d35b9377840f5bb')}
            </Button>
          </>
        )}
      </group.AppField>
    )
  },
})

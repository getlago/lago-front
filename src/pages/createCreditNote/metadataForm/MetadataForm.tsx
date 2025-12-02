import { FormikProps } from 'formik'

import { Button, Tooltip, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type SupportedFormFormat = {
  metadata?: Array<{
    key: string
    value: string
    localId?: string
  }>
}

export type MetadataFormProps<T extends SupportedFormFormat = SupportedFormFormat> = {
  formikProps: FormikProps<T>
  maxMetadataCount?: number
}

const MAX_METADATA_COUNT = 10

const MetadataForm = <T extends SupportedFormFormat>({
  formikProps,
  maxMetadataCount = MAX_METADATA_COUNT,
}: MetadataFormProps<T>) => {
  const { translate } = useInternationalization()

  const removeMetadata = (index: number) => {
    const newMetadata = (formikProps.values.metadata || []).filter((_metadata, j) => {
      return j !== index
    })

    formikProps.setFieldValue('metadata', newMetadata)
  }

  const addMetadata = () => {
    formikProps.setFieldValue('metadata', [
      ...(formikProps.values.metadata || []),
      {
        key: '',
        value: '',
        localId: Date.now().toString(),
      },
    ])
  }

  const gridClassName = 'grid grid-cols-[200px_1fr_24px] gap-x-3 '

  return (
    <>
      {!!formikProps?.values?.metadata?.length && (
        <div className="flex flex-col gap-y-6">
          {formikProps?.values?.metadata?.map((metadata, index) => {
            return (
              <div className="flex flex-col gap-y-1" key={`metadata-${metadata.localId || index}`}>
                <div className={gridClassName}>
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_63fcc3218d35b9377840f5a3')}
                  </Typography>
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_63fcc3218d35b9377840f5ab')}
                  </Typography>
                </div>

                <div className={gridClassName}>
                  <TextInputField
                    name={`metadata.${index}.key`}
                    placeholder={translate('text_63fcc3218d35b9377840f5a7')}
                    formikProps={formikProps}
                  />
                  <TextInputField
                    name={`metadata.${index}.value`}
                    placeholder={translate('text_63fcc3218d35b9377840f5af')}
                    formikProps={formikProps}
                  />
                  <Tooltip
                    className="flex items-center"
                    placement="top-end"
                    title={translate('text_63fcc3218d35b9377840f5e1')}
                  >
                    <Button
                      variant="quaternary"
                      size="small"
                      icon="trash"
                      onClick={() => removeMetadata(index)}
                    />
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div>
        <Button
          startIcon="plus"
          variant="inline"
          disabled={(formikProps?.values?.metadata?.length || 0) >= maxMetadataCount}
          onClick={() => addMetadata()}
          data-test="add-metadata-button"
        >
          {translate('text_63fcc3218d35b9377840f5bb')}
        </Button>
      </div>
    </>
  )
}

export default MetadataForm

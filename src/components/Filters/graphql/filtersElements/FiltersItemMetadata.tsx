import { useStore } from '@tanstack/react-form'
import { useEffect } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { formatMetadataFilter, parseMetadataFilter } from '~/components/Filters/graphql/utils'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

type FiltersItemMetadataProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

const MAX_METADATA_COUNT = 5

export const FiltersItemMetadata = ({ value = '', setFilterValue }: FiltersItemMetadataProps) => {
  const { translate } = useInternationalization()

  const initialMetadata = parseMetadataFilter(value)

  const form = useAppForm({
    defaultValues: {
      metadata: initialMetadata.length ? initialMetadata : [{ key: '', value: '' }],
    },
  })

  const metadata = useStore(form.store, (state) => state.values.metadata)

  useEffect(() => {
    setFilterValue(formatMetadataFilter(metadata))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata])

  return (
    <div className="flex flex-col gap-4">
      {metadata.map((_metadata, i) => (
        <div
          className="grid grid-cols-[minmax(30px,max-content)_1fr_minmax(5px,max-content)_1fr_24px] items-center gap-2 lg:gap-3"
          key={i}
        >
          {i === 0 ? (
            <Typography variant="body" color="grey700">
              {translate('text_66ab42d4ece7e6b7078993d0')}
            </Typography>
          ) : (
            <Typography variant="body" color="grey700">
              {translate('text_65f8472df7593301061e27d6').toLowerCase()}
            </Typography>
          )}
          <form.AppField name={`metadata[${i}].key`}>
            {(field) => (
              <field.TextInputField placeholder={translate('text_63fcc3218d35b9377840f5a7')} />
            )}
          </form.AppField>
          <Typography className="text-grey-700">=</Typography>
          <form.AppField name={`metadata[${i}].value`}>
            {(field) => (
              <field.TextInputField placeholder={translate('text_63fcc3218d35b9377840f5af')} />
            )}
          </form.AppField>
          <Button
            icon="trash"
            variant="quaternary"
            size="small"
            disabled={i === 0 && metadata.length === 1}
            onClick={() =>
              form.setFieldValue(
                'metadata',
                metadata.filter((_, index) => index !== i),
              )
            }
          />
        </div>
      ))}
      <Button
        startIcon="plus"
        variant="inline"
        fitContent
        disabled={metadata.length >= MAX_METADATA_COUNT}
        onClick={() => form.setFieldValue('metadata', [...metadata, { key: '', value: '' }])}
        data-test="add-metadata-button"
      >
        {translate('text_63fcc3218d35b9377840f5bb')}
      </Button>
    </div>
  )
}

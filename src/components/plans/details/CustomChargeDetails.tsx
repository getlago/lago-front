import { JsonEditor } from '~/components/form'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type CustomChargeDetailsProps = {
  customProperties: string | Record<string, unknown> | null | undefined
}

export const CustomChargeDetails = ({
  customProperties,
}: CustomChargeDetailsProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <DetailsPage.TableDisplay
      name="custom"
      className="[&_tbody_td]:p-0"
      header={[translate('text_663dea5702b60301d8d06502')]}
      body={[
        [
          <JsonEditor
            key="custom-json-editor"
            label={translate('text_663dea5702b60301d8d06502')}
            value={customProperties ?? undefined}
            hideLabel
            readOnly
          />,
        ],
      ]}
    />
  )
}

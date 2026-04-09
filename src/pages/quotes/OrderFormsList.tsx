import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'

const OrderFormsList = () => {
  const { translate } = useInternationalization()

  return (
    <GenericPlaceholder
      title={translate('text_17757461968258p4ij8g74zp')}
      subtitle={translate('text_1775746196826qogq3id888u')}
      image={<EmptyImage width="136" height="104" />}
    />
  )
}

export default OrderFormsList

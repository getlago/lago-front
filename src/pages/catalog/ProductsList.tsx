import { useInternationalization } from '~/hooks/core/useInternationalization'

const ProductsList = () => {
  const { translate } = useInternationalization()

  return <div className="p-4">{translate('text_17831042398244jk9iv71lra')}</div>
}

export default ProductsList

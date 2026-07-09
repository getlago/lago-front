import { useInternationalization } from '~/hooks/core/useInternationalization'

const ProductItemFiltersList = () => {
  const { translate } = useInternationalization()

  return <div className="p-4">{translate('text_1783104239825gamldgumtq0')}</div>
}

export default ProductItemFiltersList

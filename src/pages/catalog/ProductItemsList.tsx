import { useInternationalization } from '~/hooks/core/useInternationalization'

const ProductItemsList = () => {
  const { translate } = useInternationalization()

  return <div className="p-4">{translate('text_17831042398250iwa2xp8pba')}</div>
}

export default ProductItemsList

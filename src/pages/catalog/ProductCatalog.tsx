import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const ProductCatalog = () => {
  const { translate } = useInternationalization()

  return (
    <>
      <MainHeader.Configure entity={{ viewName: translate('text_1783019143196z1oi70j03vt') }} />
      <div className="p-4">{translate('text_1783019143196z1oi70j03vt')}</div>
    </>
  )
}

export default ProductCatalog

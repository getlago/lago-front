import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'

const QuotesList = () => {
  const { translate } = useInternationalization()

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: translate('text_17757391860814p20fr87x9g'),
        }}
      />

      <GenericPlaceholder
        title={translate('text_17757391860814p20fr87x9g')}
        subtitle={translate('text_177573918608169w9wthupaz')}
        image={<EmptyImage width="136" height="104" />}
      />
    </>
  )
}

export default QuotesList

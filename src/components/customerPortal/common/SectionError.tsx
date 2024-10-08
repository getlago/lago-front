import { Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type SectionErrorProps = {
  refresh: () => void
}

const SectionError = ({ refresh }: SectionErrorProps) => {
  const { translate } = useInternationalization()

  return (
    <div>
      <h3 className="text-lg font-semibold text-grey-700">
        {translate('text_1728385052917x4pkr4t3x3b')}
      </h3>

      <p className="text-base font-normal text-grey-600">
        {translate('text_1728385052918teqr4dhxxi6')}
      </p>

      <Button onClick={refresh}>{translate('text_1728385052918zkczgwzq967')}</Button>
    </div>
  )
}

export default SectionError

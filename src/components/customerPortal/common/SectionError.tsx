import { Button, Icon } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type SectionErrorProps = {
  refresh?: () => void
}

const SectionError = ({ refresh }: SectionErrorProps) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col items-start gap-5">
      <div className="rounded-xl bg-grey-100 p-5">
        <Icon name="warning-unfilled" size="large" />
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold leading-6 text-grey-700">
          {translate('text_1728385052917x4pkr4t3x3b')}
        </h3>

        <p className="text-base font-normal leading-6 text-grey-600">
          {translate('text_1728385052918teqr4dhxxi6')}
        </p>
      </div>

      {refresh && <Button onClick={refresh}>{translate('text_1728385052918zkczgwzq967')}</Button>}
    </div>
  )
}

export default SectionError

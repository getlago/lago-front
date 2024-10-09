import TextButton from '~/components/customerPortal/common/TextButton'
import { tw } from '~/styles/utils'

type SectionTitleProps = {
  className?: string
  title: string
  action?: { title: string; onClick: () => void }
}

const SectionTitle = ({ className, title, action }: SectionTitleProps) => (
  <div className={tw('mb-6 flex items-center pb-4 shadow-b', className)}>
    <h3 className={'text-lg font-semibold leading-6 text-grey-700'}>{title}</h3>

    {action && <TextButton onClick={action.onClick} content={action.title} />}
  </div>
)

export default SectionTitle

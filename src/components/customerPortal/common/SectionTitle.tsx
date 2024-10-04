import { tw } from '~/styles/utils'

type SectionTitleProps = {
  className?: string
  title: string
  action?: { title: string; onClick: () => void }
}

const SectionTitle = ({ className, title, action }: SectionTitleProps) => (
  <div className={tw('mb-6 flex h-10 items-center shadow-b', className)}>
    <h3 className={'text-lg font-semibold text-grey-700'}>{title}</h3>

    {action && (
      <span className="cursor-pointer text-blue-600" onClick={action.onClick} role="presentation">
        {action.title}
      </span>
    )}
  </div>
)

export default SectionTitle

import { tw } from '~/styles/utils'

type SectionTitleProps = {
  className?: string
  title: string
  children?: React.ReactNode
}

const SectionTitle = ({ className, title, children }: SectionTitleProps) => (
  <div className={tw('mb-6 flex h-10 items-center shadow-b', className)}>
    <h3 className={'text-lg font-semibold text-grey-700'}>{title}</h3>

    {children}
  </div>
)

export default SectionTitle

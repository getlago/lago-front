import { tw } from '~/styles/utils'

const SectionTitle = ({ className, title }: { className?: string; title: string }) => (
  <h3
    className={tw(
      'mb-6 flex h-10 items-center text-lg font-semibold text-grey-700 shadow-b',
      className,
    )}
  >
    {title}
  </h3>
)

export default SectionTitle

import { Button } from '~/components/designSystem/Button'

const PageTitle = ({ title, goHome }: { title: string; goHome: () => void }) => {
  return (
    <div className="flex items-center gap-4">
      <Button
        className="text-grey-600"
        icon="arrow-left"
        variant="quaternary"
        onClick={() => goHome()}
      />

      <h3 className="text-lg font-semibold text-grey-700">{title}</h3>
    </div>
  )
}

export default PageTitle

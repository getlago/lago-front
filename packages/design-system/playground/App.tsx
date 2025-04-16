import { ButtonsSection } from './components/ButtonsSection'
import { IconsSection } from './components/IconsSection'

export default function App() {
  return (
    <div className="min-h-screen bg-grey-100 pb-20 pt-8">
      <div className="mx-auto flex max-w-screen-lg flex-col gap-20">
        <IconsSection />
        <ButtonsSection />
      </div>
    </div>
  )
}

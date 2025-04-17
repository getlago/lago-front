import { AlertSection } from './components/AlertSection'
import { AvatarSection } from './components/AvatarSection'
import { ButtonsSection } from './components/ButtonsSection'
import { IconsSection } from './components/IconsSection'
import { SkeletonSection } from './components/SkeletonSection'
import { TypographySection } from './components/TypographySection'

export default function App() {
  return (
    <div className="min-h-screen px-4 pb-20 pt-8">
      <div className="mx-auto flex max-w-screen-lg flex-col gap-10">
        <AlertSection />
        <IconsSection />
        <ButtonsSection />
        <TypographySection />
        <AvatarSection />
        <SkeletonSection />
      </div>
    </div>
  )
}

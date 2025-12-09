import { AlertSection } from './components/AlertSection'
import { AvatarSection } from './components/AvatarSection'
import { ButtonsSection } from './components/ButtonsSection'
import { ChipsSection } from './components/ChipsSection'
import { IconsSection } from './components/IconsSection'
import { LinksSection } from './components/LinksSection'
import { SelectorSection } from './components/SelectorSection'
import { ShowMoreSection } from './components/ShowMoreSection'
import { SkeletonSection } from './components/SkeletonSection'
import { TypographySection } from './components/TypographySection'

export default function App() {
  return (
    <div className="min-h-screen px-4 pb-20 pt-8">
      <div className="mx-auto flex max-w-screen-lg flex-col gap-10">
        <AlertSection />
        <ChipsSection />
        <SelectorSection />
        <ShowMoreSection />
        <IconsSection />
        <ButtonsSection />
        <TypographySection />
        <AvatarSection />
        <SkeletonSection />
        <LinksSection />
      </div>
    </div>
  )
}

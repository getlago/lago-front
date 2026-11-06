import type { Meta, StoryObj } from '@storybook/react-vite'

const Smoke = (): JSX.Element => (
  <div className="rounded-xl bg-blue-100 p-4 font-sans text-blue-700">
    lago-ui renders with Tailwind
  </div>
)

const meta = {
  title: 'Smoke',
  component: Smoke,
} satisfies Meta<typeof Smoke>

export default meta

export const Default: StoryObj<typeof meta> = {}

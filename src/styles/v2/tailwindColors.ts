import { colorPrimitives, colorSemantics, colorVariable } from './colors'

type TailwindColor = (options: { opacityValue?: string; opacityVariable?: string }) => string

export const v2TailwindColors: Record<string, TailwindColor> = Object.fromEntries(
  [...Object.keys(colorPrimitives), ...Object.keys(colorSemantics)].map((name) => [
    name,
    ({ opacityValue, opacityVariable }: Parameters<TailwindColor>[0]): string => {
      const color = `var(${colorVariable(name)})`

      // Tailwind supplies an opacity variable even for classes without a slash modifier.
      if (opacityValue === undefined || opacityVariable !== undefined) return color

      return `color-mix(in srgb, ${color} calc(${opacityValue} * 100%), transparent)`
    },
  ]),
)

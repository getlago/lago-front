import { colorPrimitives, colorSemantics, colorVariable } from './colors'

export const v2TailwindColors: Record<string, string> = Object.fromEntries(
  [...Object.keys(colorPrimitives), ...Object.keys(colorSemantics)].map((name) => [
    name,
    `var(${colorVariable(name)})`,
  ]),
)

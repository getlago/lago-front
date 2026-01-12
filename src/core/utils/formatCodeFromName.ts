export const formatCodeFromName = (name: string) => {
  return name.toLowerCase().replaceAll(/ /g, '_')
}

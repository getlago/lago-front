export const formatCodeFromName = (name: string) => {
  return name.toLowerCase().replace(/ /g, '_')
}

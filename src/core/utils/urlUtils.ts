export const addModeToUrlState = (url: string, mode: string) => {
  let urlObj = new URL(url)
  let urlSearchParams = urlObj.searchParams
  let state = JSON.parse(urlSearchParams.get('state') || ('{}' as string))

  state.mode = mode

  urlSearchParams.set('state', decodeURI(JSON.stringify(state)))
  urlObj.search = urlSearchParams.toString()

  return urlObj.toString()
}

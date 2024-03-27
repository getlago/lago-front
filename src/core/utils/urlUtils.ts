export const addValuesToUrlState = (url: string, values: Record<string, string>) => {
  let urlObj = new URL(url)
  let urlSearchParams = urlObj.searchParams
  let state = JSON.parse(urlSearchParams.get('state') || ('{}' as string))

  state = { ...state, ...values }

  urlSearchParams.set('state', decodeURI(JSON.stringify(state)))
  urlObj.search = urlSearchParams.toString()

  return urlObj.toString()
}

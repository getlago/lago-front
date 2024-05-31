export class SnippetBuilder {
  public readonly vars = {
    EMPTY_LINE: '__empty__',
    EXTERNAL_CUSTOMER_ID: '__EXTERNAL_CUSTOMER_ID__',
    MUST_BE_DEFINED: '__MUST_BE_DEFINED__',
    API_KEY: '__YOUR_API_KEY__',
  } as const

  /**
   * Add a new comment row
   * @returns "# ${string} \n"
   */
  public addComment(comment: string) {
    return `# ${comment}\n`
  }

  /**
   * Add a new curl command row
   * @returns `curl --location --request ${method} "${url}" \\`
   */
  public addCurl({ url, method }: { url: string; method: string }) {
    return `curl --location --request ${method} "${url}" \\`
  }

  /**
   * Add a new curl header row
   * @returns `--header "${header}: ${value}" \\`
   */
  public addHeader(header: string, value: string) {
    return `--header "${header}: ${value}" \\`
  }

  /**
   * Add a new curl data row
   * @returns `"${key}": "${value}"`
   */
  public addProperty(key: string, value?: string | number, options?: { showIfEmpty?: boolean }) {
    const showIfEmpty = options?.showIfEmpty ?? false // Default value is false
    const rawKey = `"${key}"`

    if (value === '' || value === undefined) {
      if (showIfEmpty) {
        return `${rawKey}: ""`
      }
      return this.vars.EMPTY_LINE
    }

    if (typeof value === 'number') {
      return `${rawKey}: ${value}`
    }

    return `${rawKey}: "${value}"`
  }

  /**
   * Remove this.vars.EMPTY_LINE from the string
   * @returns string
   */
  private removeEmptyLines(string: string) {
    const regex = new RegExp(String.raw`(\s+)${this.vars.EMPTY_LINE}`, 'g')

    return string.replace(regex, '')
  }

  /**
   * Add commas to the json object
   * @returns string
   */
  private addCommas(string: string) {
    let lines = string.split('\n')

    let insideBraces = false

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trimEnd()

      // Check the limit of the JSON Object
      if (line.includes('{')) {
        insideBraces = true
      }

      if (insideBraces && line.includes('}')) {
        insideBraces = false
      }

      if (insideBraces) {
        // If the line is empty, ends with an opening brace, or ends with a comma, don't add a comma
        if (
          line.trimEnd().endsWith('{') ||
          line === '' ||
          line === this.vars.EMPTY_LINE ||
          line.endsWith(',')
        ) {
          lines[i] = line
        }
        // If the next line is a closing brace, don't add a comma
        else if (lines[i + 1] && lines[i + 1].trimStart().startsWith('}')) {
          lines[i] = line
        }
        // Else add a comma
        else {
          lines[i] = line + ','
        }
      }
    }

    return lines.join('\n')
  }

  /**
   * Build the final snippet
   * @returns string
   */
  public build(string: string) {
    const emptyLinesCleaned = this.removeEmptyLines(string)
    const withCommas = this.addCommas(emptyLinesCleaned)

    return withCommas
  }
}

export const extractDataRaw = (curl: string): string | null => {
  const dataRawPattern = /--data-raw\s+'([^']+)'|--data-raw\s+"([^"]+)"/
  const match = curl.match(dataRawPattern)

  if (match) {
    return match[1] || match[2] || null
  }

  return null
}

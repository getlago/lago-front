module.exports = function (file, api) {
  // Alias the jscodeshift API for ease of use.
  const j = api.jscodeshift

  // Convert the entire file source into a collection of nodes paths.
  const root = j(file.source)

  root
    // Find all Skeleton JSX elements
    .findJSXElements('Skeleton')
    .filter((path) => {
      // ...and a margin relared attribute
      const hasAnyMarginValue = path.value.openingElement.attributes.some(
        (attr) =>
          attr.name.name === 'marginRight' ||
          attr.name.name === 'marginBottom' ||
          attr.name.name === 'marginTop',
      )

      return hasAnyMarginValue
    })
    // find out if className is present
    .forEach((path) => {
      // Create a map of margin values
      const classNames = []

      path.value.openingElement.attributes.forEach((attr) => {
        if (
          attr.name.name === 'marginRight' ||
          attr.name.name === 'marginBottom' ||
          attr.name.name === 'marginTop'
        ) {
          const key = attr.name.name
          const clasNamePrefix = key === 'marginRight' ? 'mr' : key === 'marginBottom' ? 'mb' : 'mt'

          let localValue = 0

          if (attr.value.type === 'JSXExpressionContainer') {
            localValue = attr.value.expression.arguments[0].value

            classNames.push(`${clasNamePrefix}-${localValue}`)

            return
          } else if (typeof attr.value.value === 'number') {
            localValue = attr.value.value
          } else if (typeof attr.value.value === 'string') {
            localValue = parseInt(attr.value.value, 10)
          }

          // If value divided by 4 is not 0, remove one and retry
          let i = 10

          while (localValue % 4 !== 0 && i !== 0) {
            if (localValue < 4) {
              localValue = 4
              break
            } else {
              localValue -= 1
              i--
            }
          }

          classNames.push(`${clasNamePrefix}-${localValue / 4}`)
        }
      })

      // If element does not have className attribute, create it
      const hasClassName = path.value.openingElement.attributes.some(
        (attr) => attr.name.name === 'className',
      )

      if (!hasClassName) {
        // push new classNames to the element
        path.value.openingElement.attributes.push(
          j.jsxAttribute(j.jsxIdentifier('className'), j.stringLiteral(classNames.join(' '))),
        )
        // remove margin related attributes
        path.value.openingElement.attributes = path.value.openingElement.attributes.filter(
          (attr) =>
            attr.name.name !== 'marginRight' &&
            attr.name.name !== 'marginBottom' &&
            attr.name.name !== 'marginTop',
        )
      }
    })

  // TODO: remove margin related attributes

  // Save changes to the file
  return root.toSource()
}

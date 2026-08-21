import { DocumentNode, Kind, OperationDefinitionNode } from 'graphql'

/**
 * Reads the GraphQL type a document declares for one of its operation
 * variables, e.g. `BigInt` for `$amountFrom: BigInt`.
 *
 * `pnpm code:style` typechecks the TypeScript side, but the document is what
 * actually reaches the API, so this is what a test asserts on when the wire
 * type of a variable is the behaviour under guard.
 *
 * Returns `undefined` when the operation declares no such variable, or when it
 * is not a plain named type (a list or a non-null wrapper).
 */
export const getOperationVariableTypeName = (
  document: DocumentNode,
  variableName: string,
): string | undefined => {
  const operation = document.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === Kind.OPERATION_DEFINITION,
  )

  const variableDefinition = operation?.variableDefinitions?.find(
    (definition) => definition.variable.name.value === variableName,
  )

  if (variableDefinition?.type.kind !== Kind.NAMED_TYPE) return undefined

  return variableDefinition.type.name.value
}

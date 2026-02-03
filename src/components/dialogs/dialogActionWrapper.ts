import { NiceModalHandler } from '@ebay/nice-modal-react'

import { MainFunction } from './types'

const executorWrapper = (mainFunctionToExecute: MainFunction) => {
  try {
    return mainFunctionToExecute()
  } catch (error) {
    return error
  }
}

export const dialogActionWrapper = (
  mainFunctionToExecute: MainFunction,
  dialog: NiceModalHandler,
) => {
  const result = executorWrapper(mainFunctionToExecute)

  if (result instanceof Error) {
    dialog.reject({
      reason: 'error',
      error: result,
    })
    dialog.hide()
    return
  }

  dialog.resolve({
    reason: 'success',
    params: result,
  })
  dialog.hide()
}

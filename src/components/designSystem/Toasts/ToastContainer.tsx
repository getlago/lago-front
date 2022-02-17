import { useEffect, useRef, createRef } from 'react'
import styled from 'styled-components'
import { useReactiveVar } from '@apollo/client'

import { toastsVar, removeAllToasts } from '~/core/apolloClient'
import { theme } from '~/styles'

import { Toast } from './Toast'

const MAX_DISPLAYED_ITEMS = 3

export const ToastContainer = () => {
  const toasts = useReactiveVar(toastsVar)
  const elementsRefs = useRef({})

  useEffect(() => {
    // Add a new ref or use existant one for each toast
    elementsRefs.current = toasts.reduce((acc, { id }) => {
      // @ts-expect-error
      acc[id] = elementsRefs.current[id] || createRef()

      return acc
    }, {})

    // Get the MAX_DISPLAYED_ITEMS toast that will be displayed
    const elementsToDisplay = toasts.slice(0, MAX_DISPLAYED_ITEMS).map(({ id }) => id)

    // Ask child to remove itself for all the toast that must not be displayed anymore
    Object.keys(elementsRefs.current).map((id) => {
      if (!elementsToDisplay.includes(id)) {
        // @ts-expect-error
        if (elementsRefs.current[id]?.current?.closeToast) {
          // @ts-expect-error
          elementsRefs.current[id].current.closeToast()
        }
      }
    })
  }, [toasts])

  useEffect(() => {
    // This is to avoid persistance on the toasts
    return () => removeAllToasts()
  }, [])

  return (
    <Container>
      {toasts.map((toast) => (
        // @ts-expect-error
        <Toast key={toast.id} ref={elementsRefs.current[toast.id]} toast={toast} />
      ))}
    </Container>
  )
}

const Container = styled.div`
  cursor: default;
  position: fixed;
  bottom: 0;
  left: 0;
  margin-bottom: ${theme.spacing(4)}px;
  margin-left: ${theme.spacing(4)}px;
  z-index: ${theme.zIndex.toast};
`

import { useState, forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react'
import styled, { css } from 'styled-components'
import clsns from 'classnames'

import { theme } from '~/styles'
import { removeToast, TToast, TSeverity, ToastSeverityEnum } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { Typography } from '../Typography'
import { Button } from '../Button'
interface ToastProps {
  toast: TToast
}

export interface ToastRef {
  closeToast: () => unknown
}

const AUTO_DISMISS_TIME = 6000

export const Toast = forwardRef<ToastRef, ToastProps>(({ toast }: ToastProps, ref) => {
  const [closing, setClosing] = useState(false)
  const timeoutRef = useRef(null)
  const { translate } = useInternationalization()
  const { id, severity = ToastSeverityEnum.info, autoDismiss = true, message, translateKey } = toast

  const startTimeout = useCallback(
    (time = AUTO_DISMISS_TIME) => {
      if (!autoDismiss) return

      // @ts-expect-error
      timeoutRef.current = setTimeout(() => {
        setClosing(true)
      }, time)
    },
    [setClosing, autoDismiss]
  )

  const stopTimeout = useCallback(
    () => autoDismiss && !!timeoutRef.current && clearTimeout(timeoutRef.current || undefined),
    [autoDismiss]
  )

  useEffect(() => {
    startTimeout()

    return () => {
      stopTimeout()
    }
  }, [startTimeout, stopTimeout])

  // Allow parent to ask for toast closing
  useImperativeHandle(ref, () => ({
    closeToast: () => {
      setClosing(true)
    },
  }))

  // Toast should not be closed on hover, so we use onMouseEnter + onMouseLeave
  return (
    <Container
      onTransitionEnd={(e) => {
        if (e.propertyName === 'transform' && closing) {
          // Remove toast after transition
          removeToast(id)
        }
      }}
      className={clsns({ 'toast-closing': closing })}
      key={id}
      $severity={severity}
      onMouseEnter={stopTimeout}
      onMouseLeave={() => startTimeout(AUTO_DISMISS_TIME / 2)}
      data-qa={`toast/${severity}`}
    >
      <Message color="inherit">{translateKey ? translate(translateKey) : message}</Message>
      <Button
        onClick={() => setClosing(true)}
        variant="quaternary-light"
        inheritColor
        icon="close"
      />
    </Container>
  )
})

Toast.displayName = 'Toast'

const Container = styled.div<{ $severity: TSeverity }>`
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: ${theme.palette.common.white};
  border-radius: 12px;
  overflow: hidden;
  max-height: 300px;
  margin-top: ${theme.spacing(4)};
  animation: enter 250ms cubic-bezier(0.4, 0, 0.2, 1) 1;
  width: fit-content;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
  max-width: 360px;

  &.toast-closing {
    max-height: 0px;
    margin-top: 0;
    transform: translateX(-120%);
  }

  ${({ $severity }) =>
    $severity === ToastSeverityEnum.info &&
    css`
      background-color: ${theme.palette.grey[700]};
    `}

  ${({ $severity }) =>
    $severity === ToastSeverityEnum.success &&
    css`
      background-color: ${theme.palette.success[600]};
    `}

  ${({ $severity }) =>
    $severity === ToastSeverityEnum.danger &&
    css`
      background-color: ${theme.palette.error[600]};
    `}

  @keyframes enter {
    0% {
      transform: translateX(-120%);
      margin-top: 0;
      max-height: 0;
    }
    20% {
      transform: translateX(-120%);
    }
    100% {
      transform: translateX(0);
      margin-top: ${theme.spacing(4)};
      max-height: 300px;
    }
  }
`

const Message = styled(Typography)`
  && {
    margin-right: ${theme.spacing(4)};
    flex: 1;
  }
`

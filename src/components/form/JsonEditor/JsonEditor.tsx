import { ClickAwayListener, Fade } from '@mui/material'
import ace from 'ace-builds/src-noconflict/ace'
import 'ace-builds/src-noconflict/ext-language_tools'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/webpack-resolver'
// @ts-ignore
import jsonWorkerUrl from 'file-loader!ace-builds/src-noconflict/worker-json'
import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import AceEditor from 'react-ace'
import styled, { css } from 'styled-components'

import { Chip, Icon, Tooltip, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

ace.config.setModuleUrl('ace/mode/json_worker', jsonWorkerUrl)

enum JSON_EDITOR_ERROR_ENUM {
  invalid = 'invalid',
}
export interface JsonEditorProps {
  label: string
  name?: string
  placeholder?: string
  value?: string | Record<string, unknown>
  infoText?: string
  error?: string
  helperText?: string | ReactNode
  customInvalidError?: string
  disabled?: boolean
  minEditableLines?: number
  height?: string
  onBlur?: (props: unknown) => void
  onChange?: (value: string) => void
  onError?: (err: keyof typeof JSON_EDITOR_ERROR_ENUM) => void
  onExpand?: (deleteOverlay: () => void) => void
}

export const JsonEditor = ({
  name,
  value,
  placeholder,
  label,
  infoText,
  helperText,
  error,
  customInvalidError,
  disabled,
  height,
  onChange,
  onError,
  onBlur,
  onExpand,
}: JsonEditorProps) => {
  const { translate } = useInternationalization()
  const editorRef = useRef<AceEditor | null>(null)
  const [jsonQuery, setJsonQuery] = useState<string | undefined>()
  const [totalRows, setTotalRows] = useState<number>()
  const [maxVisibleLines, setMaxVisibleLines] = useState<number>()
  const [showOverlay, setShowOverlay] = useState(false)
  const [isHover, setHover] = useState(false)

  const checkOverlay = useCallback(
    (length: number) => {
      if (maxVisibleLines && length >= maxVisibleLines) {
        editorRef.current?.editor.scrollPageUp()
        setShowOverlay(true)
      }
    },
    [maxVisibleLines],
  )

  useEffect(() => {
    if (typeof value === 'object') {
      try {
        setJsonQuery(JSON.stringify(value, null, 2))
      } catch (e) {} // Nothing is supposed to happen here
    } else {
      setJsonQuery(value)
    }
  }, [value])

  useLayoutEffect(() => {
    const renderer = editorRef.current?.editor.renderer

    if (renderer) {
      setMaxVisibleLines(Math.floor(renderer.container.clientHeight / renderer.lineHeight))
    }
  }, [editorRef.current?.editor.renderer])

  useEffect(() => {
    if (jsonQuery && !totalRows) {
      const length = editorRef.current?.editor.session.getLength()

      if (length) {
        setTotalRows(length)
        checkOverlay(length)
      }
    }
    // Should be called at initial render only after json query is set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonQuery])

  return (
    <Container>
      {
        <Label $withInfo={!!infoText}>
          <Typography variant="captionHl" color="textSecondary">
            {label}
          </Typography>
          {!!infoText && (
            <Tooltip placement="bottom-start" title={infoText}>
              <Icon name="info-circle" />
            </Tooltip>
          )}
        </Label>
      }

      <ClickAwayListener
        onClickAway={() => {
          const length = editorRef.current?.editor.session.getLength()

          if (length) {
            checkOverlay(length)
          }
        }}
      >
        <EditorContainer
          aria-label={name}
          $hasErrorOrHelper={!!helperText || !!error}
          $hasError={!!error}
          $height={height}
          onMouseEnter={() => {
            if (!isHover) {
              setHover(true)
            }
          }}
          onMouseLeave={() => {
            if (isHover) {
              setHover(false)
            }
          }}
        >
          {/* This is the overlay that will be shown when the JSON editor is collapsed */}
          {onExpand && (
            <Fade in={showOverlay}>
              <Overlay>
                <Fade in={isHover}>
                  <Button onClick={() => onExpand(() => setShowOverlay(false))}>
                    <Chip icon="plus" label="Click to expand" />
                  </Button>
                </Fade>
              </Overlay>
            </Fade>
          )}

          <LineNumbersBackground />
          <Editor
            ref={editorRef}
            className={disabled ? 'json-editor--disabled' : undefined}
            value={jsonQuery}
            onLoad={(editor) => {
              editor.renderer.setPadding(4)
              editor.renderer.setScrollMargin(10, 10, 0, 0)
            }}
            mode="json"
            onChange={(code) => {
              setJsonQuery(code)
              onChange && onChange(code)
            }}
            onBlur={(event) => {
              if (!jsonQuery) return true
              try {
                JSON.parse(jsonQuery)
              } catch (e) {
                onError && onError(JSON_EDITOR_ERROR_ENUM.invalid)
              }
              onBlur && onBlur(event)
            }}
            fontSize={14}
            width="100%"
            height="100%"
            placeholder={placeholder}
            setOptions={{
              useWorker: true,
              enableBasicAutocompletion: false,
              enableLiveAutocompletion: false,
              showLineNumbers: true,
              tabSize: 2,
              showPrintMargin: false,
              readOnly: disabled,
            }}
          />
        </EditorContainer>
      </ClickAwayListener>

      {(helperText || error) && (
        <Typography variant="caption" color={error ? 'danger600' : 'textPrimary'}>
          {!!error
            ? translate(
                error === JSON_EDITOR_ERROR_ENUM.invalid && customInvalidError
                  ? customInvalidError
                  : 'text_6638a3538de76801ac2f451b',
              )
            : helperText}
        </Typography>
      )}
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: 100%;
`

const Label = styled.div<{ $withInfo?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(1)};

  ${({ $withInfo }) =>
    $withInfo &&
    css`
      > *:first-child {
        margin-right: ${theme.spacing(1)};
      }

      > *:last-child {
        height: 16px;
      }
    `}
`

const EditorContainer = styled.div<{
  $hasErrorOrHelper?: boolean
  $hasError?: boolean
  $height?: string
}>`
  border: 1px solid
    ${({ $hasError }) => ($hasError ? theme.palette.error[600] : theme.palette.grey[500])};
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  margin-bottom: ${({ $hasErrorOrHelper }) => ($hasErrorOrHelper ? theme.spacing(1) : '0px')};
  height: ${({ $height }) => ($height ? $height : '100%')};
  box-sizing: border-box;
`

const LineNumbersBackground = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  background-color: ${theme.palette.grey[100]};
  width: 42px;
  height: 100%;
`

const Overlay = styled.div`
  position: absolute;
  inset: 0px;
  z-index: 10;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, ${theme.palette.common.white} 80%);
`

const Button = styled.button`
  width: 100%;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Editor = styled(AceEditor)`
  && {
    width: 100%;
    min-height: 136px;
    font-family:
      IBM Plex Mono,
      Consolas,
      Monaco,
      Andale Mono,
      Ubuntu Mono,
      monospace;
    font-size: 14px;

    .ace_active-line {
      background-color: ${theme.palette.grey[100]};
    }

    .ace_cursor {
      display: none !important;
    }

    &.ace_focus {
      .ace_active-line {
        background-color: ${theme.palette.primary[100]};
      }

      .ace_cursor {
        display: block !important;
        border-left: 1px solid;
        color: ${theme.palette.grey[600]};
      }
    }

    .ace_editor.ace_autocomplete {
      width: inherit;
      max-width: 500 !important;
    }

    .ace_content {
      color: ${theme.palette.grey[700]};
    }

    .ace_fold-widget.ace_invalid {
      background-color: ${theme.palette.error[100]};
      border-color: ${theme.palette.error[600]};
    }

    .ace_variable {
      color: ${theme.palette.grey[700]};
    }

    .ace_string {
      color: ${theme.palette.success[600]};
    }

    .ace_numeric {
      color: ${theme.palette.secondary[500]};
    }

    .ace_scroller {
      left: 42px !important;
    }

    .ace_gutter {
      background-color: ${theme.palette.grey[100]};
      color: ${theme.palette.grey[500]};
      width: 42px !important;

      > * {
        width: 42px !important;
      }
    }

    .ace_gutter-active-line.ace_gutter-cell {
      background-color: ${theme.palette.grey[200]};
      padding-right: ${theme.spacing(3)};
    }

    .ace_gutter-cell {
      padding-right: ${theme.spacing(3)};

      &.ace_error {
        background-image: none;
        background-color: ${theme.palette.error[100]};

        &:before {
          content: '•';
          color: ${theme.palette.error[600]};
          font-size: 30px;
          position: absolute;
          left: 1px;
          top: -11px;
        }
      }
    }

    .ace_scroller.ace_scroll-left {
      box-shadow: none;
    }

    .ace_tooltip.ace_error {
      background-color: ${theme.palette.common.black};
      border: none;
      border-radius: 12px;
      color: ${theme.palette.common.white};
      padding: ${theme.spacing(3)} ${theme.spacing(4)};
      font-family: Inter, Arial, Verdana, Helvetica, sans-serif;
    }

    .ace_placeholder {
      color: ${theme.palette.grey[500]};
      font-family:
        IBM Plex Mono,
        Consolas,
        Monaco,
        Andale Mono,
        Ubuntu Mono,
        monospace;
      font-size: 14px;
      top: 10px;
      padding: 0 !important;
      margin: 0;
      left: ${theme.spacing(1)};
    }

    &.json-editor--disabled {
      background-color: ${theme.palette.grey[100]};
      .ace_cursor,
      .ace_active-line {
        display: none !important;
      }
      .ace_content,
      .ace_numeric,
      .ace_string,
      .ace_variable {
        color: ${theme.palette.grey[600]};
      }

      .ace_gutter,
      .ace_gutter-active-line.ace_gutter-cell {
        background-color: ${theme.palette.grey[200]};
      }
    }
  }
`

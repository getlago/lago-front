/* eslint-disable tailwindcss/no-custom-classname */
import { Fade } from '@mui/material'
import ace from 'ace-builds/src-noconflict/ace'
import 'ace-builds/src-noconflict/ext-language_tools'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/webpack-resolver'
import { clsx } from 'clsx'
// @ts-ignore
import jsonWorkerUrl from 'file-loader!ace-builds/src-noconflict/worker-json'
import { ReactNode, useEffect, useRef, useState } from 'react'
import AceEditor from 'react-ace'
import styled, { css } from 'styled-components'

import { Chip, Icon, Tooltip, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

ace.config.setModuleUrl('ace/mode/json_worker', jsonWorkerUrl)

enum JSON_EDITOR_ERROR_ENUM {
  invalid = 'invalid',
  invalidCustomValidate = 'invalidCustomValidate',
}
export interface JsonEditorProps {
  label: string
  description?: string
  name?: string
  placeholder?: string
  value?: string | Record<string, unknown>
  infoText?: string
  error?: string
  helperText?: string | ReactNode
  customInvalidError?: string
  disabled?: boolean
  readOnly?: boolean
  readOnlyWithoutStyles?: boolean
  height?: string
  hideLabel?: boolean
  editorMode?: 'text' | 'json'
  showHelperOnError?: boolean
  validate?: (value: string) => void
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
  description,
  infoText,
  helperText,
  error,
  customInvalidError,
  disabled,
  readOnly,
  readOnlyWithoutStyles,
  height,
  hideLabel,
  editorMode = 'json',
  showHelperOnError,
  validate,
  onChange,
  onError,
  onBlur,
  onExpand,
}: JsonEditorProps) => {
  const { translate } = useInternationalization()
  const editorRef = useRef<AceEditor | null>(null)
  const [jsonQuery, setJsonQuery] = useState<string | undefined>()
  const [showOverlay, setShowOverlay] = useState(true)
  const [isHover, setHover] = useState(false)

  useEffect(() => {
    if (typeof value === 'object') {
      try {
        setJsonQuery(JSON.stringify(value, null, 2))
      } catch {
        // Nothing is supposed to happen here
      }
    } else {
      setJsonQuery(value)
    }
  }, [value])

  return (
    <Container>
      {!hideLabel && (
        <Label>
          <LabelContainer $withInfo={!!infoText}>
            <Typography variant="captionHl" color="textSecondary">
              {label}
            </Typography>
            {!!infoText && (
              <Tooltip className="flex h-5 items-end" placement="bottom-start" title={infoText}>
                <Icon name="info-circle" />
              </Tooltip>
            )}
          </LabelContainer>
          {description && (
            <Description>
              <Typography variant="caption">{description}</Typography>
            </Description>
          )}
        </Label>
      )}

      <EditorContainer
        aria-label={name}
        $hasErrorOrHelper={!!helperText || !!error}
        $hasError={!!error}
        $height={height}
        $readOnly={readOnly}
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
        {onExpand && (
          <Fade in={showOverlay}>
            <Overlay>
              <Fade in={isHover}>
                <Button onClick={() => onExpand(() => setShowOverlay(false))}>
                  <Chip icon="plus" label={translate('text_663dea5702b60301d8d0650a')} />
                </Button>
              </Fade>
            </Overlay>
          </Fade>
        )}

        <LineNumbersBackground />
        <Editor
          ref={editorRef}
          className={clsx(
            disabled && 'json-editor--disabled',
            readOnly && 'json-editor--readonly',
            readOnlyWithoutStyles && 'json-editor--readonlywithoutstyles',
          )}
          value={jsonQuery}
          onLoad={(editor) => {
            editor.renderer.setPadding(4)
            editor.renderer.setScrollMargin(10, 10, 0, 0)
          }}
          mode={editorMode}
          onChange={(code) => {
            setJsonQuery(code)
            onChange && onChange(code)
          }}
          onBlur={(event) => {
            if (!jsonQuery) return true

            if (validate) {
              try {
                validate(jsonQuery)
              } catch {
                onError && onError(JSON_EDITOR_ERROR_ENUM.invalidCustomValidate)
              }
            } else if (editorMode === 'json') {
              try {
                JSON.parse(jsonQuery)
              } catch {
                onError && onError(JSON_EDITOR_ERROR_ENUM.invalid)
              }
            }
            setShowOverlay(true)
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
            readOnly: readOnly || readOnlyWithoutStyles,
          }}
        />
      </EditorContainer>

      {helperText && !error && (
        <Helper variant="caption" color="textPrimary">
          {helperText}
        </Helper>
      )}

      {error && (
        <Helper variant="caption" color="danger600">
          {customInvalidError}

          {!customInvalidError &&
            error === JSON_EDITOR_ERROR_ENUM.invalid &&
            translate('text_6638a3538de76801ac2f451b')}

          {!customInvalidError &&
            error === JSON_EDITOR_ERROR_ENUM.invalidCustomValidate &&
            translate('text_1729864971171gfdioq71rvt')}
        </Helper>
      )}

      {helperText && showHelperOnError && error && (
        <Helper className="mt-5" variant="caption" color="textPrimary">
          {helperText}
        </Helper>
      )}
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: calc(100% - 32px - 20px);
  display: grid;
  grid-auto-rows: auto 1fr auto;
  grid-template-areas:
    'label'
    'editor'
    'helper';
`

const Label = styled.div`
  grid-area: label;
`

const LabelContainer = styled.div<{ $withInfo?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(1)};

  ${({ $withInfo }) =>
    $withInfo &&
    css`
      > *:first-child {
        margin-right: ${theme.spacing(1)};
      }
    `}
`

const EditorContainer = styled.div<{
  $hasErrorOrHelper?: boolean
  $hasError?: boolean
  $height?: string
  $readOnly?: boolean
}>`
  border: ${({ $readOnly, $hasError }) =>
    $readOnly
      ? undefined
      : `1px solid ${$hasError ? theme.palette.error[600] : theme.palette.grey[500]}`};
  border-radius: ${({ $readOnly }) => ($readOnly ? undefined : '12px')};
  position: relative;
  overflow: hidden;
  margin-bottom: ${({ $hasErrorOrHelper }) => ($hasErrorOrHelper ? theme.spacing(1) : '0px')};
  height: ${({ $height }) => ($height ? $height : '100%')};
  box-sizing: border-box;
  grid-area: editor;
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

    &.json-editor--readonly {
      .ace_cursor,
      .ace_active-line {
        display: none !important;
      }
    }

    &.json-editor--readonlywithoutstyles {
      .ace_cursor,
      .ace_active-line {
        display: none !important;
      }
    }
  }
`

const Helper = styled(Typography)`
  grid-area: helper;
`

const Description = styled.div`
  margin-bottom: ${theme.spacing(4)};
`

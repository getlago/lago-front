import { ReactNode } from 'react'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/useInternationalization'
import { theme } from '~/styles'

import { Button } from '../Button'
import { Tooltip } from '../Tooltip'
import { Typography } from '../Typography'

const CELL_HEIGHT = 48

type DataType<T> = T & { disabledDelete?: boolean }

interface TableColumnMapKey<T> {
  title?: ReactNode
  size?: number
  content: ReactNode | ((row: DataType<T>, index: number) => ReactNode)
  mapKey?: never // Use this if you only want to render the property itself
  skeleton?: ReactNode
  onClick?: () => unknown // On column header click
}

interface TableColumnContent {
  title: ReactNode
  size?: number
  content?: never
  mapKey: string // Use this if you only want to render the property itself
  skeleton?: ReactNode
  onClick?: () => unknown // On column header click
}

type TableColumnProps<T> = TableColumnMapKey<T> | TableColumnContent

export interface TableProps<T> {
  name: string // this is to allow to have several table on a same page (no duplicated keys)
  columns: TableColumnProps<T>[]
  data: DataType<T>[]
  emptyPlacholder?: ReactNode // displayed if "skeletonRowCount < 1 && data.length < 1"
  skeletonRowCount?: number // Should be set to 0 if there is no more elements to load
  error?: ReactNode
  className?: string
  onDeleteRow?: (row: DataType<T>, index: number) => unknown
  onBottomReach?: () => unknown // Can be used to load more datas
}

export const Table = <T extends Record<string, unknown>>({
  name,
  className,
  columns,
  data,
  onDeleteRow,
}: TableProps<T>) => {
  const { translate } = useInternationalization()

  return (
    <Content className={className}>
      {/* Header */}
      <thead>
        <HeaderRow>
          {columns?.map(({ title, size = 124 }, i) => {
            return (
              <HeaderCell key={`table-${name}-head-${i}`} $size={size}>
                {title && title}
              </HeaderCell>
            )
          })}
        </HeaderRow>
      </thead>
      <tbody>
        {data?.map((row, i) => {
          return (
            <ContentRow key={`table-${name}-head-${i}`}>
              <>
                {columns.map(({ content, mapKey, size = 124 }, j) => {
                  return (
                    <ContentCell $size={size} key={`table-${name}-cell-${i}-${j}`}>
                      {mapKey ? (
                        // @ts-expect-error
                        <Typography variant="body">{_get(row, mapKey)}</Typography>
                      ) : typeof content === 'function' ? (
                        content(row, i)
                      ) : (
                        content
                      )}
                    </ContentCell>
                  )
                })}
                {onDeleteRow && !row.disabledDelete && (
                  <DeleteButtonContainer>
                    <Tooltip
                      title={translate('text_62793bbb599f1c01522e9239')}
                      placement="top-start"
                    >
                      <Button
                        variant="tertiary"
                        size="small"
                        icon="trash"
                        onClick={() => onDeleteRow(row, i)}
                      />
                    </Tooltip>
                  </DeleteButtonContainer>
                )}
              </>
            </ContentRow>
          )
        })}
      </tbody>
    </Content>
  )
}

const DeleteButtonContainer = styled.td`
  position: absolute;
  display: none;
  border-radius: 8px;
  width: fit-content;
  background-color: ${theme.palette.background.default};
`

const Content = styled.table`
  border-left: 1px solid ${theme.palette.grey[300]};
  border-top: 1px solid ${theme.palette.grey[300]};
  border-spacing: 0;
`

const HeaderRow = styled.tr`
  height: ${CELL_HEIGHT}px;
`

const HeaderCell = styled.th<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  min-width: ${({ $size }) => $size}px;
  max-width: ${({ $size }) => $size}px;
  min-width: ${({ $size }) => $size}px;
  box-sizing: border-box;
  border-right: 1px solid ${theme.palette.grey[300]};
  border-bottom: 1px solid ${theme.palette.grey[300]};
  text-align: left;
  height: ${CELL_HEIGHT}px;
`

const ContentRow = styled.tr`
  position: relative;
  height: ${CELL_HEIGHT}px;

  &:hover {
    ${DeleteButtonContainer} {
      display: flex;
      top: 0;
      left: 0;
      transform: translate(-12px, ${CELL_HEIGHT / 2 - 12}px);
    }
  }
`

const ContentCell = styled.td<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  min-width: ${({ $size }) => $size}px;
  max-width: ${({ $size }) => $size}px;
  min-width: ${({ $size }) => $size}px;
  box-sizing: border-box;
  height: ${CELL_HEIGHT}px;
  border-right: 1px solid ${theme.palette.grey[300]};
  border-bottom: 1px solid ${theme.palette.grey[300]};
  padding: 0;
`

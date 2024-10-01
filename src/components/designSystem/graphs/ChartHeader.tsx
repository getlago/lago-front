import styled, { css } from 'styled-components'

import { Icon, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

type ChartHeaderProps = {
  name: string
  tooltipText?: string
  amount: string
  period?: string
  blur?: boolean
  loading?: boolean
}

const ChartHeader = ({
  name,
  tooltipText,
  amount,
  period,
  loading,
  blur = false,
}: ChartHeaderProps) => {
  return (
    <>
      {!!loading ? (
        <LoadingWrapper>
          <Skeleton variant="text" width={72} height={12} />
          <Skeleton variant="text" width={160} height={12} />
        </LoadingWrapper>
      ) : (
        <ChartHeaderWrapper $blur={blur}>
          <LeftInfosWrapper>
            <LeftInfoCellWithTooltip>
              <Typography variant="captionHl" color="grey600">
                {name}
              </Typography>
              {!!tooltipText && (
                <Tooltip className="flex h-5 items-end" placement="top-start" title={tooltipText}>
                  <Icon name="info-circle" />
                </Tooltip>
              )}
            </LeftInfoCellWithTooltip>
            <Typography variant="subhead" color="grey700">
              {amount}
            </Typography>
          </LeftInfosWrapper>

          {!!period && (
            <Typography variant="note" color="grey600">
              {period}
            </Typography>
          )}
        </ChartHeaderWrapper>
      )}
    </>
  )
}

export default ChartHeader

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 56px;
  padding: ${theme.spacing(1)} 0 ${theme.spacing(2)};
  box-sizing: border-box;
`

const ChartHeaderWrapper = styled.div<{ $blur: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  ${({ $blur }) =>
    $blur &&
    css`
      filter: blur(4px);
      pointer-events: none;
    `}
`

const LeftInfosWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: ${theme.spacing(2)};
`

const LeftInfoCellWithTooltip = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};
`

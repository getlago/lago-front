import { FormikErrors } from 'formik'
import { memo, ReactNode } from 'react'
import styled from 'styled-components'

import { Accordion, Icon, Tooltip, Typography } from '~/components/designSystem'
import { PropertiesInput, InputMaybe } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalChargeInput } from './types'

interface ConditionalChargeWrapperProps {
  chargeIndex: number
  chargeErrors?: string | string[] | FormikErrors<LocalChargeInput>[] | undefined
  children: ({
    propertyCursor,
    valuePointer,
  }: {
    propertyCursor: string
    valuePointer: InputMaybe<PropertiesInput> | undefined
  }) => ReactNode
  localCharge: LocalChargeInput
}

export const ConditionalChargeWrapper = memo(
  ({ chargeIndex, chargeErrors, children, localCharge }: ConditionalChargeWrapperProps) => {
    const { translate } = useInternationalization()

    if (!localCharge?.billableMetric?.flatGroups?.length)
      return (
        <>{children({ propertyCursor: 'properties', valuePointer: localCharge?.properties })}</>
      )

    return (
      <>
        {localCharge?.groupProperties?.map((group, groupPropertyIndex) => {
          const groupKey =
            localCharge?.billableMetric?.flatGroups &&
            localCharge?.billableMetric?.flatGroups[groupPropertyIndex].key
          const groupName =
            localCharge?.billableMetric?.flatGroups &&
            localCharge?.billableMetric?.flatGroups[groupPropertyIndex].value
          const hasErrorInGroup =
            typeof chargeErrors === 'object' &&
            typeof chargeErrors[chargeIndex] === 'object' &&
            // @ts-ignore
            typeof chargeErrors[chargeIndex].groupProperties === 'object' &&
            // @ts-ignore
            typeof chargeErrors[chargeIndex].groupProperties[groupPropertyIndex] === 'object' &&
            // @ts-ignore
            !!chargeErrors[chargeIndex].groupProperties[groupPropertyIndex].values

          return (
            <Accordion
              key={`charge-${group.groupId}-group-${groupPropertyIndex}`}
              summary={
                <Summary>
                  <Typography variant="bodyHl" color="grey700">
                    <span>{groupKey && `${groupKey} • `}</span>
                    <span>{groupName}</span>
                  </Typography>
                  <Tooltip
                    placement="top-end"
                    title={
                      hasErrorInGroup
                        ? translate('text_635b975ecea4296eb76924b7')
                        : translate('text_635b975ecea4296eb76924b1')
                    }
                  >
                    <ValidationIcon
                      name="validate-filled"
                      color={hasErrorInGroup ? 'disabled' : 'success'}
                    />
                  </Tooltip>
                </Summary>
              }
              data-test={`group-${groupPropertyIndex}`}
            >
              {typeof children === 'function' &&
                children({
                  propertyCursor: `groupProperties.${groupPropertyIndex}.values`,
                  valuePointer:
                    localCharge?.groupProperties &&
                    localCharge?.groupProperties[groupPropertyIndex].values,
                })}
            </Accordion>
          )
        })}
      </>
    )
  }
)

ConditionalChargeWrapper.displayName = 'ConditionalChargeWrapper'

const Summary = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ValidationIcon = styled(Icon)`
  height: 16px;
`

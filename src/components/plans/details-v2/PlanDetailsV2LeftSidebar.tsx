import { gql } from '@apollo/client'
import { Icon, IconName } from 'lago-design-system'
import { useMemo, useState } from 'react'

import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import {
  FixedChargeForPlanDetailsSidebarFragment,
  UsageChargeForPlanDetailsSidebarFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanDetailsV2SectionId } from './sidebarSections'

gql`
  fragment FixedChargeForPlanDetailsSidebar on FixedCharge {
    id
    invoiceDisplayName
    code
    addOn {
      id
      name
    }
  }

  fragment UsageChargeForPlanDetailsSidebar on Charge {
    id
    invoiceDisplayName
    code
    billableMetric {
      id
      name
    }
  }
`

// `labelKey` is translated; `label` is a ready-to-render string (charge names,
// which aren't translation keys). Sections use `labelKey`, charge children use
// `label`.
type SidebarItem = {
  id: string
  labelKey?: string
  label?: string
  children?: SidebarItem[]
  addLabelKey?: string
}

const getIconName = (isGroup: boolean, isExpanded: boolean): IconName => {
  if (!isGroup) return 'file'

  return isExpanded ? 'folder-open' : 'folder-close'
}

const buildSections = (
  isInSubscriptionForm: boolean,
  fixedCharges: FixedChargeForPlanDetailsSidebarFragment[],
  usageCharges: UsageChargeForPlanDetailsSidebarFragment[],
): SidebarItem[] => {
  const advancedChildren: SidebarItem[] = [
    { id: PlanDetailsV2SectionId.MinimumCommitment, labelKey: 'text_17792899158664ii2pmrd2le' },
  ]

  if (!isInSubscriptionForm) {
    advancedChildren.push(
      { id: PlanDetailsV2SectionId.ProgressiveBilling, labelKey: 'text_1779289915866vguw0lfmz06' },
      { id: PlanDetailsV2SectionId.Entitlements, labelKey: 'text_1779289915866mr56w61hhi5' },
    )
  }

  return [
    { id: PlanDetailsV2SectionId.PlanSettings, labelKey: 'text_177928991586601f21f0x87c' },
    { id: PlanDetailsV2SectionId.SubscriptionFee, labelKey: 'text_1779289915866etwoweh1syv' },
    {
      id: PlanDetailsV2SectionId.FixedCharges,
      labelKey: 'text_1779289915866aj39dyv1wps',
      addLabelKey: 'text_176072970726882uau5y69f1',
      children: fixedCharges.map((charge) => ({
        id: charge.id,
        label: charge.invoiceDisplayName || charge.addOn.name || charge.code || '',
      })),
    },
    {
      id: PlanDetailsV2SectionId.UsageCharges,
      labelKey: 'text_1779289915866ngi8sv5t9lg',
      addLabelKey: 'text_1772133285142oouequiz2t2',
      children: usageCharges.map((charge) => ({
        id: charge.id,
        label: charge.invoiceDisplayName || charge.billableMetric.name || charge.code || '',
      })),
    },
    {
      id: PlanDetailsV2SectionId.AdvancedSettings,
      labelKey: 'text_1779289915866m899iy5nykb',
      children: advancedChildren,
    },
  ]
}

type PlanDetailsV2LeftSidebarProps = {
  isInSubscriptionForm?: boolean
  fixedCharges?: FixedChargeForPlanDetailsSidebarFragment[]
  usageCharges?: UsageChargeForPlanDetailsSidebarFragment[]
  onItemClick: (id: string) => void
  onAddClick?: (id: string) => void
}

export const PlanDetailsV2LeftSidebar = ({
  isInSubscriptionForm = false,
  fixedCharges = [],
  usageCharges = [],
  onItemClick,
  onAddClick,
}: PlanDetailsV2LeftSidebarProps) => {
  const { translate } = useInternationalization()
  const sections = useMemo(
    () => buildSections(isInSubscriptionForm, fixedCharges, usageCharges),
    [isInSubscriptionForm, fixedCharges, usageCharges],
  )
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([PlanDetailsV2SectionId.AdvancedSettings]),
  )

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  const renderItem = (item: SidebarItem, depth = 0) => {
    const isGroup = item.children !== undefined
    const isExpanded = isGroup && expanded.has(item.id)
    const showAddButton = !!item.addLabelKey && !isInSubscriptionForm
    const addLabel = item.addLabelKey ? translate(item.addLabelKey) : undefined

    const iconName = getIconName(isGroup, isExpanded)

    return (
      <div key={item.id} className="flex flex-col gap-1">
        <div
          className="group/bar flex w-full items-stretch rounded-lg hover:bg-grey-200"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 36px' }}
        >
          {isGroup && (
            <Tooltip
              title={translate(
                isExpanded ? 'text_624aa732d6af4e0103d40e61' : 'text_624aa79870f60300a3c4d074',
              )}
              placement="top"
            >
              <button
                type="button"
                data-test={`sidebar-toggle-${item.id}`}
                className="flex items-center justify-center rounded-l-lg px-1 py-2.5 hover:bg-grey-300"
                onClick={() => toggleExpanded(item.id)}
              >
                <Icon
                  name={isExpanded ? 'chevron-down-filled' : 'chevron-right-filled'}
                  size="small"
                  color="dark"
                />
              </button>
            </Tooltip>
          )}
          <button
            type="button"
            className="flex flex-1 items-center gap-2 px-2 py-1 text-left"
            style={!isGroup ? { paddingLeft: 24 + depth * 16 } : undefined}
            onClick={() => onItemClick(item.id)}
          >
            <Icon name={iconName} size="small" color="dark" />
            <Typography variant="caption" color="grey600" noWrap>
              {item.label ?? (item.labelKey ? translate(item.labelKey) : '')}
            </Typography>
          </button>
          {showAddButton && addLabel && (
            <Tooltip title={addLabel} placement="top">
              <button
                type="button"
                data-test={`sidebar-add-${item.id}`}
                className="flex items-center justify-center rounded-r-lg px-1 py-2.5 hover:bg-grey-300"
                onClick={() => onAddClick?.(item.id)}
              >
                <Icon name="plus" size="small" color="dark" />
              </button>
            </Tooltip>
          )}
        </div>
        {isExpanded && item.children && item.children.length > 0 && (
          <div className="flex flex-col gap-1">
            {item.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav
      className="sticky top-0 flex h-screen w-64 flex-col gap-1 border-r border-grey-300 pr-4 pt-4"
      aria-label="Plan sections"
    >
      {sections.map((item) => renderItem(item))}
    </nav>
  )
}

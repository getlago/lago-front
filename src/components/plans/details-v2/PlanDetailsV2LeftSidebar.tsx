import { gql } from '@apollo/client'
import { Icon, IconName } from 'lago-design-system'
import { useMemo, useState } from 'react'

import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import {
  EntitlementForPlanDetailsSidebarFragment,
  FixedChargeForPlanDetailsSidebarFragment,
  UsageChargeForPlanDetailsSidebarFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { getEntitlementSectionId, PlanDetailsV2SectionId } from './sidebarSections'

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

  fragment EntitlementForPlanDetailsSidebar on PlanEntitlement {
    code
    name
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

// Every row is full-width so the hover background is identical across groups and
// leaves; depth is expressed purely as left padding on the row content, and the tree
// guide line is an absolute overlay (it must sit ON TOP of the hover background, like
// GitHub's PR file tree), never a container that insets the row.
const SIDEBAR_INDENT_STEP = 20
const SIDEBAR_LEAF_BASE_PADDING = 24

const getLeafPaddingLeft = (depth: number): number =>
  SIDEBAR_LEAF_BASE_PADDING + depth * SIDEBAR_INDENT_STEP

// x of the vertical guide line for a children block whose items sit at `childDepth`.
const getGuideLineLeft = (childDepth: number): number => 10 + (childDepth - 1) * SIDEBAR_INDENT_STEP

const getIconName = (isGroup: boolean, isExpanded: boolean): IconName => {
  if (!isGroup) return 'file'

  return isExpanded ? 'folder-open' : 'folder-close'
}

const buildSections = (
  isInSubscriptionForm: boolean,
  fixedCharges: FixedChargeForPlanDetailsSidebarFragment[],
  usageCharges: UsageChargeForPlanDetailsSidebarFragment[],
  entitlements: EntitlementForPlanDetailsSidebarFragment[],
): SidebarItem[] => {
  const sections: SidebarItem[] = [
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
    // Minimum commitment lives at the root level now (no "Advanced settings" folder).
    { id: PlanDetailsV2SectionId.MinimumCommitment, labelKey: 'text_17792899158664ii2pmrd2le' },
  ]

  if (!isInSubscriptionForm) {
    sections.push(
      { id: PlanDetailsV2SectionId.ProgressiveBilling, labelKey: 'text_1779289915866vguw0lfmz06' },
      {
        id: PlanDetailsV2SectionId.Entitlements,
        labelKey: 'text_1779289915866mr56w61hhi5',
        addLabelKey: 'text_1753864223060devvklm7vk0',
        children: entitlements.map((entitlement) => ({
          id: getEntitlementSectionId(entitlement.code),
          label: entitlement.name || entitlement.code,
        })),
      },
    )
  }

  return sections
}

type PlanDetailsV2LeftSidebarProps = {
  isInSubscriptionForm?: boolean
  fixedCharges?: FixedChargeForPlanDetailsSidebarFragment[]
  usageCharges?: UsageChargeForPlanDetailsSidebarFragment[]
  entitlements?: EntitlementForPlanDetailsSidebarFragment[]
  onItemClick: (id: string) => void
  onAddClick?: (id: string) => void
}

export const PlanDetailsV2LeftSidebar = ({
  isInSubscriptionForm = false,
  fixedCharges = [],
  usageCharges = [],
  entitlements = [],
  onItemClick,
  onAddClick,
}: PlanDetailsV2LeftSidebarProps) => {
  const { translate } = useInternationalization()
  const sections = useMemo(
    () => buildSections(isInSubscriptionForm, fixedCharges, usageCharges, entitlements),
    [isInSubscriptionForm, fixedCharges, usageCharges, entitlements],
  )
  // Folders start collapsed; the user expands what they need.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

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
          className="group/bar flex h-8 w-full items-stretch rounded-lg hover:bg-grey-200"
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
            // Leaves pad left to clear the chevron column and step in per depth; groups
            // rely on the chevron for their left slot. The row itself stays full-width.
            style={!isGroup ? { paddingLeft: getLeafPaddingLeft(depth) } : undefined}
            // BIL-159: clicking a folder row expands/collapses it (no scroll). Only leaf
            // items navigate to (open + scroll to) their section.
            onClick={() => (isGroup ? toggleExpanded(item.id) : onItemClick(item.id))}
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
          <div className="relative flex flex-col gap-1">
            {/* Continuous tree guide line. z-10 lifts it above the rows' hover
                background: each row is its own stacking context (content-visibility:auto
                ⇒ contain:paint), so a plain positioned sibling would paint under them. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-10 w-px bg-grey-300"
              style={{ left: getGuideLineLeft(depth + 1) }}
            />
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

import { Icon } from 'lago-design-system'
import { useMemo, useState } from 'react'

import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import { PlanDetailsV2SectionId } from './sidebarSections'

type SidebarItem = {
  id: PlanDetailsV2SectionId
  labelKey: string
  children?: SidebarItem[]
  addLabelKey?: string
}

const buildSections = (isInSubscriptionForm: boolean): SidebarItem[] => {
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
      addLabelKey: 'text_17793007079352nuwx5wx9uj',
      children: [],
    },
    {
      id: PlanDetailsV2SectionId.UsageCharges,
      labelKey: 'text_1779289915866ngi8sv5t9lg',
      addLabelKey: 'text_1779300707935ah1fv0kiyz6',
      children: [],
    },
    {
      id: PlanDetailsV2SectionId.AdvancedSettings,
      labelKey: 'text_1779289915866m899iy5nykb',
      children: advancedChildren,
    },
  ]
}

type PlanDetailsV2LeftSidebarProps = {
  activeSectionId: string
  isInSubscriptionForm?: boolean
  onItemClick: (id: string) => void
  onAddClick?: (id: PlanDetailsV2SectionId) => void
}

export const PlanDetailsV2LeftSidebar = ({
  activeSectionId,
  isInSubscriptionForm = false,
  onItemClick,
  onAddClick,
}: PlanDetailsV2LeftSidebarProps) => {
  const { translate } = useInternationalization()
  const sections = useMemo(() => buildSections(isInSubscriptionForm), [isInSubscriptionForm])
  const [expanded, setExpanded] = useState<Set<PlanDetailsV2SectionId>>(
    () => new Set([PlanDetailsV2SectionId.AdvancedSettings]),
  )

  const toggleExpanded = (id: PlanDetailsV2SectionId) => {
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
    const isActive = activeSectionId === item.id
    const isExpanded = expanded.has(item.id)
    const showAddButton = !!item.addLabelKey && !isInSubscriptionForm && !!onAddClick

    if (!isGroup) {
      return (
        <button
          key={item.id}
          type="button"
          aria-current={isActive ? 'true' : undefined}
          className={tw(
            'flex w-full items-center gap-2 rounded-lg px-3 py-1 text-left hover:bg-grey-100',
            isActive && 'bg-grey-100',
          )}
          style={{ paddingLeft: 24 + depth * 16 }}
          onClick={() => onItemClick(item.id)}
        >
          <Icon name="file" size="small" color="dark" />
          <Typography variant="body" color={isActive ? 'grey700' : 'grey600'}>
            {translate(item.labelKey)}
          </Typography>
        </button>
      )
    }

    return (
      <div key={item.id} className="flex flex-col gap-1">
        <div className="flex w-full items-stretch">
          <button
            type="button"
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${translate(item.labelKey)}`}
            className="flex items-center justify-center rounded-md px-1 py-2.5 hover:bg-grey-100"
            onClick={() => toggleExpanded(item.id)}
          >
            <Icon
              name={isExpanded ? 'chevron-down-filled' : 'chevron-right-filled'}
              size="small"
              color="dark"
            />
          </button>
          <button
            type="button"
            aria-current={isActive ? 'true' : undefined}
            className={tw(
              'flex flex-1 items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-grey-100',
              isActive && 'bg-grey-100',
            )}
            onClick={() => onItemClick(item.id)}
          >
            <Icon name={isExpanded ? 'folder-open' : 'folder-close'} size="small" color="dark" />
            <Typography variant="body" color={isActive ? 'grey700' : 'grey600'}>
              {translate(item.labelKey)}
            </Typography>
          </button>
          {showAddButton && (
            <Tooltip title={item.addLabelKey && translate(item.addLabelKey)} placement="top">
              <button
                type="button"
                className="flex items-center justify-center rounded-md px-1 py-2.5 hover:bg-grey-100"
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
    <nav className="sticky top-12 flex w-56 flex-col gap-1 self-start border-r border-grey-300 py-4 pr-4">
      {sections.map((item) => renderItem(item))}
    </nav>
  )
}

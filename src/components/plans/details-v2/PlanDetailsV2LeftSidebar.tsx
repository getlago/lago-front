import { useMemo, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import { PlanDetailsV2SectionId } from './sidebarSections'

type SidebarItem = {
  id: PlanDetailsV2SectionId
  labelKey: string
  children?: SidebarItem[]
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
    { id: PlanDetailsV2SectionId.FixedCharges, labelKey: 'text_1779289915866aj39dyv1wps' },
    { id: PlanDetailsV2SectionId.UsageCharges, labelKey: 'text_1779289915866ngi8sv5t9lg' },
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
}

export const PlanDetailsV2LeftSidebar = ({
  activeSectionId,
  isInSubscriptionForm = false,
  onItemClick,
}: PlanDetailsV2LeftSidebarProps) => {
  const { translate } = useInternationalization()
  const sections = useMemo(() => buildSections(isInSubscriptionForm), [isInSubscriptionForm])
  const [expanded, setExpanded] = useState<Set<PlanDetailsV2SectionId>>(
    () => new Set([PlanDetailsV2SectionId.AdvancedSettings]),
  )

  const renderItem = (item: SidebarItem, depth = 0) => {
    const isGroup = !!item.children?.length
    const isActive = activeSectionId === item.id
    const isExpanded = expanded.has(item.id)

    return (
      <div key={item.id} className="flex flex-col">
        <Button
          variant="quaternary"
          align="left"
          fullWidth
          aria-current={isActive ? 'true' : undefined}
          startIcon={isGroup ? (isExpanded ? 'chevron-down' : 'chevron-right') : 'document'}
          className={tw('justify-start', isActive && 'bg-grey-100')}
          style={{ paddingLeft: 12 + depth * 16 }}
          onClick={() => {
            if (isGroup) {
              setExpanded((prev) => {
                const next = new Set(prev)
                if (next.has(item.id)) {
                  next.delete(item.id)
                } else {
                  next.add(item.id)
                }
                return next
              })
            }
            onItemClick(item.id)
          }}
        >
          {translate(item.labelKey)}
        </Button>
        {isGroup && isExpanded && (
          <div className="flex flex-col">
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav
      className="sticky top-12 flex w-56 flex-col gap-1 self-start"
      aria-label="Plan sections"
    >
      {sections.map((item) => renderItem(item))}
    </nav>
  )
}

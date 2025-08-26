import { Button } from 'lago-design-system'

export const ChatShortcut = () => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="tertiary" size="small">
        Revenue & Insights
      </Button>
      <Button variant="tertiary" size="small">
        Promotions & Adjustments
      </Button>
      <Button variant="tertiary" size="small">
        Customer Management
      </Button>
      <Button variant="tertiary" size="small">
        Pricing & Packages
      </Button>
      <Button variant="tertiary" size="small">
        Billing & Collections
      </Button>
      <Button variant="tertiary" size="small">
        Subscriptions & Usage
      </Button>
    </div>
  )
}

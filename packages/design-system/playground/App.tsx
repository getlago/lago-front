import { ALL_ICONS, Icon, IconName } from '~/components'

export default function App() {
  return (
    <div className="mx-auto max-w-screen-md p-4">
      <div className="mb-4">Icons</div>
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.keys(ALL_ICONS).map((iconName) => (
          <Icon key={iconName} name={iconName as IconName} />
        ))}
      </div>
      <div className="mb-4">Colors</div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Icon name="plug" color="success" />
        <Icon name="plug" color="error" />
        <Icon name="plug" color="warning" />
        <Icon name="plug" color="info" />
        <Icon name="plug" color="light" />
        <Icon name="plug" color="dark" />
        <Icon name="plug" color="skeleton" />
        <Icon name="plug" color="disabled" />
        <Icon name="plug" color="input" />
        <Icon name="plug" color="primary" />
      </div>
      <div className="mb-4">Animation</div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Icon name="processing" animation="spin" />
        <Icon name="star-filled" animation="pulse" />
      </div>
      <div className="mb-4">Size</div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Icon name="puzzle" size="small" />
        <Icon name="puzzle" size="medium" />
        <Icon name="puzzle" size="large" />
      </div>
    </div>
  )
}

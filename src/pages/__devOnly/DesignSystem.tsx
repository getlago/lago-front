import styled, { css } from 'styled-components'
import { useFormik } from 'formik'
import { generatePath } from 'react-router-dom'
import { object, string } from 'yup'

import Stripe from '~/public/images/stripe.svg'
import {
  Avatar,
  Typography,
  ButtonLink,
  NavigationTab,
  Drawer,
  Button,
  Dialog,
  Tooltip,
  Skeleton,
  Popper,
  Icon,
  ALL_ICONS,
  Chip,
  Alert,
  Status,
  Selector,
  ShowMoreText,
  Table,
  IconName,
} from '~/components/designSystem'
import { theme, PageHeader, MenuPopper } from '~/styles'
import {
  DatePickerField,
  TextInputField,
  ComboBoxField,
  SwitchField,
  RadioField,
  ButtonSelectorField,
} from '~/components/form'
import { ONLY_DEV_DESIGN_SYSTEM_ROUTE, ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'
import { addToast, TToast } from '~/core/apolloClient'

const POSSIBLE_TOAST: TToast[] = [
  {
    id: 'toast0',
    severity: 'success',
    message: '🍞 Success',
  },
  {
    id: 'toast1',
    severity: 'info',
    message: '🍞 Info',
  },
  {
    id: 'toast2',
    severity: 'danger',
    message: '🍞 Danger',
  },
  {
    id: 'toast3',
    severity: 'success',
    message: '👍 Congrats you did something',
  },
  {
    id: 'toast4',
    severity: 'info',
    message: '👀 I see you',
  },
  {
    id: 'toast5',
    severity: 'danger',
    message: '👿 Please stop doing that',
  },
]

const FORM_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'form' })
const LINK_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'links' })
const DISPLAY_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'display' })
const BUTTON_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'button' })
const TYPOGRAPHY_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'typography' })
const ICONS_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'icons' })
const AVATAR_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'avatar' })
const SKELETON_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'skeleton' })
const TABLE_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'table' })

const DesignSystem = () => {
  const formikProps = useFormik({
    initialValues: {
      date: undefined,
      input: undefined,
      inputNumber: undefined,
      switch: true,
      combobox: undefined,
      radio: false,
      buttonSelector: undefined,
      buttonSelector2: 'time',
    },
    validationSchema: object().shape({
      date: string()
        .required()
        .matches(/1992-05-26/, 'Sorry, you owe her a beer 🍺'),
      input: string()
        .required()
        .matches(/whatever/, "I thought you'd be more fun... 😏"),
      radio: string()
        .required()
        .matches(/whatever/, 'Really ? 🙄'),
      combobox: string().required().matches(/Mike/, "No, it's Mike 😡"),
      buttonSelector: string()
        .required()
        .matches(/whatever/, 'Interesting... '),
    }),
    onSubmit: () => {},
  })

  return (
    <>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          Design System components
        </Typography>
        <Typography variant="caption">Only visible in dev mode</Typography>
      </PageHeader>
      <NavigationTab
        name="design-system"
        tabs={[
          {
            title: 'Display',
            icon: 'apps',
            link: DISPLAY_TAB_URL,
            match: [DISPLAY_TAB_URL, ONLY_DEV_DESIGN_SYSTEM_ROUTE],
            component: (
              <Container>
                <GroupTitle variant="headline">Poppers</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Drawer title="Imma supa drawa" opener={<Button>Drawer</Button>}>
                    <iframe
                      title="hey you"
                      src="https://giphy.com/embed/nNxT5qXR02FOM"
                      width="480"
                      height="399"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </Drawer>
                  <Dialog
                    opener={<Button>Dialog</Button>}
                    title="Imma dialog"
                    description="And I'm happy to see you"
                    actions={({ closeDialog }) => (
                      <>
                        <Button variant="quaternary" onClick={() => closeDialog()}>
                          Oups
                        </Button>
                        <Button>Ok bye</Button>
                      </>
                    )}
                  >
                    <GroupTitle>
                      <iframe
                        title="Happy to see you"
                        src="https://giphy.com/embed/l2Jhok92mZ2PZHjDG"
                        width="480"
                        height="256"
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </GroupTitle>
                  </Dialog>
                  <Tooltip placement="top-end" title="Hola muchacho 🥸!">
                    <Button variant="secondary">Tooltip</Button>
                  </Tooltip>
                  <Popper
                    PopperProps={{ placement: 'bottom-end' }}
                    opener={<Button variant="tertiary">Popper</Button>}
                  >
                    {({ closePopper }) => (
                      <MenuPopper>
                        <Button startIcon="paperclip" variant="quaternary" align="left" fullWidth>
                          I&apos;m lazy
                        </Button>
                        <Button
                          startIcon="plug"
                          variant="quaternary"
                          align="left"
                          fullWidth
                          onClick={() => closePopper()}
                        >
                          I close the popper
                        </Button>
                      </MenuPopper>
                    )}
                  </Popper>
                  <Tooltip
                    placement="top-end"
                    title="Will trigger only if the toast does not already exists"
                  >
                    <Button
                      variant="tertiary"
                      onClick={() => {
                        const toastIndex = Math.floor(Math.random() * POSSIBLE_TOAST.length)

                        addToast(POSSIBLE_TOAST[toastIndex])
                      }}
                    >
                      I trigger a toast
                    </Button>
                  </Tooltip>
                </Block>

                <GroupTitle variant="headline">Chips</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Chip label="I'm a 🍟" />
                  <Chip label="I have an icon" icon="scissor" />
                  <Chip label="I have an icon" icon="scissor" onClose={() => {}} />
                </Block>

                <GroupTitle variant="headline">Alert</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Alert type="info">I&apos;m an info alert</Alert>
                  <Alert type="success">I&apos;m a success alert</Alert>
                  <Alert type="warning">I&apos;m a warning alert</Alert>
                  <Alert type="danger">I&apos;m a danger alert</Alert>
                </Block>

                <GroupTitle variant="headline">Status</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Status type="running" />
                  <Status type="paused" />
                  <Status type="failed" />
                  <Status type="error" />
                  <Status type="running" label="I can be labelled with anything" />
                </Block>

                <GroupTitle variant="headline">Selector</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Selector
                    title="A simple selector"
                    subtitle="with more info"
                    icon={
                      <Avatar variant="connector">
                        <Stripe />
                      </Avatar>
                    }
                    endIcon={<Chip label="With chip" />}
                    onClick={() => {}}
                    fullWidth
                  />
                  <Selector
                    title="A simple selector selected"
                    subtitle="Subtitle first"
                    titleFirst={false}
                    selected
                    icon="target"
                    endIcon={<Chip label="With chip" />}
                    onClick={() => {}}
                  />
                  <Selector
                    title="A simple selector disabled"
                    subtitle="Subtitle first"
                    titleFirst={false}
                    disabled
                    icon={
                      <Avatar variant="connector">
                        <Stripe />
                      </Avatar>
                    }
                    endIcon={<Chip label="With chip" />}
                    onClick={() => {}}
                  />
                </Block>

                <GroupTitle variant="headline">ShowMoreText</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <ShowMoreText
                    text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium praesentium minus necessitatibus. Placeat, ratione ipsam dolor, quas iste obcaecati tenetur esse tempora quidem eveniet iure quasi repellat debitis doloribus? Distinctio iure quisquam ipsam minus dolorum corporis, eligendi iusto. Animi assumenda reprehenderit atque corrupti, a iste illo porro facilis maxime. Quod eaque ratione, ullam tempore blanditiis placeat odit, assumenda labore accusamus libero nostrum qui et architecto inventore atque, veritatis vitae nisi quas veniam sit! Quasi natus, neque sed soluta perspiciatis officiis?"
                    limit={30}
                  />
                </Block>
                <Block $marginBottom={theme.spacing(6)}>
                  <ShowMoreText
                    text="Custom show more. Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium praesentium minus necessitatibus. Placeat, ratione ipsam dolor, quas iste obcaecati tenetur esse tempora quidem eveniet iure quasi repellat debitis doloribus? Distinctio iure quisquam ipsam minus dolorum corporis, eligendi iusto. Animi assumenda reprehenderit atque corrupti, a iste illo porro facilis maxime. Quod eaque ratione, ullam tempore blanditiis placeat odit, assumenda labore accusamus libero nostrum qui et architecto inventore atque, veritatis vitae nisi quas veniam sit! Quasi natus, neque sed soluta perspiciatis officiis?"
                    limit={30}
                    showMore="Please show more"
                  />
                </Block>
                <Block $marginBottom={theme.spacing(6)}>
                  <ShowMoreText
                    text="Custom show more with button. Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium praesentium minus necessitatibus. Placeat, ratione ipsam dolor, quas iste obcaecati tenetur esse tempora quidem eveniet iure quasi repellat debitis doloribus? Distinctio iure quisquam ipsam minus dolorum corporis, eligendi iusto. Animi assumenda reprehenderit atque corrupti, a iste illo porro facilis maxime. Quod eaque ratione, ullam tempore blanditiis placeat odit, assumenda labore accusamus libero nostrum qui et architecto inventore atque, veritatis vitae nisi quas veniam sit! Quasi natus, neque sed soluta perspiciatis officiis?"
                    limit={30}
                    showMore={<Button variant="secondary" size="small" icon="plus" />}
                  />
                </Block>
              </Container>
            ),
          },
          {
            title: 'Skeleton',
            icon: 'processing',
            link: SKELETON_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Skeleton</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Skeleton variant="connectorAvatar" size="small" />
                  <Skeleton variant="connectorAvatar" size="medium" />
                  <Skeleton variant="connectorAvatar" size="large" />
                  <Skeleton variant="userAvatar" size="small" />
                  <Skeleton variant="userAvatar" size="medium" />
                  <Skeleton variant="userAvatar" size="large" />
                </Block>
                <div>
                  <Skeleton variant="rectangular" width="320px" height="60px" marginBottom="16px" />
                  <Skeleton variant="circular" width="60px" height="60px" marginBottom="16px" />
                  <Skeleton variant="text" width={120} height={12} marginBottom="16px" />
                  <Skeleton variant="text" width="50%" height={12} marginBottom="16px" />
                </div>
              </Container>
            ),
          },
          {
            title: 'Table',
            icon: 'table',
            link: TABLE_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Table</GroupTitle>
                <Table
                  name="graduated-charge-table"
                  data={[
                    {
                      name: 'Barney Stinson',
                      job: 'We will never know',
                      icon: 'plug',
                    },
                    {
                      name: 'Lily Aldrin',
                      job: 'Kindergarden teacher',
                      icon: 'book',
                    },
                    {
                      name: 'Marshal Eriksen',
                      job: 'Lawyer',
                      icon: 'bank',
                    },
                    {
                      name: 'Robin Scherbatzki',
                      job: 'News anchor',
                      icon: 'rocket',
                    },
                    {
                      name: 'Ted Mosby',
                      job: 'Architect',
                      icon: 'company',
                    },
                  ]}
                  onDeleteRow={() => {}}
                  columns={[
                    {
                      title: (
                        <TableTitle variant="bodyHl" color="grey700">
                          Name
                        </TableTitle>
                      ),
                      size: 300,
                      content: (row) => (
                        <TableContent>
                          <Avatar variant="user" identifier={row.name} size="small" />
                          <Typography>{row.name}</Typography>
                        </TableContent>
                      ),
                    },
                    {
                      title: (
                        <TableTitle variant="bodyHl" color="grey700">
                          Job
                        </TableTitle>
                      ),
                      size: 124,
                      mapKey: 'job',
                    },
                    {
                      title: (
                        <TableTitle variant="bodyHl" color="grey700">
                          Icon
                        </TableTitle>
                      ),
                      size: 124,
                      content: (row) => (
                        <TableContent>
                          <Icon color="primary" name={row.icon as IconName} />
                        </TableContent>
                      ),
                    },
                  ]}
                />
              </Container>
            ),
          },
          {
            title: 'Avatar',
            icon: 'user',
            link: AVATAR_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Avatar</GroupTitle>
                <GroupTitle variant="subhead">Variants</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Tooltip title="Connector with icon">
                    <Avatar variant="connector">
                      <Icon name="pulse" color="dark" />
                    </Avatar>
                  </Tooltip>
                  <Tooltip title="Connector with image">
                    <Avatar variant="connector">
                      <Stripe />
                    </Avatar>
                  </Tooltip>
                  <Tooltip title="Company">
                    <Avatar
                      variant="company"
                      identifier="Lago Corp"
                      initials={'Lago Corp'.split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
                    />
                  </Tooltip>
                  <Tooltip title="User">
                    <Avatar variant="user" identifier="Morguy" initials="ML" />
                  </Tooltip>
                </Block>

                <GroupTitle variant="subhead">Size</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Avatar variant="user" size="small" identifier="Morguy" initials="ML" />
                  <Avatar variant="user" size="medium" identifier="Morguy" initials="ML" />
                  <Avatar variant="user" size="large" identifier="Morguy" initials="ML" />
                  <Avatar variant="company" size="small" identifier="Lago Corp" />
                  <Avatar variant="company" size="medium" identifier="Lago Corp" />
                  <Avatar variant="company" size="large" identifier="Lago Corp" />
                  <Avatar variant="connector" size="medium">
                    <Icon name="pulse" color="dark" />
                  </Avatar>
                  <Avatar variant="connector" size="large">
                    <Icon name="pulse" color="dark" />
                  </Avatar>
                  <Avatar variant="connector" size="medium">
                    <Stripe />
                  </Avatar>
                  <Avatar variant="connector" size="large">
                    <Stripe />
                  </Avatar>
                </Block>

                <GroupTitle variant="subhead">Colors</GroupTitle>
                <GroupTitle>
                  Color is defined automatically based on initials or identifier
                </GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Avatar variant="company" identifier="AA" />
                  <Avatar variant="company" identifier="AB" />
                  <Avatar variant="company" identifier="AC" />
                  <Avatar variant="company" identifier="AD" />
                  <Avatar variant="company" identifier="AE" />
                  <Avatar variant="company" identifier="AF" />
                  <Avatar variant="company" identifier="AG" />
                  <Avatar variant="company" identifier="AH" />
                </Block>
              </Container>
            ),
          },
          {
            title: 'Icons',
            icon: 'star-filled',
            link: ICONS_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Icons</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  {Object.keys(ALL_ICONS).map((iconName, i) => (
                    <Icon key={`icon-${i}`} name={iconName as IconName} />
                  ))}
                </Block>
                <GroupTitle variant="headline">Colors</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
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
                </Block>
                <GroupTitle variant="headline">Animation</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Icon name="processing" animation="spin" />
                  <Icon name="star-filled" animation="pulse" />
                </Block>

                <GroupTitle variant="headline">Size</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Icon name="puzzle" size="small" />
                  <Icon name="puzzle" size="medium" />
                  <Icon name="puzzle" size="large" />
                </Block>
              </Container>
            ),
          },
          {
            title: 'Typography',
            icon: 'pen',
            link: TYPOGRAPHY_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Typography</GroupTitle>
                <Block>
                  <VerticalBlock $marginRight={theme.spacing(12)}>
                    <GroupTitle variant="subhead">Variant</GroupTitle>
                    <Typography variant="headline">Headline</Typography>
                    <Typography variant="subhead">Subhead</Typography>
                    <Typography variant="bodyHl">BodyHl</Typography>
                    <Typography variant="body">Body</Typography>
                    <Typography variant="button">Button</Typography>
                    <Typography variant="caption">Caption</Typography>
                    <Typography variant="captionHl">CaptionHl</Typography>
                    <Typography variant="captionCode">CaptionCode</Typography>
                    <Typography variant="note">Note</Typography>
                    <Typography
                      color="textSecondary"
                      html="I'm a bit <b>special</b>, I <i>understand</i> html"
                    />
                  </VerticalBlock>
                  <VerticalBlock>
                    <GroupTitle variant="subhead">Color</GroupTitle>
                    <Typography color="textSecondary">color textSecondary</Typography>
                    <Typography color="textPrimary">color textPrimary</Typography>
                    <Typography color="primary600">color primary600</Typography>
                    <Typography color="grey700">color grey700</Typography>
                    <Typography color="grey600">color grey600</Typography>
                    <Typography color="grey500">color grey500</Typography>
                    <Typography color="disabled">color disabled</Typography>
                    <Typography color="danger600">color danger600</Typography>
                    <Typography color="contrast">color contrast</Typography>
                  </VerticalBlock>
                </Block>
              </Container>
            ),
          },
          {
            title: 'Buttons',
            icon: 'target',
            link: BUTTON_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Button</GroupTitle>

                <GroupTitle variant="subhead">General use</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Button variant="primary" size="large">
                    Large
                  </Button>
                  <Button variant="primary" size="medium">
                    Medium
                  </Button>
                  <Button variant="primary" icon="coupon" size="large" />
                  <Button variant="primary" icon="download" size="medium" />
                  <Button variant="primary" icon="trash" size="small" />
                  <Button variant="primary" endIcon="rocket">
                    End Icon
                  </Button>
                  <Button variant="primary" startIcon="rocket">
                    Start Icon
                  </Button>
                  <Button variant="primary" loading>
                    Loading
                  </Button>
                  <Button
                    variant="primary"
                    onClick={async () => await new Promise((r) => setTimeout(r, 1000))}
                  >
                    With Promise
                  </Button>
                </Block>

                <GroupTitle variant="subhead">Primary</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Button variant="primary">Default</Button>
                  <Button variant="primary" disabled>
                    Disabled
                  </Button>
                  <Button variant="primary" danger>
                    Danger
                  </Button>
                </Block>

                <GroupTitle variant="subhead">Secondary</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Button variant="secondary">Default</Button>
                  <Button variant="secondary" disabled>
                    Disabled
                  </Button>
                  <Button variant="secondary" danger>
                    Danger
                  </Button>
                </Block>

                <GroupTitle variant="subhead">Tertiary</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Button variant="tertiary">Default</Button>
                  <Button variant="tertiary" disabled>
                    Disabled
                  </Button>
                  <Button variant="tertiary" danger>
                    Danger
                  </Button>
                </Block>

                <GroupTitle variant="subhead">Quaternary</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Button variant="quaternary">Default</Button>
                  <Button variant="quaternary" disabled>
                    Disabled
                  </Button>
                  <Button variant="quaternary" danger>
                    Danger
                  </Button>
                </Block>
              </Container>
            ),
          },
          {
            title: 'Form',
            icon: 'switch',
            link: FORM_TAB_URL,
            component: (
              <Container>
                <Form onSubmit={(e) => e.preventDefault()}>
                  <GroupTitle variant="headline">Form</GroupTitle>

                  <GroupTitle variant="subhead">ButtonSelector</GroupTitle>
                  <Block $marginBottom={theme.spacing(6)}>
                    <ButtonSelectorField
                      name="buttonSelector"
                      label="You'd rather..."
                      infoText="You WILL be judge on the answer"
                      formikProps={formikProps}
                      options={[
                        {
                          label: '...talk like Yoda',
                          value: 'yoda',
                        },
                        {
                          label: '...Breath like Darth Vader',
                          value: 'vador',
                        },
                      ]}
                    />
                    <ButtonSelectorField
                      name="buttonSelector"
                      label="You'd rather..."
                      formikProps={formikProps}
                      disabled
                      options={[
                        {
                          label: '...talk like Yoda',
                          value: 'yoda',
                        },
                        {
                          label: '...Breath like Darth Vader',
                          value: 'vador',
                        },
                      ]}
                    />
                  </Block>

                  <GroupTitle variant="subhead">Switch</GroupTitle>
                  <Block $marginBottom={theme.spacing(6)}>
                    <SwitchField
                      name="switch"
                      formikProps={formikProps}
                      label="How do you feel today ?"
                      subLabel={formikProps.values.switch ? '' : 'Wanna talk about it ? Call 911.'}
                    />
                    <SwitchField
                      name="switch"
                      formikProps={formikProps}
                      label="Disabled"
                      disabled
                    />
                    <SwitchField
                      name="switch"
                      formikProps={formikProps}
                      label="How do you feel today ?"
                      subLabel="I really wanna know"
                      labelPosition="left"
                    />
                  </Block>

                  <GroupTitle variant="subhead">Combobox</GroupTitle>
                  <Block $marginBottom={theme.spacing(6)}>
                    <ComboBoxField
                      name="combobox"
                      data={[{ value: 'Him' }, { value: 'Her' }, { value: 'Mike' }]}
                      label="Who's the best designer in town ?"
                      placeholder="Choose wisely"
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="combobox"
                      data={[]}
                      label="Loading"
                      placeholder="But who is it anyway ?"
                      loadingText="You're clearely overthinking"
                      loading
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="combobox"
                      data={[]}
                      label="Disabled"
                      placeholder="You don't get to answer"
                      disabled
                      formikProps={formikProps}
                    />
                  </Block>

                  <GroupTitle variant="subhead">Radio</GroupTitle>
                  <Block $marginBottom={theme.spacing(6)}>
                    <RadioField
                      name="radio"
                      formikProps={formikProps}
                      value="chocolatine"
                      label="Chocolatine"
                    />
                    <RadioField
                      name="radio"
                      formikProps={formikProps}
                      value="painauchocolat"
                      label="Pain au chocolat"
                    />
                    <RadioField
                      value="painauchocolat"
                      name="radio"
                      formikProps={formikProps}
                      label="Disabled"
                      disabled
                    />
                  </Block>

                  <GroupTitle variant="subhead">DatePicker</GroupTitle>
                  <Block $childMinWidth="325px" $marginBottom={theme.spacing(6)}>
                    <DatePickerField
                      name="date"
                      label="When is Morguy's birthday ?"
                      formikProps={formikProps}
                    />
                    <DatePickerField
                      name="date"
                      label="DatePicker with helper"
                      helperText="I'm here to help"
                      formikProps={formikProps}
                    />
                    <DatePickerField
                      name="date"
                      label="DatePicker disabled"
                      disabled
                      formikProps={formikProps}
                    />
                  </Block>

                  <GroupTitle variant="subhead">TextInput</GroupTitle>
                  <Block $marginBottom={theme.spacing(6)}>
                    <TextInputField
                      label="Label"
                      placeholder="Type something"
                      name="input"
                      formikProps={formikProps}
                    />
                    <TextInputField
                      label="With formatter"
                      name="inputNumber"
                      placeholder="Type number"
                      beforeChangeFormatter={['decimal']}
                      formikProps={formikProps}
                    />
                    <TextInputField
                      label="Cleanable"
                      name="input"
                      placeholder="Type something"
                      formikProps={formikProps}
                      cleanable
                    />
                    <TextInputField
                      label="Password"
                      placeholder="Type something"
                      name="input"
                      formikProps={formikProps}
                      password
                    />
                    <TextInputField
                      label="With infotext"
                      placeholder="Type something"
                      name="input"
                      formikProps={formikProps}
                      infoText="I'm giving you some infos"
                    />
                    <TextInputField
                      label="Disabled"
                      placeholder="Type something"
                      name="input"
                      formikProps={formikProps}
                      disabled
                    />
                    <TextInputField
                      label="With helpertext"
                      placeholder="Type something"
                      name="input"
                      formikProps={formikProps}
                      helperText="I'm here to help"
                    />
                  </Block>

                  <Button onClick={formikProps.submitForm}>Check your answers</Button>
                </Form>
              </Container>
            ),
          },
          {
            title: 'Links',
            icon: 'outside',
            link: LINK_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Links</GroupTitle>
                <GroupTitle variant="subhead">
                  Link in navigation tabs with &#60;ButtonLink/&#62;
                </GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <ButtonLink type="tab" icon="rocket" to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}>
                    Non active Link
                  </ButtonLink>
                  <ButtonLink type="tab" active icon="plug" to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}>
                    Active
                  </ButtonLink>
                  <ButtonLink
                    type="tab"
                    icon="plug"
                    external
                    to="https://www.youtube.com/watch?v=h6fcK_fRYaI&ab_channel=Kurzgesagt%E2%80%93InaNutshell"
                  >
                    External
                  </ButtonLink>
                  <ButtonLink type="tab" disabled to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}>
                    Disabled
                  </ButtonLink>
                </Block>
                <GroupTitle variant="subhead">Button Links with &#60;ButtonLink/&#62;</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <ButtonLink type="button" to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}>
                    Internal
                  </ButtonLink>
                  <ButtonLink
                    type="button"
                    external
                    to="https://www.youtube.com/watch?v=h6fcK_fRYaI&ab_channel=Kurzgesagt%E2%80%93InaNutshell"
                  >
                    External
                  </ButtonLink>

                  <ButtonLink
                    type="button"
                    buttonProps={{ variant: 'tertiary', startIcon: 'bell' }}
                    to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}
                  >
                    With Button Props
                  </ButtonLink>
                </Block>
                <GroupTitle variant="subhead">Simple links with &#60;a/&#62;</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <a href="https://main-app.staging.getlago.com/coupons"> Normal Link </a>
                </Block>
              </Container>
            ),
          },
        ]}
      ></NavigationTab>
    </>
  )
}

const Container = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)};
`

const Form = styled.form`
  > *:first-child {
    margin-bottom: ${theme.spacing(4)};
  }
`

const Block = styled.div<{ $childMinWidth?: string; $marginBottom?: string }>`
  display: flex;
  gap: ${theme.spacing(4)};
  flex-wrap: wrap;

  ${({ $childMinWidth }) =>
    !!$childMinWidth &&
    css`
      > * {
        min-width: ${$childMinWidth};
      }
    `}

  ${({ $marginBottom }) =>
    !!$marginBottom &&
    css`
      > * {
        margin-bottom: ${$marginBottom};
      }
    `}
`

const GroupTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(4)};
`

const VerticalBlock = styled.div<{ $marginRight?: string }>`
  ${({ $marginRight }) =>
    !!$marginRight &&
    css`
      > * {
        margin-right: ${$marginRight};
      }
    `}

  > * {
    margin-bottom: ${theme.spacing(4)};
  }
`

const TableTitle = styled(Typography)`
  padding: 0 ${theme.spacing(4)};
`

const TableContent = styled.div`
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(2)};

  > * {
    margin-right: ${theme.spacing(4)};
  }
`

export default DesignSystem

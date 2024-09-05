/* eslint-disable no-alert */
import { InputAdornment, Stack } from '@mui/material'
import { useFormik } from 'formik'
import { useRef } from 'react'
import { generatePath, Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { boolean, number, object, string } from 'yup'

import {
  Accordion,
  Alert,
  ALL_ICONS,
  Avatar,
  Button,
  ButtonLink,
  ChargeTable,
  Chip,
  Dialog,
  DialogRef,
  Drawer,
  Icon,
  IconName,
  NavigationTab,
  Popper,
  Selector,
  ShowMoreText,
  Skeleton,
  Status,
  StatusType,
  Table,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  ButtonSelectorField,
  Checkbox,
  CheckboxField,
  ComboBoxField,
  DatePickerField,
  JsonEditorField,
  MultipleComboBox,
  MultipleComboBoxField,
  RadioField,
  SwitchField,
  TextInputField,
} from '~/components/form'
import { AmountInputField } from '~/components/form/AmountInput'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { ONLY_DEV_DESIGN_SYSTEM_ROUTE, ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'
import { CurrencyEnum } from '~/generated/graphql'
import {
  chargeTableData,
  currentUsageTableData,
  POSSIBLE_TOAST,
  tableData,
} from '~/pages/__devOnly/fixtures'
import Stripe from '~/public/images/stripe.svg'
import { MenuPopper, PageHeader, theme } from '~/styles'

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
  const dialogRef = useRef<DialogRef>(null)
  const formikProps = useFormik({
    initialValues: {
      checkbox: false,
      amountCents: undefined,
      amountCurrency: CurrencyEnum.Usd,
      date: undefined,
      time: undefined,
      input: undefined,
      inputNumber: undefined,
      switch: true,
      combobox: undefined,
      multipleCombobox: [],
      radio: false,
      buttonSelector: undefined,
      buttonSelector2: 'time',
      checkboxCond1: true,
      checkboxCond2: true,
      json: {
        age: '41 years old',
        home: {
          country: 'United States',
          address: '317 example street',
        },
        friends: [],
      },
      jsonLong: {
        age: '41 years old',
        home: {
          country: 'United States',
          address: '317 example street',
        },
        friends: [
          'Lucille, Ellissa',
          'Korry, Shawn',
          'Auguste, Gina',
          'Guinna, Aime',
          'Faustine, Rozalie',
        ],
      },
      jsonEmpty: undefined,
    },
    validationSchema: object().shape({
      checkbox: boolean().required(),
      amountCurrency: string().required(),
      amountCents: number().required(),
      json: string().required(),
      date: string()
        .required()
        .matches(/1992-05-26/, 'Sorry, you owe her a beer 🍺'),
      time: string().required(),
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
        leftPadding
        name="Design system tab switcher"
        tabs={[
          {
            title: 'Display',
            link: DISPLAY_TAB_URL,
            match: [DISPLAY_TAB_URL, ONLY_DEV_DESIGN_SYSTEM_ROUTE],
            component: (
              <Container>
                <GroupTitle variant="headline">Accordion</GroupTitle>
                <Stack gap={6} marginBottom={6}>
                  <Accordion size="medium" summary="medium accordion">
                    <Typography variant="body">Content of the accordion</Typography>
                  </Accordion>
                  <Accordion size="large" summary="large accordion">
                    <Typography variant="body">Content of the accordion</Typography>
                  </Accordion>
                </Stack>

                <GroupTitle variant="headline">Alert</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Alert
                    fullWidth
                    containerSize={{
                      default: 16,
                      md: 48,
                    }}
                    type="danger"
                    ButtonProps={{
                      label: 'Retry',
                      onClick: () => alert('Retry clicked'),
                    }}
                  >
                    <Stack>
                      <Typography variant="body" color="grey700">
                        Invoice could not be fully refreshed.
                      </Typography>
                      <Typography variant="caption">
                        An issue with your tax provider connection occurred. Please contact the Lago
                        team to solve this issue.
                      </Typography>
                    </Stack>
                  </Alert>
                  <Alert type="info">I&apos;m an info alert</Alert>
                  <Alert type="success">I&apos;m a success alert</Alert>
                  <Alert type="warning">I&apos;m a warning alert</Alert>
                  <Alert type="danger">I&apos;m a danger alert</Alert>
                </Block>

                <GroupTitle variant="headline">Chips</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Chip label="Small" size="small" />
                  <Chip label="Default" />
                  <Chip label="Big" size="big" />
                  <Chip label="I have an icon" icon="scissor" />
                  <Chip
                    label="I have an icon and delete"
                    icon="percentage"
                    onDelete={() => {
                      // eslint-disable-next-line no-console
                      console.log('Chip clicked')
                    }}
                  />
                  <Chip
                    label="Tooltip on icon"
                    icon="scissor"
                    deleteIconLabel="Delete"
                    onDelete={() => {
                      // eslint-disable-next-line no-console
                      console.log('Chip clicked')
                    }}
                  />
                  <Chip
                    error
                    label="I have an error"
                    icon="scissor"
                    onDelete={() => {
                      // eslint-disable-next-line no-console
                      console.log('Chip clicked')
                    }}
                  />
                  <Chip type="secondary" label="Small" size="small" />
                  <Chip type="secondary" label="Default" />
                  <Chip type="secondary" label="Big" size="big" />
                  <Chip
                    type="secondary"
                    label="I have an icon and delete"
                    icon="percentage"
                    onDelete={() => {
                      // eslint-disable-next-line no-console
                      console.log('Chip clicked')
                    }}
                  />
                  <Chip
                    type="secondary"
                    label="Tooltip on icon"
                    icon="scissor"
                    deleteIconLabel="Delete"
                    onDelete={() => {
                      // eslint-disable-next-line no-console
                      console.log('Chip clicked')
                    }}
                  />
                  <Chip
                    error
                    type="secondary"
                    label="I have an error"
                    icon="scissor"
                    onDelete={() => {
                      // eslint-disable-next-line no-console
                      console.log('Chip clicked')
                    }}
                  />
                  <Chip beta label="Small beta" size="small" />
                  <Chip beta label="Beta" />
                  <Chip beta label="Beta big" size="big" />
                </Block>

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
                  <Button onClick={() => dialogRef.current?.openDialog()}>Dialog</Button>
                  <Dialog
                    ref={dialogRef}
                    title="Imma dialog"
                    description="And I'm happy to see you"
                    actions={({ closeDialog }) => (
                      <>
                        <Button variant="quaternary" onClick={() => closeDialog()}>
                          Oups
                        </Button>
                        <Button onClick={() => closeDialog()}>Ok bye</Button>
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
                    title="Non clickable selector"
                    subtitle="Alexandre Monjol"
                    titleFirst={false}
                    icon="user"
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

                <GroupTitle variant="headline">Status</GroupTitle>
                <VerticalBlock>
                  <Block>
                    <GroupTitle variant="bodyHl" color="textSecondary">
                      Success
                    </GroupTitle>
                    <Status
                      type={StatusType.success}
                      label="succeeded"
                      endIcon="warning-unfilled"
                    />
                    <Status type={StatusType.success} label="finalized" />
                    <Status type={StatusType.success} label="active" />
                    <Status type={StatusType.success} label="pay" />
                    <Status type={StatusType.success} label="available" />
                    <Status
                      type={StatusType.success}
                      label="refunded"
                      labelVariables={{ date: '2024-04-12' }}
                    />
                  </Block>
                  <Block>
                    <GroupTitle variant="bodyHl" color="textSecondary">
                      Warning
                    </GroupTitle>
                    <Status type={StatusType.warning} label="failed" endIcon="warning-unfilled" />
                  </Block>
                  <Block>
                    <GroupTitle variant="bodyHl" color="textSecondary">
                      Outline
                    </GroupTitle>
                    <Status type={StatusType.outline} label="draft" endIcon="warning-unfilled" />
                  </Block>
                  <Block>
                    <GroupTitle variant="bodyHl" color="textSecondary">
                      Default
                    </GroupTitle>
                    <Status type={StatusType.default} label="pending" endIcon="warning-unfilled" />
                    <Status type={StatusType.default} label="toPay" />
                    <Status type={StatusType.default} label="n/a" />
                  </Block>
                  <Block>
                    <GroupTitle variant="bodyHl" color="textSecondary">
                      Danger
                    </GroupTitle>
                    <Status type={StatusType.danger} label="disputed" endIcon="warning-unfilled" />
                    <Status type={StatusType.danger} label="disputeLost" />
                    <Status
                      type={StatusType.danger}
                      label="disputeLostOn"
                      labelVariables={{ date: '2024-04-12' }}
                    />
                    <Status type={StatusType.danger} label="terminated" />
                    <Status type={StatusType.danger} label="consumed" />
                    <Status type={StatusType.danger} label="voided" />
                  </Block>
                  <Block>
                    <GroupTitle variant="bodyHl" color="textSecondary">
                      Disabled
                    </GroupTitle>
                    <Status type={StatusType.disabled} label="voided" endIcon="warning-unfilled" />
                  </Block>
                </VerticalBlock>

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
                  <Skeleton variant="circular" width="60px" height="60px" marginBottom="16px" />
                  <Skeleton variant="text" width={120} height={12} marginBottom="16px" />
                  <Skeleton variant="text" width="50%" height={12} marginBottom="16px" />
                </div>
              </Container>
            ),
          },
          {
            title: 'Table',
            link: TABLE_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Table</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <ChargeTable
                    name="graduated-charge-table"
                    data={chargeTableData}
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
                </Block>
                <GroupTitle variant="headline">Display Table</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Table
                    name="display-table"
                    containerSize={{
                      default: 4,
                      md: 48,
                    }}
                    data={tableData}
                    isLoading={false}
                    columns={[
                      {
                        key: 'status',
                        title: 'Status',
                        content: (row) => (
                          // @ts-expect-error
                          <Status label={row.status} type={StatusType.success} />
                        ),
                      },
                      {
                        key: 'id',
                        title: 'Invoice number',
                        content: (row) => <Typography variant="captionCode">{row.id}</Typography>,
                      },
                      {
                        key: 'amount',
                        title: 'Amount',

                        content: (row) => (
                          <Button
                            onClick={() => alert(`You clicked on ${row.amount}`)}
                            size="small"
                            variant="quaternary"
                          >
                            {intlFormatNumber(row.amount)}
                          </Button>
                        ),
                      },
                      {
                        key: 'customer',
                        title: 'Customer',
                        content: (row) => (
                          <Typography variant="captionCode" color="success600">
                            <Link to={'/'}>{row.customer}</Link>
                          </Typography>
                        ),
                      },
                      {
                        key: 'date',
                        title: 'Issuing date',
                        content: (row) => row.date,
                      },
                    ]}
                    onRowAction={(item) => alert(`You clicked on ${item.id}`)}
                    actionColumn={(currentItem) => [
                      currentItem.amount > 1000
                        ? {
                            title: 'Edit',
                            startIcon: 'pen',
                            onAction: (item) => {
                              alert(`You edited ${item.id}`)
                            },
                          }
                        : null,
                      {
                        title: 'Delete',
                        startIcon: 'trash',
                        onAction: (item) => {
                          alert(`You deleted ${item.id}`)
                        },
                      },
                    ]}
                  />
                  <Table
                    name="display-table"
                    containerSize={0}
                    rowSize={72}
                    data={currentUsageTableData}
                    isLoading={false}
                    columns={[
                      {
                        key: 'chargeName',
                        title: 'Customer',
                        content: (row) => (
                          <>
                            <Typography variant="body" color="grey700" noWrap>
                              {row.chargeName}
                            </Typography>
                            <Typography variant="caption" color="grey600" noWrap>
                              {row.chargeCode}
                              {row.hasFilterBreakdown ? ' • with breakdown' : ''}
                            </Typography>
                          </>
                        ),
                      },
                      {
                        key: 'units',
                        title: 'Units',
                        content: (row) => (
                          <Typography variant="body" color="grey700">
                            {row.units}
                          </Typography>
                        ),
                      },
                      {
                        key: 'amount',
                        title: 'Amount',
                        textAlign: 'right',
                        content: (row) => (
                          <Typography variant="body" color="grey700">
                            {intlFormatNumber(row.amount)}
                          </Typography>
                        ),
                      },
                    ]}
                    onRowAction={(item) => alert(`You clicked on ${item.id}`)}
                  />
                </Block>
              </Container>
            ),
          },
          {
            title: 'Avatar',
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
                  <Avatar variant="user" size="intermediate" identifier="Morguy" initials="ML" />
                  <Avatar variant="user" size="medium" identifier="Morguy" initials="ML" />
                  <Avatar variant="user" size="large" identifier="Morguy" initials="ML" />
                  <Avatar variant="company" size="small" identifier="Lago Corp" />
                  <Avatar variant="company" size="intermediate" identifier="Lago Corp" />
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
                    <Typography variant="noteHl">NoteHl</Typography>
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
                  <Button variant="primary" size="small">
                    Small
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
                  <Button variant="secondary" size="large">
                    Large
                  </Button>
                  <Button variant="secondary" size="medium">
                    Medium
                  </Button>
                  <Button variant="secondary" size="small">
                    Small
                  </Button>
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
                  <Button variant="tertiary" size="large">
                    Large
                  </Button>
                  <Button variant="tertiary" size="medium">
                    Medium
                  </Button>
                  <Button variant="tertiary" size="small">
                    Small
                  </Button>
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
                  <Button variant="quaternary" size="large">
                    Large
                  </Button>
                  <Button variant="quaternary" size="medium">
                    Medium
                  </Button>
                  <Button variant="quaternary" size="small">
                    small
                  </Button>
                  <Button variant="quaternary" startIcon="plus" size="small">
                    Add
                  </Button>
                  <Button variant="quaternary" disabled>
                    Disabled
                  </Button>
                  <Button variant="quaternary" danger>
                    Danger
                  </Button>
                </Block>

                <GroupTitle variant="subhead">Google connect</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <Button fullWidth startIcon="google" size="large" variant="tertiary">
                    Log In with Google
                  </Button>
                </Block>
              </Container>
            ),
          },
          {
            title: 'Form',
            link: FORM_TAB_URL,
            component: (
              <Container>
                <Form onSubmit={(e) => e.preventDefault()}>
                  <GroupTitle variant="headline">Form</GroupTitle>

                  <GroupTitle variant="subhead">Checkbox</GroupTitle>

                  <Block $marginBottom={theme.spacing(6)}>
                    <Checkbox
                      name="checkboxCond3"
                      canBeIndeterminate
                      value={
                        formikProps.values.checkboxCond1 && formikProps.values.checkboxCond2
                          ? true
                          : !formikProps.values.checkboxCond1 && !formikProps.values.checkboxCond2
                            ? false
                            : undefined
                      }
                      onChange={(e, value) => {
                        if (value) {
                          formikProps.setFieldValue('checkboxCond1', true)
                          formikProps.setFieldValue('checkboxCond2', true)
                        } else {
                          formikProps.setFieldValue('checkboxCond1', false)
                          formikProps.setFieldValue('checkboxCond2', false)
                        }
                      }}
                      label="Accept all conditions or else you won't be able to become the incredibly talented person you want to become (we know, life is unfair)"
                      error={
                        !formikProps.values.checkboxCond1 || !formikProps.values.checkboxCond2
                          ? 'Sorry you need to accept both'
                          : undefined
                      }
                    />

                    <CheckboxField
                      name="checkboxCond1"
                      formikProps={formikProps}
                      value={formikProps.values.checkboxCond1}
                      label="Accept the insane condition"
                    />

                    <CheckboxField
                      name="checkboxCond2"
                      formikProps={formikProps}
                      value={formikProps.values.checkboxCond2}
                      label="Accept the smart condition"
                    />

                    <CheckboxField
                      name="checkboxCond1"
                      formikProps={formikProps}
                      disabled
                      value={formikProps.values.checkboxCond1}
                      label="Insane condition you can't remove"
                    />

                    <CheckboxField
                      name="checkboxCond2"
                      formikProps={formikProps}
                      disabled
                      value={formikProps.values.checkboxCond2}
                      label="Smart condition you can't remove"
                    />

                    <CheckboxField
                      name="checkboxCond2"
                      formikProps={formikProps}
                      value={formikProps.values.checkboxCond2}
                      label="Label"
                      sublabel="Sublabel"
                    />
                    <CheckboxField
                      disabled
                      name="checkboxCond2"
                      formikProps={formikProps}
                      value={formikProps.values.checkboxCond2}
                      label="Label"
                      sublabel="Sublabel"
                    />
                  </Block>

                  <GroupTitle variant="subhead">ButtonSelector</GroupTitle>
                  <Block $marginBottom={theme.spacing(6)}>
                    <ButtonSelectorField
                      name="buttonSelector"
                      label="You'd rather..."
                      description="Be careful with your choice"
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
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                        group: Math.round(i / 5) + '',
                        description: `I am a description for ${letter}`,
                      }))}
                      label="Grouped by - virtualized"
                      description="You can type anything to see the magic happen"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="combobox"
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                      }))}
                      label="Not grouped - virtualized"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="combobox"
                      virtualized={false}
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                      }))}
                      label="Not grouped - normal"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="combobox"
                      virtualized={false}
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                        description: `I am a description for ${letter}`,
                      }))}
                      label="With description"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="combobox"
                      virtualized={false}
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                        group: Math.round(i / 5) + '',
                      }))}
                      renderGroupHeader={{
                        '0': (
                          <ComboboxHeader>
                            <Typography variant="captionHl" color="textSecondary">
                              The good •&#32;
                            </Typography>
                            <Typography component="span" variant="caption" noWrap>
                              Based on several survey
                            </Typography>
                          </ComboboxHeader>
                        ),
                        '1': (
                          <ComboboxHeader>
                            <Typography variant="captionHl" color="textSecondary">
                              The bad •&#32;
                            </Typography>
                            <Typography component="span" variant="caption" noWrap>
                              Because I say so
                            </Typography>
                          </ComboboxHeader>
                        ),
                        '2': (
                          <ComboboxHeader>
                            <Typography variant="captionHl" color="textSecondary">
                              The ugly •&#32;
                            </Typography>
                            <Typography component="span" variant="caption" noWrap>
                              Don&apos;t look at it
                            </Typography>
                          </ComboboxHeader>
                        ),
                      }}
                      label="Grouped by - normal - custom headers"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="combobox"
                      virtualized={false}
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                        group: Math.round(i / 5) + '',
                      }))}
                      renderGroupHeader={{
                        '0': (
                          <ComboboxHeader>
                            <Typography variant="captionHl" color="textSecondary">
                              The good •&#32;
                            </Typography>
                            <Typography component="span" variant="caption" noWrap>
                              Based on several survey
                            </Typography>
                          </ComboboxHeader>
                        ),
                        '1': (
                          <ComboboxHeader>
                            <Typography variant="captionHl" color="textSecondary">
                              The bad •&#32;
                            </Typography>
                            <Typography component="span" variant="caption" noWrap>
                              Because I say so
                            </Typography>
                          </ComboboxHeader>
                        ),
                        '2': (
                          <ComboboxHeader>
                            <Typography variant="captionHl" color="textSecondary">
                              The ugly •&#32;
                            </Typography>
                            <Typography component="span" variant="caption" noWrap>
                              Don&apos;t look at it
                            </Typography>
                          </ComboboxHeader>
                        ),
                      }}
                      renderGroupInputStartAdornment={{
                        0: 'The good',
                        1: 'The bad',
                        2: 'The ugly',
                      }}
                      label="Grouped by - normal - custom headers - Input start adornment"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="combobox"
                      virtualized={false}
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                        group: Math.round(i / 5) + '',
                        description: `I am a description for ${letter}`,
                      }))}
                      label="Grouped by with description"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />

                    <ComboBoxField
                      name="combobox"
                      data={[]}
                      label="Loading"
                      placeholder="But who is it anyway ?"
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

                    <MultipleComboBoxField
                      name="multipleCombobox"
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                      }))}
                      label="Multiple"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <MultipleComboBoxField
                      name="multipleCombobox"
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                        description: `I am a description for ${letter}`,
                      }))}
                      label="Multiple with description"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <MultipleComboBoxField
                      disableCloseOnSelect
                      name="multipleCombobox"
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                        group: Math.round(i / 5) + '',
                        description: `I am a description for ${letter}`,
                      }))}
                      label="Multiple disableCloseOnSelect"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <MultipleComboBoxField
                      freeSolo
                      name="multipleCombobox"
                      data={'abcdefghijklmnopqrstuvwxyz'.split('').map((letter, i) => ({
                        value: `${letter}-${i}`,
                        group: Math.round(i / 5) + '',
                      }))}
                      label="Multiple Free Solo"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    <MultipleComboBoxField
                      freeSolo
                      showOptionsOnlyWhenTyping
                      name="multipleCombobox"
                      label="Multiple No Data freeSolo showOptionsOnlyWhenTyping"
                      placeholder="Placeholder"
                      formikProps={formikProps}
                    />
                    {formikProps.values.multipleCombobox.length > 0 && (
                      <Stack gap={1} direction="row" flexWrap="wrap">
                        {formikProps.values.multipleCombobox.map(
                          (value: { value: string }, index) => (
                            <Chip
                              key={index}
                              label={value.value}
                              onDelete={() => {
                                const newValues = formikProps.values.multipleCombobox.filter(
                                  (v) => v !== value,
                                )

                                formikProps.setFieldValue('multipleCombobox', newValues)
                              }}
                            />
                          ),
                        )}
                      </Stack>
                    )}
                    <MultipleComboBox
                      freeSolo
                      hideTags
                      disableClearable
                      showOptionsOnlyWhenTyping
                      data={[]}
                      onChange={(newValue) =>
                        formikProps.setFieldValue('multipleCombobox', newValue)
                      }
                      value={formikProps.values.multipleCombobox}
                      label="Multiple No Data freeSolo hideTags disableClearable allowSameValue showOptionsOnlyWhenTyping"
                      placeholder="Placeholder"
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
                      sublabel="The right answer"
                    />
                    <RadioField
                      value="painauchocolat"
                      name="radio"
                      formikProps={formikProps}
                      label="Disabled"
                      sublabel="I'm disabled too"
                      disabled
                    />
                    <RadioField
                      name="radio"
                      formikProps={formikProps}
                      value="painauchocolat"
                      label="Radio with a very long label - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
                      sublabel="The right answer"
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

                  <GroupTitle variant="subhead">AmountInput</GroupTitle>
                  <Block $marginBottom={theme.spacing(6)}>
                    <AmountInputField
                      beforeChangeFormatter={['positiveNumber']}
                      currency={formikProps.values.amountCurrency}
                      formikProps={formikProps}
                      label="Amount"
                      name="amountCents"
                      description='Amount in "cents" (1€ = 100 cents)'
                    />
                    <ComboBoxField
                      name="amountCurrency"
                      data={Object.values(CurrencyEnum).map((currencyType) => ({
                        value: currencyType,
                      }))}
                      label="currency"
                      description="Select your currency"
                      placeholder="Placeholder"
                      isEmptyNull={false}
                      disableClearable
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
                      InputProps={{
                        endAdornment: <InputAdornment position="end">Dias</InputAdornment>,
                      }}
                    />
                    <TextInputField
                      label="With decimal formatter"
                      name="inputNumber"
                      placeholder="Type number"
                      beforeChangeFormatter={['decimal']}
                      formikProps={formikProps}
                    />
                    <TextInputField
                      label="With triDecimal formatter"
                      name="inputNumber"
                      placeholder="Type number"
                      beforeChangeFormatter={['triDecimal']}
                      formikProps={formikProps}
                    />
                    <TextInputField
                      label="With quadDecimal formatter"
                      name="inputNumber"
                      placeholder="Type number"
                      beforeChangeFormatter={['quadDecimal']}
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
                      InputProps={{
                        endAdornment: <InputAdornment position="end">Dias</InputAdornment>,
                      }}
                    />
                    <TextInputField
                      label="With helpertext"
                      placeholder="Type something"
                      name="input"
                      formikProps={formikProps}
                      helperText="I'm here to help"
                    />
                    <TextInputField
                      label="With description"
                      placeholder="Type something"
                      name="input"
                      formikProps={formikProps}
                      description="I'm here to help"
                    />
                  </Block>

                  <GroupTitle variant="subhead">JSON Editor</GroupTitle>
                  <Block $marginBottom={theme.spacing(6)}>
                    <JsonEditorField
                      name="json"
                      label="With small editor and overlay"
                      description='Click on "expand" to remove the overlay'
                      infoText="Some tips"
                      formikProps={formikProps}
                      onExpand={(deleteOverlay) => {
                        deleteOverlay()
                      }}
                      helperText="Until you can't see the last line in the editor, you will see the expand overlay"
                    />

                    <JsonEditorField
                      name="jsonLong"
                      label="With height"
                      formikProps={formikProps}
                      height="300px"
                    />
                  </Block>

                  <Button onClick={formikProps.submitForm}>Check your answers</Button>
                </Form>
              </Container>
            ),
          },
          {
            title: 'Links',
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
      />
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

const ComboboxHeader = styled.div`
  display: flex;
  width: 100%;

  > * {
    white-space: nowrap;

    &:first-child {
      margin-right: ${theme.spacing(1)};
    }
    &:last-child {
      min-width: 0;
    }
  }
`

export default DesignSystem

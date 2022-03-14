import styled from 'styled-components'

import { Button } from '~/components/designSystem'
import { theme } from '~/styles'

const Test = () => {
  const onClick = () => {}

  return (
    <div>
      <div>Test Page 1</div>
      <Groups>
        <Button icon="close" size="small" />
        <Button icon="close" size="small" variant="secondary" />
        <Button icon="close" size="small" variant="tertiary" />
        <Button icon="close" size="small" variant="quaternary" />
        <Button icon="close" size="small" danger />
        <Button icon="close" size="small" variant="secondary" danger />
        <Button icon="close" size="small" variant="tertiary" danger />
        <Button icon="close" size="small" variant="quaternary" danger />
      </Groups>
      <Groups>
        <Button onClick={onClick}> Primary</Button>
        <Button onClick={onClick} variant="secondary">
          Secondary
        </Button>
        <Button onClick={onClick} variant="tertiary">
          Tertiary
        </Button>
        <Button onClick={onClick} variant="tertiary" disabled>
          Disabled
        </Button>
        <Button onClick={onClick} variant="quaternary">
          Quaternary
        </Button>
        <Button onClick={onClick} variant="quaternary-light">
          Quaternary L.
        </Button>
        <Button onClick={onClick} variant="quaternary-dark">
          Quaternary D.
        </Button>
        <Button onClick={onClick} variant="quaternary" disabled>
          Disabled Quaternary
        </Button>
      </Groups>
      <Groups>
        <Button danger onClick={onClick}>
          Danger P.
        </Button>
        <Button danger onClick={onClick} variant="secondary">
          Danger S.
        </Button>
        <Button danger onClick={onClick} variant="tertiary">
          Danger T.
        </Button>
        <Button danger onClick={onClick} variant="tertiary" disabled>
          Disabled
        </Button>
        <Button danger onClick={onClick} variant="quaternary">
          Danger Q.
        </Button>
        <Button danger onClick={onClick} variant="quaternary" disabled>
          Danger Q. D.
        </Button>
      </Groups>
      <Groups>
        <Button onClick={onClick} startIcon="rocket">
          Icon left
        </Button>
        <Button onClick={onClick} endIcon="star-filled" variant="secondary">
          Icon right
        </Button>
        <Button onClick={onClick} endIcon="star-filled" variant="tertiary">
          Icon right
        </Button>
        <Button onClick={onClick} endIcon="star-filled" variant="quaternary">
          Icon right
        </Button>
        <Button disabled onClick={onClick} endIcon="star-filled" variant="quaternary">
          Icon right
        </Button>
      </Groups>
      <Groups>
        <Button onClick={onClick} icon="user" variant="tertiary" />
        <Button onClick={onClick} icon="user" variant="quaternary" />
        <Button size="large" onClick={onClick} startIcon="pause-circle-unfilled">
          Big
        </Button>
        <Button size="large" onClick={onClick} endIcon="play" variant="secondary">
          Big
        </Button>
        <Button size="large" onClick={onClick} endIcon="play" variant="tertiary">
          Big
        </Button>
        <Button size="large" onClick={onClick} endIcon="play" variant="quaternary">
          Big Q.
        </Button>
        <Button disabled size="large" onClick={onClick} endIcon="play" variant="quaternary">
          Big Q.
        </Button>
        <Button fullWidth onClick={onClick} startIcon="rocket">
          Full width
        </Button>
      </Groups>
      <Groups>
        <Button size="large" onClick={onClick} icon="reload" variant="primary" />
        <Button size="large" onClick={onClick} icon="reload" variant="secondary" />
        <Button size="large" onClick={onClick} icon="reload" variant="tertiary" />
        <Button size="large" onClick={onClick} icon="reload" variant="quaternary" />
        <Button danger size="large" onClick={onClick} icon="reload" variant="primary" />
        <Button danger size="large" onClick={onClick} icon="reload" variant="secondary" />
        <Button danger size="large" onClick={onClick} icon="reload" variant="tertiary" />
        <Button danger size="large" onClick={onClick} icon="reload" variant="quaternary" />
      </Groups>
      <Groups>
        <Button onClick={onClick} icon="user" variant="primary" />
        <Button onClick={onClick} icon="user" variant="secondary" />
        <Button onClick={onClick} icon="user" variant="tertiary" />
        <Button onClick={onClick} icon="user" variant="quaternary" />

        <Button danger onClick={onClick} icon="user" variant="primary" />
        <Button danger onClick={onClick} icon="user" variant="secondary" />
        <Button danger onClick={onClick} icon="user" variant="tertiary" />
        <Button danger onClick={onClick} icon="user" variant="quaternary" />
      </Groups>
    </div>
  )
}

export default Test

const Groups = styled.div`
  && {
    margin-top: ${theme.spacing(3)};
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex-direction: row;
    margin-right: -${theme.spacing(3)};
    margin-bottom: -${theme.spacing(3)};

    > * {
      margin-right: ${theme.spacing(3)};
      margin-bottom: ${theme.spacing(3)};
    }
  }
`

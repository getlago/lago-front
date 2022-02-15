import { Link, Outlet } from 'react-router-dom'

const Home = () => {
  return (
    <div>
      <h1>Home</h1>
      <div>
        <Link to="/">Go to test2</Link>
      </div>
      <div>
        <Link to="/test2">Back</Link>
      </div>

      <Outlet />
    </div>
  )
}

export default Home

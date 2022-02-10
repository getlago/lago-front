import { Link, Outlet } from 'react-router-dom'

const Home = () => {
  return (
    <div>
      <h1>Home</h1>
      <Link to="/test">Go to test2</Link>
      <Link to="/">Back</Link>
      <Outlet />
    </div>
  )
}

export default Home

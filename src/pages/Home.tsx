import { Link, Outlet } from 'react-router-dom'

const Home = () => {
  return (
    <div>
      <h1>Home</h1>
      <Link to="/">Go to test2</Link>
      <Link to="/test2">Back</Link>
      <Outlet />
    </div>
  )
}

export default Home

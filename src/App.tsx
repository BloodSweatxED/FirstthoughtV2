import './App.css'
import { parseRoute } from './app/routes'
import { HomePage } from './pages/HomePage'
import { HostPage } from './pages/HostPage'
import { PosterPage } from './pages/PosterPage'
import { StudentPage } from './pages/StudentPage'

function App() {
  const route = parseRoute(window.location.pathname)
  switch (route.page) {
    case 'student':
      return <StudentPage code={route.code} />
    case 'host':
      return <HostPage code={route.code} />
    case 'poster':
      return <PosterPage code={route.code} />
    default:
      return <HomePage />
  }
}

export default App

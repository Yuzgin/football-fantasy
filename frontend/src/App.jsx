import react from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import Team from './pages/Team'
import Players from './pages/Players'
import Match from './pages/Match'
import CreateTeam from './pages/CreateTeam'


function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout() {
  localStorage.clear()
  return <Register />
}

function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>}/>
        <Route path="/CreateTeam" element={<ProtectedRoute><CreateTeam /></ProtectedRoute>}/>
        <Route path="/Team" element={<ProtectedRoute><Team /></ProtectedRoute>}/>
        <Route path="/Match" element={<ProtectedRoute><Match /></ProtectedRoute>}/>
        <Route path="/Players" element={<Players />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />}/>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App

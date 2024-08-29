import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import * as Pages from './pages';
import ProtectedRoute from './components/ProtectedRoute';

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
        <Route path="/" element={<ProtectedRoute><Pages.Home /></ProtectedRoute>} />
        <Route path="/CreateTeam" element={<ProtectedRoute><Pages.CreateTeam /></ProtectedRoute>}/>
        <Route path="/Team" element={<ProtectedRoute><Pages.Team /></ProtectedRoute>}/>
        <Route path="/Match" element={<ProtectedRoute><Pages.Match /></ProtectedRoute>}/>
        <Route path="/TeamTransfers" element={<ProtectedRoute><Pages.TeamTransfers /></ProtectedRoute>}/>
        <Route path="/team/:teamId" element={<Pages.OtherTeam />} />
        <Route path="/Players" element={<Pages.Players />} />
        <Route path="/login" element={<Pages.Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />}/>
        <Route path="*" element={<Pages.NotFound />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App

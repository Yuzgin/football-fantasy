import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as Pages from './pages';
import ProtectedRoute from './components/ProtectedRoute';
import StaffRoute from './components/StaffRoute';
import Header from './components/Header';

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Pages.Register />;
}

function App() {
  return (
    <>
      <BrowserRouter>
        {/* Include the Header component here */}
        <Header />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Pages.Home /></ProtectedRoute>} />
            <Route path="/CreateTeam" element={<ProtectedRoute><Pages.CreateTeam /></ProtectedRoute>} />
            <Route path="/Team" element={<ProtectedRoute><Pages.Team /></ProtectedRoute>} />
            <Route path="/Match" element={<StaffRoute><Pages.Match /></StaffRoute>} />
            <Route path="/TeamTransfers" element={<ProtectedRoute><Pages.TeamTransfers /></ProtectedRoute>} />
            <Route path="/team/:teamId" element={<Pages.OtherTeam />} />
            <Route path="/Players" element={<StaffRoute><Pages.Players /></StaffRoute>} />
            <Route path="/login" element={<Pages.Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/register" element={<RegisterAndLogout />} />
            <Route path="/mens" element={<Pages.Mens />} />
            <Route path="/results" element={<Pages.Results />} />
            <Route path="/womens" element={<Pages.Womens />} />
            <Route path="/LMS" element={<Pages.LMS />} />
            <Route path="/forgot-password" element={<Pages.ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<Pages.ResetPassword />} />
            <Route path="*" element={<Pages.NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Clubs from "./pages/Clubs";
import ClubDetails from "./pages/ClubDetails";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Announcements from "./pages/Announcements";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminReview from "./pages/AdminReview";
import CheckIn from "./pages/CheckIn";
import ClubManagerPage from "./pages/ClubManagerPage";
import { useAuth } from "./context/AuthContext";

function App() {
  const RoleRoute = ({ roles, children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary" /></div>;
    if (!user) return <Login />;
    if (!roles.includes(user.role)) return <NotFound />;
    return children;
  };
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="clubs" element={<Clubs />} />
          <Route path="clubs/:id" element={<ClubDetails />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="manage-club" element={<RoleRoute roles={["club_manager"]}><ClubManagerPage /></RoleRoute>} />
          <Route path="admin/review" element={<RoleRoute roles={["admin"]}><AdminReview /></RoleRoute>} />
          <Route path="check-in" element={<CheckIn />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

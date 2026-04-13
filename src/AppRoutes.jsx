import AdminTutorials from "./pages/AdminTutorials";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminTracker from "./pages/AdminTracker";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./services/AuthService";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmailPending from "./pages/VerifyEmailPending";
import Dashboard from "./pages/Dashboard";
import Plans from "./pages/Plans";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import OccultHome from "./pages/OccultHome/OccultHome";
import OccultLogin from "./pages/OccultAuth/OccultLogin";
import OccultRegister from "./pages/OccultAuth/OccultRegister";
import UserDashboard from "./pages/OccultDashboard/UserDashboard";
import ExpertDashboard from "./pages/OccultDashboard/ExpertDashboard";
import ExpertProfile from "./pages/OccultDashboard/ExpertProfile";
import OccultAdmin from "./pages/OccultAdmin/OccultAdmin";
import OccultAdminTracker from "./pages/OccultAdmin/OccultAdminTracker";
import ExpertPublicProfile from "./pages/OccultDashboard/ExpertPublicProfile";
import OccultSettings from "./pages/OccultDashboard/OccultSettings";

import ExpertStore from "./pages/OccultDashboard/ExpertStore";
import UserOrders from "./pages/OccultDashboard/UserOrders";
import ExpertOrders from "./pages/OccultDashboard/ExpertOrders";
import ExpertWallet from "./pages/OccultDashboard/ExpertWallet";
import UserWallet from "./pages/OccultDashboard/UserWallet";
import AdminOrders from "./pages/OccultDashboard/AdminOrders";
import AdminStorage from "./pages/OccultDashboard/AdminStorage";
import UserTracker from "./pages/OccultDashboard/UserTracker";
import UserFollowing from "./pages/OccultDashboard/UserFollowing";
import UserCourses from "./pages/OccultDashboard/UserCourses";
import ExpertFollowers from "./pages/OccultDashboard/ExpertFollowers";
import UserReports from "./pages/OccultDashboard/UserReports";
import ReportView from "./pages/OccultDashboard/ReportView";
import Checkout from "./pages/OccultDashboard/Checkout";
import ProductDetail from "./pages/OccultDashboard/ProductDetail";
import AllProducts from "./pages/OccultDashboard/AllProducts";
import ExpertRemedyLibrary from "./pages/OccultDashboard/ExpertRemedyLibrary";
import ExpertBills from "./pages/OccultDashboard/ExpertBills";
import ExpertCommunity from "./pages/OccultDashboard/ExpertCommunity";
import ExpertTracker from "./pages/OccultDashboard/ExpertTracker";
import ExpertCreditPlans from "./pages/OccultDashboard/ExpertCreditPlans";
import AdminBillingSettings from "./pages/OccultAdmin/AdminBillingSettings";
import AllCourses from "./pages/OccultDashboard/AllCourses";
import CourseDetail from "./pages/OccultDashboard/CourseDetail";
import CoursePlayer from "./pages/OccultDashboard/CoursePlayer";
import CourseManager from "./pages/OccultDashboard/CourseManager";


import Admin from "./pages/Admin";
import AdminCreateUser from "./pages/AdminCreateUser";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProjects from "./pages/AdminProjects";
import AdminPayments from "./pages/AdminPayments";
import AdminUsers from "./pages/AdminUsers"; // [NEW] User Management
import AdminPlans from "./pages/AdminPlans";
import AdminEntranceRemedies from "./pages/AdminEntranceRemedies";
import AdminStaff from "./pages/AdminStaff";
import AdminReviews from "./pages/AdminReviews";
import AdminRemedyAnalytics from "./pages/AdminRemedyAnalytics";
import AdminMapRequests from "./pages/AdminMapRequests";
import AdminFollowups from "./pages/AdminFollowups";
import AdminFollowupRequests from "./pages/AdminFollowupRequests";
import AdminDevtas from "./pages/AdminDevtas";
import PhonePePayment from "./pages/PhonePePayment";



export default function AppRoutes() {
  const { isLoggedIn, isAdminLoggedIn, adminUser } = useAuth();

  const getAdminRedirectPath = () => {
    if (!adminUser) return "/admin/dashboard";
    if (adminUser.role === 'super_admin') return "/admin/dashboard";

    let permissions = adminUser.permission || adminUser.permissions || [];
    if (typeof permissions === 'string') {
      try { permissions = JSON.parse(permissions); } catch (e) { permissions = []; }
    }

    const menuItems = [
      { path: "/admin/dashboard", permission: "stats" },
      { path: "/admin/users", permission: "users" },
      { path: "/admin/projects", permission: "projects" },
      { path: "/admin/plans", permission: "plans" },
      { path: "/admin/payments", permission: "payments" },
      { path: "/admin/map-requests", permission: "projects" },
      { path: "/admin/reviews", permission: "staff" },
      { path: "/admin/followups", permission: "followups" },
      { path: "/admin/followup-requests", permission: "followup_requests" },
      { path: "/admin/analytics", permission: "stats" },
      { path: "/admin/staff", permission: "staff" },
      { path: "/occult/admin?tab=expertsList", permission: "staff" },
      { path: "/occult/admin?tab=manageUsers", permission: "staff" },
      { path: "/occult/admin-store", permission: "staff" },
      { path: "/occult/admin-orders", permission: "staff" },
      { path: "/admin/tracker", permission: "staff" },
      { path: "/admin/tutorials", permission: "staff" },
      { path: "/admin/remedies", permission: "remedies" },
    ];

    const permitted = menuItems.find(item => permissions.includes(item.permission));
    return permitted ? permitted.path : "/admin/dashboard";
  };

  return (
    <Routes>
       <Route
         path="/"
         element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
       />
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-pending" element={<VerifyEmailPending />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Occult Marketplace Routes */}
      <Route path="/occult" element={<OccultHome />} />
      <Route path="/occult/login" element={<OccultLogin />} />
      <Route path="/occult/register" element={<OccultRegister />} />
      <Route path="/occult/user-dashboard" element={<UserDashboard />} />
      <Route path="/occult/expert-dashboard" element={<ExpertDashboard />} />
      <Route path="/occult/expert/:id" element={<ExpertProfile />} />

      <Route path="/occult/settings" element={<OccultSettings />} />
      <Route path="/occult/expert-store" element={<ExpertStore />} />
      <Route path="/occult/admin" element={<OccultAdmin />} />
      <Route path="/occult/my-orders" element={<UserOrders />} />
      <Route path="/occult/my-courses" element={<UserCourses />} />
      <Route path="/occult/expert-orders" element={<ExpertOrders />} />
      <Route path="/occult/expert-wallet" element={<ExpertWallet />} />
      <Route path="/occult/user-wallet" element={<UserWallet />} />
      <Route path="/occult/admin-orders" element={<AdminOrders />} />
      <Route path="/occult/admin-store" element={<AdminStorage />} />
      <Route path="/occult/admin-tracker" element={<OccultAdminTracker />} />
      <Route path="/occult/admin-billing" element={<AdminBillingSettings />} />
      <Route path="/occult/tracker" element={<UserTracker />} />
      <Route path="/occult/following" element={<UserFollowing />} />
      <Route path="/occult/followers" element={<ExpertFollowers />} />
      <Route path="/occult/reports" element={<UserReports />} />
      <Route path="/occult/report/:projectId" element={<ReportView />} />
      <Route path="/occult/expert-remedies" element={<ExpertRemedyLibrary />} />
      <Route path="/occult/expert-bills" element={<ExpertBills />} />
      <Route path="/occult/community" element={<ExpertCommunity />} />
      <Route path="/occult/checkout" element={<Checkout />} />
      <Route path="/occult/expert-tracker" element={<ExpertTracker />} />
      <Route path="/occult/expert-plans" element={<ExpertCreditPlans />} />
      <Route path="/occult/product/:productId" element={<ProductDetail />} />
      <Route path="/occult/shop" element={<AllProducts />} />
      
      {/* Course Management Routes */}
      <Route path="/occult/courses" element={<AllCourses />} />
      <Route path="/occult/course/:productId" element={<CourseDetail />} />
      <Route path="/occult/learn/:id" element={<CoursePlayer />} />
      <Route path="/occult/expert/manage-courses" element={<CourseManager />} />
      <Route
        path="/dashboard"
        element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/plans"
        element={isLoggedIn ? <Plans /> : <Navigate to="/login" />}
      />
      <Route
        path="/tutorials"
        element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
      />

      <Route path="/admin" element={isAdminLoggedIn ? <Navigate to={getAdminRedirectPath()} /> : <Admin />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/dashboard" element={isAdminLoggedIn ? <AdminDashboard /> : <Navigate to="/admin" />} />
      <Route path="/admin/create-user" element={isAdminLoggedIn ? <AdminCreateUser /> : <Navigate to="/admin" />} />
      <Route path="/admin/payments" element={isAdminLoggedIn ? <AdminPayments /> : <Navigate to="/admin" />} />
      <Route path="/admin/users" element={isAdminLoggedIn ? <AdminUsers /> : <Navigate to="/admin" />} />
      <Route path="/admin/projects" element={isAdminLoggedIn ? <AdminProjects /> : <Navigate to="/admin" />} />
      <Route path="/admin/plans" element={isAdminLoggedIn ? <AdminPlans /> : <Navigate to="/admin" />} />
      <Route path="/admin/remedies" element={isAdminLoggedIn ? <AdminEntranceRemedies /> : <Navigate to="/admin" />} />
      <Route path="/admin/staff" element={isAdminLoggedIn ? <AdminStaff /> : <Navigate to="/admin" />} />
      <Route path="/admin/reviews" element={isAdminLoggedIn ? <AdminReviews /> : <Navigate to="/admin" />} />
      <Route path="/admin/analytics" element={isAdminLoggedIn ? <AdminRemedyAnalytics /> : <Navigate to="/admin" />} />
      <Route path="/admin/map-requests" element={isAdminLoggedIn ? <AdminMapRequests /> : <Navigate to="/admin" />} />
      <Route path="/admin/followups" element={isAdminLoggedIn ? <AdminFollowups /> : <Navigate to="/admin" />} />
      <Route path="/admin/followup-requests" element={isAdminLoggedIn ? <AdminFollowupRequests /> : <Navigate to="/admin" />} />
      <Route path="/admin/devtas" element={isAdminLoggedIn ? <AdminDevtas /> : <Navigate to="/admin" />} />
      <Route path="/admin/tutorials" element={isAdminLoggedIn ? <AdminTutorials /> : <Navigate to="/admin" />} />
      <Route path="/admin/tracker" element={isAdminLoggedIn ? <AdminTracker /> : <Navigate to="/admin" />} />

      <Route path="/phonepe-payment" element={<PhonePePayment />} />
      <Route path="/landing" element={<Landing />} />

      <Route path="/:atSlug" element={<ExpertPublicProfile />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

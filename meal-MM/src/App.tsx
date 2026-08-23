import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Layouts
import AdminLayout from "./components/layouts/AdminLayout";
import StudentLayout from "./components/layouts/StudentLayout";
import StaffLayout from "./components/layouts/StaffLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentSubscription from "./pages/student/Subscription";
import StudentPolls from "./pages/polls/StudentPolls";

import RaiseTicket from "./pages/student/RaiseTicket";
import MyTickets from "./pages/student/MyTickets";
import TicketDetails from "./pages/student/TicketDetails";

// Staff Pages
import StaffScanner from "./pages/staff/Scanner";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminStaff from "./pages/admin/Staff";
import AdminMenus from "./pages/admin/Menus";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminPayments from "./pages/admin/Payments";
import AdminCoupons from "./pages/admin/Coupons";
import AdminSettings from "./pages/admin/Settings";
import AdminPolls from "./pages/polls/AdminPolls";

// Support Ticket Pages
import AdminTicketManagement from "./pages/admin/TicketManagement";
import AdminTicketDetails from "./pages/admin/TicketDetails";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <img
          src="/images/campus-corner-mascot.png"
          alt="Campus Corner"
          className="w-14 h-14 mx-auto mb-4 rounded-xl object-contain animate-pulse"
        />
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm mt-4">
          Loading Campus Corner...
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "staff") {
      return <Navigate to="/staff/scanner" replace />;
    }

    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (role === "staff") {
    return <Navigate to="/staff/scanner" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>

      {/* Root */}

      <Route
        path="/"
        element={<RootRedirect />}
      />

      {/* Authentication */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* ===========================================
                  STUDENT ROUTES
      =========================================== */}

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/student/dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="profile"
          element={<StudentProfile />}
        />

        <Route
          path="subscription"
          element={<StudentSubscription />}
        />

        <Route
          path="polls"
          element={<StudentPolls />}
        />

        {/* Ticket System */}

        <Route
          path="tickets"
          element={<MyTickets />}
        />

        <Route
          path="tickets/new"
          element={<RaiseTicket />}
        />

        <Route
          path="tickets/:id"
          element={<TicketDetails />}
        />
      </Route>

      {/* ===========================================
                    STAFF ROUTES
      =========================================== */}

      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/staff/scanner" replace />}
        />

        <Route
          path="scanner"
          element={<StaffScanner />}
        />
      </Route>

      {/* ===========================================
                    ADMIN ROUTES
      =========================================== */}

      <Route
        path="/admin"
        element={
         <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="students"
          element={<AdminStudents />}
        />

        <Route
          path="subscriptions"
          element={<AdminSubscriptions />}
        />

        <Route
          path="staff"
          element={<AdminStaff />}
        />

        <Route
          path="menus"
          element={<AdminMenus />}
        />

        <Route
          path="announcements"
          element={<AdminAnnouncements />}
        />

        <Route
          path="polls"
          element={<AdminPolls />}
        />

        {/* Ticket Management */}

        <Route
          path="tickets"
          element={<AdminTicketManagement />}
        />

        <Route
          path="tickets/:id"
          element={<AdminTicketDetails />}
        />

        <Route
          path="payments"
          element={<AdminPayments />}
        />

        <Route
          path="coupons"
          element={<AdminCoupons />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />
      </Route>

      {/* Catch All */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <AppRoutes />

        <Toaster
          position="top-right"
          richColors
          closeButton
        />

      </AuthProvider>
    </BrowserRouter>
  );
}
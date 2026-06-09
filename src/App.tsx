import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import AdminLayout from './components/layouts/AdminLayout';
import StudentLayout from './components/layouts/StudentLayout';
import StaffLayout from './components/layouts/StaffLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentSubscription from './pages/student/Subscription';
import StaffScanner from './pages/staff/Scanner';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminStaff from './pages/admin/Staff';
import AdminMenus from './pages/admin/Menus';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminPayments from './pages/admin/Payments';
import AdminSettings from './pages/admin/Settings';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm mt-4">Loading HostelPro...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'staff') return <Navigate to="/staff/scanner" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !role) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'staff') return <Navigate to="/staff/scanner" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="subscription" element={<StudentSubscription />} />
      </Route>

      {/* Staff routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/staff/scanner" replace />} />
        <Route path="scanner" element={<StaffScanner />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="menus" element={<AdminMenus />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

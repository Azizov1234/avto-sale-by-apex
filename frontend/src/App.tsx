import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout }  from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout }  from './layouts/AuthLayout';
import { Login }          from './pages/auth/Login';
import { Register }       from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { CarListing }     from './pages/user/CarListing';
import { CarDetails }     from './pages/user/CarDetails';
import { UserDashboard }  from './pages/user/UserDashboard';
import { Dashboard }           from './pages/admin/Dashboard';
import { ManageCars }          from './pages/admin/ManageCars';
import { ManageOrders }        from './pages/admin/ManageOrders';
import { ManageUsers }         from './pages/admin/ManageUsers';
import { ManageInstallments }  from './pages/admin/ManageInstallments';
import { Analytics }           from './pages/admin/Analytics';
import { AdminActionLog }      from './pages/admin/AdminActionLog';
import { DiscountCampaigns }   from './pages/admin/DiscountCampaigns';
import { useAuthStore }  from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isDark } = useThemeStore();

  // Sync theme class on mount and when isDark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* User Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/"           element={<CarListing />} />
        <Route path="/cars/:id"   element={<CarDetails />} />
        <Route path="/dashboard"  element={<UserDashboard />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index                element={<Dashboard />} />
        <Route path="cars"          element={<ManageCars />} />
        <Route path="orders"        element={<ManageOrders />} />
        <Route path="users"         element={<ManageUsers />} />
        <Route path="installments"  element={<ManageInstallments />} />
        <Route path="analytics"     element={<Analytics />} />
        <Route path="logs"          element={<AdminActionLog />} />
        <Route path="campaigns"     element={<DiscountCampaigns />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout }  from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout }  from './layouts/AuthLayout';
import { Login }          from './pages/auth/Login';
import { Register }       from './pages/auth/Register';
import { CarListing }     from './pages/user/CarListing';
import { CarDetails }     from './pages/user/CarDetails';
import { UserDashboard }  from './pages/user/UserDashboard';
import { Dashboard }           from './pages/admin/Dashboard';
import { ManageCars }          from './pages/admin/ManageCars';
import { ManageCategories }    from './pages/admin/ManageCategories';
import { ManageOrders }        from './pages/admin/ManageOrders';
import { ManageUsers }         from './pages/admin/ManageUsers';
import { ManageInstallments }  from './pages/admin/ManageInstallments';
import { Analytics }           from './pages/admin/Analytics';
import { AdminActionLog }      from './pages/admin/AdminActionLog';
import { DiscountCampaigns }   from './pages/admin/DiscountCampaigns';
import { useAuthStore }  from './store/useAuthStore';
import { applyThemeToDocument, useThemeStore } from './store/useThemeStore';
import { getHomePath } from './lib/routes';
import type { UserRole } from './types';

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return <>{children}</>;
}

function FallbackRedirect() {
  const { user } = useAuthStore();

  return <Navigate to={user ? getHomePath(user.role) : '/login'} replace />;
}

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        element={
          <GuestRoute>
            <AuthLayout />
          </GuestRoute>
        }
      >
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
      </Route>

      {/* User Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/"           element={<CarListing />} />
        <Route path="/cars/:id"   element={<CarDetails />} />
        <Route path="/dashboard"  element={<UserDashboard />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN', 'SUPERADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index                element={<Dashboard />} />
        <Route path="cars"          element={<ManageCars />} />
        <Route path="categories"    element={<ManageCategories />} />
        <Route path="orders"        element={<ManageOrders />} />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['SUPERADMIN']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route path="installments"  element={<ManageInstallments />} />
        <Route
          path="analytics"
          element={
            <ProtectedRoute roles={['SUPERADMIN']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="logs"
          element={
            <ProtectedRoute roles={['SUPERADMIN']}>
              <AdminActionLog />
            </ProtectedRoute>
          }
        />
        <Route path="campaigns"     element={<DiscountCampaigns />} />
      </Route>

      <Route
        path="/superadmin"
        element={
          <ProtectedRoute roles={['SUPERADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index                element={<Dashboard />} />
        <Route path="cars"          element={<ManageCars />} />
        <Route path="categories"    element={<ManageCategories />} />
        <Route path="orders"        element={<ManageOrders />} />
        <Route path="users"         element={<ManageUsers />} />
        <Route path="installments"  element={<ManageInstallments />} />
        <Route path="analytics"     element={<Analytics />} />
        <Route path="logs"          element={<AdminActionLog />} />
        <Route path="campaigns"     element={<DiscountCampaigns />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}

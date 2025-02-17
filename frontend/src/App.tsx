import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RestaurantAuthProvider, useRestaurantAuth } from './contexts/RestaurantAuthContext';
import { GlobalStyles } from './styles/globalStyles';
import { theme } from './styles/theme';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { RestaurantDashboardLayout } from './components/layout/RestaurantDashboardLayout';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { ParametersPage } from './pages/parameters/ParametersPage';
import LoginForm from './components/auth/LoginForm';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import RestaurantLoginPage from './pages/restaurant/LoginPage';
import { MenuManagementPage } from './pages/restaurant/MenuManagementPage';
import { OrdersPage } from './pages/restaurant/OrdersPage';
import { TablesPage } from './pages/restaurant/TablesPage';

interface PrivateRouteProps {
  element: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <AuthenticatedLayout>{element}</AuthenticatedLayout>;
};

const RestaurantPrivateRoute: React.FC<PrivateRouteProps> = ({ element }) => {
  const { isAuthenticated, isLoading, admin } = useRestaurantAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/restaurant/login" />;
  }

  return element;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isRestaurantAuthenticated, admin } = useRestaurantAuth();

  return (
    <Routes>
      {/* Developer Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm />
        }
      />
      <Route
        path="/dashboard"
        element={<PrivateRoute element={<DashboardLayout />} />}
      />
      <Route
        path="/restaurants"
        element={<PrivateRoute element={<RestaurantsPage />} />}
      />
      <Route
        path="/parameters"
        element={<PrivateRoute element={<ParametersPage />} />}
      />

      {/* Restaurant Routes */}
      <Route
        path="/restaurant/login"
        element={
          isRestaurantAuthenticated && admin?.restaurantId ? (
            <Navigate to={`/restaurant/${admin.restaurantId}/dashboard`} />
          ) : (
            <RestaurantLoginPage />
          )
        }
      />
      <Route
        path="/restaurant/:restaurantId"
        element={<RestaurantPrivateRoute element={<RestaurantDashboardLayout />} />}
      >
        <Route path="dashboard" element={<MenuManagementPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="menu" element={<MenuManagementPage />} />
        <Route path="tables" element={<TablesPage />} />
      </Route>

      {/* Default Routes */}
      <Route path="/restaurant" element={<Navigate to="/restaurant/login" />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles theme={theme} />
      <Router>
        <AuthProvider>
          <RestaurantAuthProvider>
            <AppRoutes />
          </RestaurantAuthProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;

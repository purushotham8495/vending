import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import OwnersList from './pages/admin/OwnersList';
import OwnerDetail from './pages/admin/OwnerDetail';
import AllMachines from './pages/admin/AllMachines';
import SequenceManagement from './pages/admin/SequenceManagement';
import OTAManagement from './pages/admin/OTAManagement';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyMachines from './pages/owner/MyMachines';
import MachineDetail from './pages/MachineDetail';
import MachineControl from './pages/MachineControl';
import Transactions from './pages/Transactions';
import Logs from './pages/Logs';

// Layout
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to="/" />
        ) : (
          <LoginPage />
        )
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Admin Routes */}
        <Route index element={
          isAdmin() ? <AdminDashboard /> : <OwnerDashboard />
        } />
        
        <Route path="owners" element={
          <ProtectedRoute adminOnly>
            <OwnersList />
          </ProtectedRoute>
        } />

        <Route path="admin/owners/:ownerId" element={
          <ProtectedRoute adminOnly>
            <OwnerDetail />
          </ProtectedRoute>
        } />

        <Route path="all-machines" element={
          <ProtectedRoute adminOnly>
            <AllMachines />
          </ProtectedRoute>
        } />

        <Route path="sequences" element={
          <ProtectedRoute adminOnly>
            <SequenceManagement />
          </ProtectedRoute>
        } />

        <Route path="ota" element={
          <ProtectedRoute adminOnly>
            <OTAManagement />
          </ProtectedRoute>
        } />

        {/* Owner Routes */}
        <Route path="my-machines" element={
          <ProtectedRoute>
            <MyMachines />
          </ProtectedRoute>
        } />

        {/* Common Routes */}
        <Route path="machine/:machineId" element={
          <ProtectedRoute>
            <MachineDetail />
          </ProtectedRoute>
        } />

        <Route path="machine/:machineId/control" element={
          <ProtectedRoute>
            <MachineControl />
          </ProtectedRoute>
        } />

        <Route path="transactions" element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } />

        <Route path="logs" element={
          <ProtectedRoute>
            <Logs />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

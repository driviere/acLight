import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { HomeBold, SettingsBold, DatabaseBold, BillBold, TrashBinMinimalisticBold, LogoutBold, BookmarkBold, ShieldCheckBold, UsersGroupTwoRoundedBold, ChartSquareBold } from 'solar-icon-set';
import Login from './components/auth/Login';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminDashboard from './components/admin/AdminDashboard';
import ExpenseLogger from './components/modules/ExpenseLogger';
import OutstandingMonitor from './components/modules/OutstandingMonitor';
import OutstandingList from './components/modules/OutstandingList';
import WasteTracker from './components/modules/WasteTracker';
import TopLevelBar from './components/modules/TopLevelBar';
import POSDashboard from './components/pos/POSDashboard';
import TransactionLedger from './components/modules/TransactionLedger';
import CustomerStatements from './components/modules/CustomerStatements';
import Reports from './components/modules/Reports';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import './App.css';

// ── Reusable Page Header ──────────────────────────────────────
export function PageHeader({ title, subtitle, icon }) {
  return (
    <div className="page-header">
      <h1 className="page-title">
        {icon && <span className="icon mr-2" style={{ verticalAlign: 'middle' }}>{icon}</span>}
        {title}
      </h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  );
}

// ── Toast notification hook ───────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', duration = 3500) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(t => t ? { ...t, hiding: true } : null);
      setTimeout(() => setToast(null), 350);
    }, duration);
  };

  const ToastComponent = toast ? (
    <div className={`bl-toast notification is-${toast.type} ${toast.hiding ? 'hiding' : ''}`}>
      <button className="delete" onClick={() => setToast(null)}></button>
      {toast.message}
    </div>
  ) : null;

  return { showToast, ToastComponent };
}

// ── Burger Navigation ─────────────────────────────────────────
export const Navigation = () => {
  const { currentUser, isAdmin, isSuperAdmin, logout } = useAuth();
  const { tenantData } = useTenant();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label, icon, extraClass = '') => (
    <Link
      to={to}
      className={`navbar-item ${isActive(to) ? 'is-active-route' : ''} ${extraClass}`}
      onClick={() => setIsOpen(false)}
    >
      <span className="icon mr-2">{icon}</span>
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="navbar bl-navbar mb-4 bl-glass" role="navigation" aria-label="main navigation" style={{
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <div className="navbar-brand">
        <button
          className={`navbar-burger ${isOpen ? 'is-active' : ''}`}
          aria-label="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 0 }}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>

      <div className={`navbar-menu ${isOpen ? 'is-active' : ''}`}>
        <div className="navbar-start">
          {!isSuperAdmin && navLink('/', 'Register (POS)', <HomeBold size={16} />)}
          {!isSuperAdmin && navLink('/outstanding', 'AR / AP', <DatabaseBold size={16} />)}
          {!isSuperAdmin && navLink('/ledger', 'Ledger', <BookmarkBold size={16} />)}
          {!isSuperAdmin && navLink('/statements', 'Statements', <UsersGroupTwoRoundedBold size={16} />)}
          {!isSuperAdmin && navLink('/reports', 'Reports', <ChartSquareBold size={16} />)}
          {!isSuperAdmin && navLink('/expenses', 'Expenses', <BillBold size={16} />)}
          {!isSuperAdmin && navLink('/spoilage', 'Spoilage', <TrashBinMinimalisticBold size={16} />)}
          {isAdmin && !isSuperAdmin && navLink('/admin', 'Admin', <SettingsBold size={16} />)}
          {isSuperAdmin && navLink('/super-admin', 'Super Admin', <ShieldCheckBold size={16} />)}
        </div>
        <div className="navbar-end">
          <div className="navbar-item">
            <div className="is-flex is-flex-direction-column">
              <span className="has-text-grey is-size-7 mb-1 is-hidden-touch">
                <span className="icon mr-1"><ShieldCheckBold size={14} /></span>
                Logged in as: <strong>{currentUser.email}</strong>
              </span>
              <button className="button is-light is-small" onClick={logout}>
                <span className="icon"><LogoutBold size={14} /></span>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav >
  );
};

// ── Main Dashboard ────────────────────────────────────────────
const MainDashboard = () => {
  const { isAdmin, isSuperAdmin } = useAuth();

  if (isSuperAdmin) {
    return (
      <div className="has-text-centered py-6">
        <ShieldCheckBold size={64} style={{ opacity: 0.2 }} />
        <h2 className="title is-4 mt-4">Platform Administration</h2>
        <p className="subtitle is-6">Please use the Super Admin menu to manage tenants.</p>
        <Link to="/super-admin" className="button is-primary mt-4">Go to Portal</Link>
      </div>
    );
  }

  return (
    <div>
      {isAdmin && <TopLevelBar />}

      <OutstandingMonitor />

      <div className="mt-5">
        <POSDashboard />
      </div>
    </div>
  );
};

// ── App Wrapper ───────────────────────────────────────────────
function AppContent() {
  const { currentUser, isSuperAdmin } = useAuth();
  const { tenantData } = useTenant();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="app-shell">
      {!isLogin && currentUser && (
        <div className="app-header">
          <p className="app-logo">
            {tenantData?.branding?.logo_url ? (
              <img src={tenantData.branding.logo_url} alt="Logo" className="mr-2" style={{ maxHeight: '1.8rem', verticalAlign: 'middle' }} />
            ) : '🥖'} {tenantData?.name || 'Bakery Ledger'}
          </p>
          <p className="app-tagline">Accounting rigorous, user simple.</p>
        </div>
      )}

      <div className={isLogin ? '' : 'container px-4 py-4'}>
        {!isLogin && <Navigation />}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><MainDashboard /></PrivateRoute>} />
          <Route path="/outstanding" element={<PrivateRoute><OutstandingList /></PrivateRoute>} />
          <Route path="/expenses" element={
            <PrivateRoute requireAdmin={true}>
              <ExpenseLogger />
            </PrivateRoute>
          } />
          <Route path="/spoilage" element={
            <PrivateRoute>
              <WasteTracker />
            </PrivateRoute>
          } />
          <Route path="/admin" element={<PrivateRoute requireAdmin={true}><AdminDashboard /></PrivateRoute>} />
          <Route path="/ledger" element={<PrivateRoute><TransactionLedger /></PrivateRoute>} />
          <Route path="/statements" element={<PrivateRoute><CustomerStatements /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/super-admin" element={
            <PrivateRoute requireSuperAdmin={true}>
              <SuperAdminDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <Router>
          <AppContent />
        </Router>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;

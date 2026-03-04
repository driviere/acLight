import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomeBold, SettingsBold, DatabaseBold, BillBold, TrashBinMinimalisticBold, LogoutBold, BookmarkBold } from 'solar-icon-set';
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
const Navigation = () => {
  const { currentUser, isAdmin, logout } = useAuth();
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
    <nav className="navbar bl-navbar mb-4" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <span className="navbar-item" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#00b894' }}>
          🥖 Bakery Ledger
        </span>
        <button
          className={`navbar-burger ${isOpen ? 'is-active' : ''}`}
          aria-label="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>

      <div className={`navbar-menu ${isOpen ? 'is-active' : ''}`}>
        <div className="navbar-start">
          {navLink('/', 'Register (POS)', <HomeBold size={16} />)}
          {navLink('/outstanding', 'AR / AP', <DatabaseBold size={16} />)}
          {navLink('/ledger', 'Ledger', <BookmarkBold size={16} />)}
          {navLink('/expenses', 'Expenses', <BillBold size={16} />)}
          {navLink('/spoilage', 'Spoilage', <TrashBinMinimalisticBold size={16} />)}
          {isAdmin && navLink('/admin', 'Admin', <SettingsBold size={16} />)}
        </div>
        <div className="navbar-end">
          <div className="navbar-item">
            <button className="button is-light is-small" onClick={logout}>
              <span className="icon"><LogoutBold size={14} /></span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ── Main Dashboard ────────────────────────────────────────────
const MainDashboard = () => {
  const { isAdmin } = useAuth();

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
  const { currentUser } = useAuth();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="app-shell">
      {!isLogin && currentUser && (
        <div className="app-header">
          <p className="app-logo">🥖 Bakery Ledger</p>
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
              <PageHeader title="Expenses" subtitle="Record incoming vendor bills and receipts." icon={<BillBold />} />
              <ExpenseLogger />
            </PrivateRoute>
          } />
          <Route path="/spoilage" element={
            <PrivateRoute>
              <PageHeader title="Spoilage & Waste" subtitle="Log burned or unsold daily products." icon={<TrashBinMinimalisticBold />} />
              <WasteTracker />
            </PrivateRoute>
          } />
          <Route path="/admin" element={<PrivateRoute requireAdmin={true}><AdminDashboard /></PrivateRoute>} />
          <Route path="/ledger" element={<PrivateRoute><TransactionLedger /></PrivateRoute>} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

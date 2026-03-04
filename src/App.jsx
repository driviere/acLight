import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { seedChartOfAccounts } from './services/accountService';
import { HomeBold, SettingsBold, DatabaseBold } from 'solar-icon-set';
import Login from './components/auth/Login';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminDashboard from './components/admin/AdminDashboard';
import SalesTracker from './components/modules/SalesTracker';
import ExpenseLogger from './components/modules/ExpenseLogger';
import OutstandingMonitor from './components/modules/OutstandingMonitor';
import WasteTracker from './components/modules/WasteTracker';
import './App.css';

const Navigation = () => {
  const { currentUser, isAdmin, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <nav className="level is-mobile mb-5 p-3 has-background-white" style={{ borderRadius: '8px', boxShadow: '0 2px 3px rgba(10, 10, 10, 0.1)' }}>
      <div className="level-left">
        <div className="level-item">
          <Link to="/" className="button is-light">
            <span className="icon"><HomeBold size={16} /></span>
            <span>Dashboard</span>
          </Link>
        </div>
        {isAdmin && (
          <div className="level-item">
            <Link to="/admin" className="button is-info is-light">
              <span className="icon"><SettingsBold size={16} /></span>
              <span>Admin</span>
            </Link>
          </div>
        )}
      </div>
      <div className="level-right">
        <div className="level-item">
          <button className="button is-danger is-light" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
};

const MainDashboard = () => {
  const { isAdmin } = useAuth();

  const handleSeed = async () => {
    try {
      const seeded = await seedChartOfAccounts();
      if (seeded) alert('Chart of Accounts successfully seeded!');
      else alert('Accounts already exist. Skipping.');
    } catch (e) {
      alert('Error seeding accounts. Check console.');
    }
  };

  return (
    <div className="dashboard-container">
      {isAdmin && (
        <div className="has-text-right mb-4">
          <button className="button is-warning is-small is-outlined" onClick={handleSeed}>
            <span className="icon"><DatabaseBold size={14} /></span>
            <span>[DEV] Init DB</span>
          </button>
        </div>
      )}

      <OutstandingMonitor />

      <div className="columns is-desktop is-multiline mt-4">
        <div className="column is-12-tablet is-6-desktop">
          <SalesTracker />
        </div>

        <div className="column is-12-tablet is-6-desktop">
          <WasteTracker />
        </div>

        {isAdmin && (
          <div className="column is-12">
            <ExpenseLogger />
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="container mt-5 px-3">
          <h1 className="title has-text-centered has-text-primary">Bakery Ledger</h1>
          <p className="subtitle has-text-centered">Accounting rigorous, user simple.</p>

          <Navigation />

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><MainDashboard /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute requireAdmin={true}><AdminDashboard /></PrivateRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { seedChartOfAccounts } from './services/accountService';
import './App.css';

function App() {
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
    <Router>
      <div className="container mt-5">
        <h1 className="title has-text-centered has-text-primary">Bakery Ledger</h1>
        <p className="subtitle has-text-centered">Accounting rigorous, user simple.</p>

        <Routes>
          <Route path="/" element={
            <div className="box has-text-centered">
              <p className="mb-4">Dashboard coming soon...</p>
              <button className="button is-warning is-large" onClick={handleSeed}>
                [DEV] Initialize Database
              </button>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

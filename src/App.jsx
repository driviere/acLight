import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container mt-5">
        <h1 className="title has-text-centered has-text-primary">Bakery Ledger</h1>
        <p className="subtitle has-text-centered">Accounting rigorous, user simple.</p>
        
        <Routes>
          <Route path="/" element={<div className="box"><p>Dashboard coming soon...</p></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

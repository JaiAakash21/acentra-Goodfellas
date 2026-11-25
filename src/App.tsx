import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/navigation/Layout';
import { Dashboard } from './pages/Dashboard';
import { ReviewQueue } from './pages/ReviewQueue';
import { Investigation } from './pages/Investigation';
import { RuleStudio } from './pages/RuleStudio';
import { Simulator } from './pages/Simulator';
import { CreateTransaction } from './pages/CreateTransaction';

const Router = import.meta.env.VITE_PAGES_DEMO === 'true' ? HashRouter : BrowserRouter;

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions/new" element={<CreateTransaction />} />
          <Route path="reviews" element={<ReviewQueue />} />
          <Route path="investigation/:transactionId" element={<Investigation />} />
          <Route path="rules" element={<RuleStudio />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;

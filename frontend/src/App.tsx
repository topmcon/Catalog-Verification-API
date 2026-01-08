import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import Verify from './pages/Verify';
import Enrich from './pages/Enrich';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:sessionId" element={<SessionDetail />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/enrich" element={<Enrich />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

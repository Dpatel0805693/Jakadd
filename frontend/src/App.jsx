// App.jsx - Main application with routing
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Configure from './pages/Configure';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/configure/:fileId" element={<Configure />} />
      </Routes>
    </Router>
  );
}

export default App;
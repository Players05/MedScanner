import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import PresScan from './components/PresScan';
import RepoScan from './components/RepoScan';
import InfoBox from './components/InfoBox';
import InfoReports from './components/InfoReports';
import History from './components/History';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/prescription-scan" element={<PresScan />} />
          <Route path="/report-scan" element={<RepoScan />} />
          <Route path="/infobox" element={<InfoBox />} />
          <Route path="/inforeports" element={<InfoReports />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

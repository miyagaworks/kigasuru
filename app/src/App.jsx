import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage, RecordPage, AnalysisPage, SettingsPage, RoundHistoryPage } from './pages';

/**
 * Main App component with routing
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/record" element={<RecordPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="/history" element={<RoundHistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import RepoPage from './pages/RepoPage';
import TreeViewer from './TreeViewer';
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/repo/:id" element={<RepoPage />} />
      <Route path="/repo/:id/ast" element={<TreeViewer />} />

    </Routes>
  </BrowserRouter>
);

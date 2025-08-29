import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Simple auth helper using localStorage for tokens 
export function getToken() { return localStorage.getItem('jwt'); }
export function saveToken(t) { localStorage.setItem('jwt', t); }
export function clearToken() { localStorage.removeItem('jwt'); }

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  function onLogin(userObj, token) {
    setUser(userObj);
    saveToken(token);
    localStorage.setItem('user', JSON.stringify(userObj));
    if (userObj.role === 'admin') navigate('/admin');
    else navigate('/candidate');
  }
  function onLogout() {
    setUser(null); clearToken(); localStorage.removeItem('user'); navigate('/');
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-4">Leave Management</h1>
        <Routes>
          <Route path="/" element={<Login onLogin={onLogin} />} />
          <Route path="/register" element={<Register onLogin={onLogin} />} />
          <Route path="/candidate" element={<CandidateDashboard onLogout={onLogout} user={user} />} />
          <Route path="/admin" element={<AdminDashboard onLogout={onLogout} user={user} />} />
        </Routes>
      </div>
    </div>
  )
}

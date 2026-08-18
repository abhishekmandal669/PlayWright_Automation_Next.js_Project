'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardView() {
  const [user, setUser] = useState(null);
  const [latency, setLatency] = useState(24);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('userSession');
      if (session) {
        try {
          setUser(JSON.parse(session));
        } catch (e) {
          setUser({ name: 'Demo User', role: 'Tester' });
        }
      } else {
        setUser({ name: 'Demo Admin', email: 'user@example.com', role: 'Senior QA Specialist' });
      }
    }

    // Dynamic latency simulation
    const interval = setInterval(() => {
      setLatency(Math.floor(18 + Math.random() * 12));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userSession');
    }
    router.push('/');
  };

  const logs = [
    { id: 'LOG-104', event: 'User Login Authentication', status: 'Passed (200 OK)', time: 'Just Now', latency: `${latency}ms` },
    { id: 'LOG-103', event: 'Visual Regression Snapshot Check', status: 'Passed (0.00% Diff)', time: '2 mins ago', latency: '42ms' },
    { id: 'LOG-102', event: 'Database Health Check', status: 'MongoDB Connected', time: '5 mins ago', latency: '12ms' },
    { id: 'LOG-101', event: 'User Registration Lifecycle', status: 'Passed (201 Created)', time: '12 mins ago', latency: '34ms' },
  ];

  return (
    <div className="dashboard-container" id="dashboard-root">
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1 id="welcome-heading">Welcome, {user?.name || 'User'}!</h1>
          <p id="user-role-badge">Role: {user?.role || 'QA Engineer'} | Status: Active Session</p>
        </div>
        <button
          onClick={handleLogout}
          id="logout-btn"
          className="btn-outline"
        >
          Sign Out
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid-cards">
        <div className="card">
          <div className="card-title">Automated Test Suites</div>
          <div className="card-value">24 Executed</div>
        </div>

        <div className="card">
          <div className="card-title">Test Pass Rate</div>
          <div className="card-value" style={{ color: '#38A169' }}>100% Passed</div>
        </div>

        <div className="card">
          <div className="card-title">Framework Engine</div>
          <div className="card-value" style={{ fontSize: '1.5rem', color: '#2E6FE8' }}>Playwright v1.50</div>
        </div>
      </div>

      {/* Activity Log Panel */}
      <div className="activity-panel">
        <div className="panel-title">
          <span>📊 Real-Time Activity & Health Monitor</span>
          <span className="status-pill">🟢 Latency: {latency}ms</span>
        </div>

        <table className="log-table">
          <thead>
            <tr>
              <th>Trace ID</th>
              <th>Event Description</th>
              <th>Execution Result</th>
              <th>Timestamp</th>
              <th>Response Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'monospace', color: '#2E6FE8' }}>{log.id}</td>
                <td>{log.event}</td>
                <td style={{ color: '#38A169' }}>{log.status}</td>
                <td style={{ color: '#8C96A6' }}>{log.time}</td>
                <td style={{ fontFamily: 'monospace' }}>{log.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

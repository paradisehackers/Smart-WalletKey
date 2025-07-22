import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import './DashboardLayout.css';

// The layout now receives the handleLogout function as a prop
function DashboardLayout({ user, handleLogout }) {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h3>SmartKey</h3>
        <nav className="sidebar-nav">
          <Link to="/">Dashboard</Link>
          <Link to="/send-receive">Send & Receive</Link>
          <Link to="/history">Transaction History</Link>
          {user && user.username === '7654' && (
            <Link to="/admin/users">Admin: All Users</Link>
          )}
        </nav>

        {/* --- ADDED: The Logout button is now here --- */}
        <button className="logout-button" onClick={handleLogout}>Log Out</button>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
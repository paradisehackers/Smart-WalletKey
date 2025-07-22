import React, { useState, useEffect } from 'react';

function AdminPage() { // Renamed from ActivityPage
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('https://smart-walletkey-api.onrender.com/api/users')
      .then(response => response.json())
      .then(data => {
        setAllUsers(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching all users:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <h2>Loading user data...</h2>;
  }

  return (
    <div>
      <h2>All Wallet Users</h2>
      <ul>
        {allUsers.map(user => (
          <li key={user._id}>
            <strong>Username:</strong> {user.username} | <strong>Address:</strong> {user.walletAddress}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPage; // Renamed from ActivityPage
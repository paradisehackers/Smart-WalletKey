import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HistoryPage({ user, activeWallet }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`https://smart-walletkey-api.onrender.com/api/users/${user._id}/transactions`)
        .then(response => response.json())
        .then(data => {
          setHistory(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching transaction history:', error);
          setIsLoading(false);
        });
    }
  }, [user]);

  if (isLoading) {
    return <h2>Loading Transaction History...</h2>;
  }

  return (
    <div>
      <h2>Full Transaction History</h2>
      <ul>
        {history.map((tx) => {
            // --- CORRECTED: Use the confirmed URL format ---
            const explorerUrl = `https://primordial.bdagscan.com/tx/${tx.hash}`;
            const isSender = activeWallet && tx.from && tx.from.toLowerCase() === activeWallet.address.toLowerCase();

            return (
              <li key={tx.hash}>
                {/* ... display logic ... */}
                <small> | <a href={explorerUrl} target="_blank" rel="noopener noreferrer"> View on Explorer</a></small>
              </li>
            )
        })}
      </ul>
      <Link to="/">Back to Dashboard</Link>
    </div>
  );
}

export default HistoryPage;
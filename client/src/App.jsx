import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import './App.css';

// Import all of your components
import Header from './Header';
import LoginPage from './LoginPage';
import DashboardLayout from './DashboardLayout';
import DashboardPage from './DashboardPage';
import SendReceivePage from './SendReceivePage';
import RecoveryPage from './RecoveryPage';
import AdminPage from './AdminPage';
import HistoryPage from './HistoryPage';

function App() {
  const [users, setUsers] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = () => {
    fetch('http://localhost:3000/api/users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  };
  
  const handleCreateWallet = async (username, password) => {
    try {
      const mnemonic = ethers.Mnemonic.fromEntropy(ethers.randomBytes(24));
      const wallet = ethers.Wallet.fromPhrase(mnemonic.phrase);
      const encryptedPrivateKey = await wallet.encrypt(password);
      const newUser = {
        username: username,
        walletAddress: wallet.address,
        encryptedPrivateKey: encryptedPrivateKey,
      };
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) throw new Error('Failed to create user.');
      alert(
        'WALLET CREATED SUCCESSFULLY!\n\n' +
        'This is your 18-word recovery phrase. Please write it down and store it in a safe place.\n\n' +
        mnemonic.phrase
      );
      fetchUsers();
    } catch (error) {
      alert(`Failed to create wallet: ${error.message}`);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${username}`);
      if (!response.ok) throw new Error('User not found');
      const user = await response.json();
      const decryptedWallet = await ethers.Wallet.fromEncryptedJson(user.encryptedPrivateKey, password);
      setActiveWallet(decryptedWallet);
      setCurrentUser(user);
    } catch (error) {
      alert('Login failed. Check username or password.');
    }
  };

  const handleLogout = () => {
    setActiveWallet(null);
    setCurrentUser(null);
  };

  const handlePasswordReset = async (mnemonic, newPassword, userToRecover) => {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      if (wallet.address.toLowerCase() !== userToRecover.walletAddress.toLowerCase()) {
        throw new Error("Recovery phrase does not match the wallet for this username.");
      }
      const newEncryptedPrivateKey = await wallet.encrypt(newPassword);
      await fetch('http://localhost:3000/api/users/reset-password-with-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userToRecover.username,
          newEncryptedPrivateKey,
        }),
      });
      alert('Password reset successfully! You can now log in with your new password.');
      navigate('/login');
    } catch(error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <Header />
      <main className="app-content">
        <Routes>
          <Route path="/login" element={!activeWallet ? <LoginPage handleLogin={handleLogin} handleCreateWallet={handleCreateWallet} /> : <Navigate to="/" />} />
          <Route path="/recover" element={!activeWallet ? <RecoveryPage handlePasswordReset={handlePasswordReset} users={users} /> : <Navigate to="/" />} />
          
          <Route path="/" element={activeWallet ? <DashboardLayout user={currentUser} handleLogout={handleLogout} /> : <Navigate to="/login" />}>
            <Route index element={<DashboardPage activeWallet={activeWallet} user={currentUser} />} />
            {/* --- UPDATED: Ensure correct props are passed to SendReceivePage --- */}
            <Route path="send-receive" element={<SendReceivePage activeWallet={activeWallet} user={currentUser} />} />
            <Route path="history" element={<HistoryPage user={currentUser} activeWallet={activeWallet} />} />
            <Route path="admin/users" element={<AdminPage />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default App;
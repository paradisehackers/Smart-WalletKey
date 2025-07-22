import { useState } from 'react';
import { Link } from 'react-router-dom'; // Import the Link component for navigation

function LoginPage({ handleLogin, handleCreateWallet, users }) {
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const onLoginSubmit = (event) => {
    event.preventDefault();
    handleLogin(loginUsername, loginPassword);
  };

  const onCreateWalletSubmit = (event) => {
    event.preventDefault();
    handleCreateWallet(createUsername, createPassword);
    // Clear only the creation form fields
    setCreateUsername('');
    setCreatePassword('');
  };

  return (
    <div>
      <form onSubmit={onLoginSubmit}>
        <h3>Login to Your Wallet</h3>
        <input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="Username" required />
        <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Unlock Wallet</button>
      </form>
      {/* --- ADDED: Link to the recovery page --- */}
      <Link to="/recover">Forgot Password?</Link>

      <hr />

      <form onSubmit={onCreateWalletSubmit}>
        <h3>Create New Wallet</h3>
        <input value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="Username" required />
        <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Create Wallet</button>
      </form>
    </div>
  );
}

export default LoginPage;
// In client/src/RecoveryPage.jsx
import React, { useState } from 'react';

function RecoveryPage({ handlePasswordReset, users }) {
  const [username, setUsername] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    const userToRecover = users.find(u => u.username === username);
    if (!userToRecover) {
      setStatus('Failed: User not found.');
      return;
    }
    setStatus('Recovering...');
    try {
      await handlePasswordReset(mnemonic, newPassword, userToRecover);
      setStatus('Success! Your password has been reset.');
    } catch (error) {
      setStatus(`Failed: ${error.message}`);
    }
  };
  return (
    <div>
      <h2>Reset Password with Recovery Phrase</h2>
      <form onSubmit={onSubmit}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your Username" required />
        <textarea value={mnemonic} onChange={(e) => setMnemonic(e.target.value)} placeholder="Enter your 18-word recovery phrase" rows="4" required />
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" required />
        <button type="submit">Reset Password</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
export default RecoveryPage;

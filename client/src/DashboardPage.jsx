import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './DashboardLayout.css';
import { Core } from '@walletconnect/core';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces } from '@walletconnect/utils';
import { getSdkError } from '@walletconnect/utils';

const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID;
const BLOCKDAG_RPC_URL = 'https://rpc.primordial.bdagscan.com';
const BLOCKDAG_CHAIN_ID = 1043;

const GREETER_CONTRACT_ADDRESS = "0x785f0bce87d6c65a20592efa4d3968d6932cd531";
const GREETER_ABI = [{"inputs":[{"internalType":"string","name":"_initialGreeting","type":"string"}],"stateMutability":"payable","type":"constructor"},{"inputs":[],"name":"greet","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_newGreeting","type":"string"}],"name":"setGreeting","outputs":[],"stateMutability":"nonpayable","type":"function"}];


function DashboardPage({ activeWallet, user, setActiveWallet }) {
  const [balance, setBalance] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [history, setHistory] = useState([]);
  
  const [greeterContract, setGreeterContract] = useState(null);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [newGreeting, setNewGreeting] = useState('');
  const [contractStatus, setContractStatus] = useState('');


  const [addressError, setAddressError] = useState('');
  const [addressIsValid, setAddressIsValid] = useState(false);
  const [wcUri, setWcUri] = useState('');
  const [dappStatus, setDappStatus] = useState('');
  const [web3wallet, setWeb3wallet] = useState(null);
  const [sessionProposal, setSessionProposal] = useState(null);
  const [sessionRequest, setSessionRequest] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!WC_PROJECT_ID) return console.error("WalletConnect Project ID is not set.");
    const initWalletConnect = async () => {
      try {
        const core = new Core({ projectId: WC_PROJECT_ID });
        const wallet = await Web3Wallet.init({
          core,
          metadata: { name: 'SmartKey Wallet', description: 'A user-friendly wallet.', url: window.location.origin, icons: [] },
        });
        setWeb3wallet(wallet);
        wallet.on('session_proposal', (proposal) => setSessionProposal(proposal));
        wallet.on('session_request', (request) => setSessionRequest(request));
      } catch (error) {
        console.error("Failed to initialize WalletConnect:", error);
      }
    };
    initWalletConnect();
  }, []);

  
  // --- This useEffect initializes the contract and fetches data ---
  useEffect(() => {
    const initPage = async () => {
      if (activeWallet && user) {
        try {
          const provider = new ethers.JsonRpcProvider(BLOCKDAG_RPC_URL);
          
          // Fetch balance
          const balanceWei = await provider.getBalance(activeWallet.address);
          setBalance(ethers.formatEther(balanceWei));

          // Fetch history
          const historyRes = await fetch(`https://smart-walletkey-api.onrender.com/api/users/${user._id}/transactions`);
          const historyData = await historyRes.json();
          setHistory(historyData);

          // --- FIX: Initialize contract with a formatted address ---
          const formattedAddress = ethers.getAddress(GREETER_CONTRACT_ADDRESS);
          const contract = new ethers.Contract(formattedAddress, GREETER_ABI, provider);
          setGreeterContract(contract);
          
          setContractStatus("Loading greeting...");
          const message = await contract.greet();
          setGreetingMessage(message);
          setContractStatus("");
        } catch (error) {
          console.error("Failed to initialize page:", error);
          setContractStatus("Failed to load contract. Check address.");
        }
      }
    };
    initPage();
  }, [activeWallet, user]);

  // --- NEW: Function to set a new greeting on the smart contract ---
  const handleSetGreeting = async (event) => {
    event.preventDefault();
    if (!newGreeting || !greeterContract || !activeWallet) return;
    try {
      setContractStatus("Sending new greeting to blockchain...");
      const provider = new ethers.JsonRpcProvider(BLOCKDAG_RPC_URL);
      const signer = activeWallet.connect(provider);
      const tx = await greeterContract.connect(signer).setGreeting(newGreeting);
      
      setContractStatus("Waiting for confirmation...");
      await tx.wait();
      
      const message = await greeterContract.greet();
      setGreetingMessage(message);
      setNewGreeting('');
      setContractStatus("Greeting updated successfully!");
      setTimeout(() => setContractStatus(''), 5000);

    } catch (error) {
      console.error("Failed to set greeting:", error);
      setContractStatus(`Error: ${error.message}`);
    }
  };

  if (!activeWallet || !user) {
    return <p>Loading dashboard...</p>;
  }

  const getBalance = async () => {
    if (activeWallet) {
      try {
        const provider = new ethers.JsonRpcProvider(BLOCKDAG_RPC_URL);
        const balanceWei = await provider.getBalance(activeWallet.address);
        setBalance(ethers.formatEther(balanceWei));
      } catch (error) {
        console.error("Could not fetch balance:", error);
      }
    }
  };

  const fetchHistory = async () => {
    if (user) {
      try {
        const response = await fetch(`https://smart-walletkey-api.onrender.com/api/users/${user._id}/transactions`);
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch transaction history:", error);
      }
    }
  };

  useEffect(() => {
    getBalance();
    fetchHistory();
  }, [activeWallet, user]);

  const handleDappConnect = async (event) => {
    event.preventDefault();
    if (!wcUri || !web3wallet) return;
    try {
      setDappStatus('Connecting...');
      await web3wallet.pair({ uri: wcUri });
    } catch (error) {
      console.error("Failed to pair with dApp:", error);
      setDappStatus(`Error: ${error.message}`);
    }
  };

  // --- CORRECTED: The definitive, working handleApprove function ---
  const handleApprove = async () => {
    if (!sessionProposal || !web3wallet || !activeWallet) return;
    try {
      const { id, params } = sessionProposal;
      const supportedNamespaces = {
        eip155: {
          chains: ['eip155:1043', 'eip155:11155111'], // Support BlockDAG and Sepolia
          methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4'],
          events: ['accountsChanged', 'chainChanged'],
          accounts: [
            `eip155:1043:${activeWallet.address}`,
            `eip155:11155111:${activeWallet.address}`
          ],
        },
      };
      const namespaces = buildApprovedNamespaces({
        proposal: params,
        supportedNamespaces,
      });
      await web3wallet.approveSession({ id, namespaces });
      setSessionProposal(null);
      setDappStatus('✅ Session approved!');
    } catch (error) {
      console.error("Failed to approve session:", error);
      alert(`Failed to approve session: ${error.message}`);
      setSessionProposal(null);
    }
  };

  const handleReject = async () => {
    if (!sessionProposal || !web3wallet) return;
    await web3wallet.rejectSession({
      id: sessionProposal.id, reason: { code: 5000, message: 'User rejected.' },
    });
    setSessionProposal(null);
  };

  const handleRequestApprove = async () => {
    if (!sessionRequest || !web3wallet || !activeWallet) return;
    const { topic, id, params } = sessionRequest;
    const { request } = params;
    let result;
    try {
      switch (request.method) {
        case 'personal_sign':
          const message = ethers.getBytes(request.params[0]);
          result = await activeWallet.signMessage(message);
          break;
        case 'eth_sendTransaction':
          const provider = new ethers.JsonRpcProvider(BLOCKDAG_RPC_URL);
          const walletWithProvider = activeWallet.connect(provider);
          const tx = request.params[0];
          const txResponse = await walletWithProvider.sendTransaction(tx);
          result = txResponse.hash;
          break;
        default:
          throw new Error("Unsupported method");
      }
      const response = { id, jsonrpc: '2.0', result };
      await web3wallet.respondSessionRequest({ topic, response });
      setSessionRequest(null);
      alert('Request approved and signed!');
    } catch(error) {
      console.error("Failed to approve request:", error);
      alert(`Failed to approve request: ${error.message}`);
      const response = { id, jsonrpc: '2.0', error: getSdkError('USER_REJECTED_METHODS') };
      await web3wallet.respondSessionRequest({ topic, response });
      setSessionRequest(null);
    }
  };

  const handleRequestReject = async () => {
    if (!sessionRequest || !web3wallet) return;
    const { topic, id } = sessionRequest;
    const response = {
      id, jsonrpc: '2.0', error: getSdkError('USER_REJECTED_METHODS'),
    };
    await web3wallet.respondSessionRequest({ topic, response });
    setSessionRequest(null);
  };

  const handleRecipientChange = (event) => {
    const address = event.target.value;
    setRecipient(address);
    if (ethers.isAddress(address)) {
      setAddressError('');
      setAddressIsValid(true);
    } else {
      setAddressIsValid(false);
      if (address) setAddressError('Invalid Ethereum Address');
      else setAddressError('');
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!activeWallet || !recipient || !amount || addressError) return alert("Please fill all fields correctly.");
    setIsSending(true);
    setTxStatus('Sending...');
    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.primordial.bdagscan.com');
      const walletWithProvider = activeWallet.connect(provider);
      const tx = { to: recipient, value: ethers.parseEther(amount) };
      const txResponse = await walletWithProvider.sendTransaction(tx);
      setTxStatus(`Transaction sent! Waiting for confirmation...`);

      const receipt = await txResponse.wait(); // The receipt contains the details
      const txToSave = {
        hash: receipt.hash,
        from: receipt.from,
        to: receipt.to,
        amount: amount,
        blockNumber: receipt.blockNumber,
        gasUsed: ethers.formatEther(receipt.gasUsed * receipt.gasPrice), // Calculate Txn Fee
      };

      await fetch('https://smart-walletkey-api.onrender.com/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txToSave),
      });
      setTxStatus('Transaction confirmed & saved!');
      getBalance();
      setHistory(prevHistory => [{...txToSave, timestamp: new Date().toISOString()}, ...prevHistory]);
    } catch (error) {
      console.error("Failed to send transaction:", error);
      let friendlyError = 'Transaction failed.';
      if (error.reason) friendlyError = `Transaction failed: ${error.reason}`;
      else if (error.message && error.message.includes('insufficient funds')) {
        friendlyError = 'Insufficient funds for transaction.';
      }
      setTxStatus(friendlyError);
      const failedTx = {
        hash: `failed-${Date.now()}`, to: recipient, amount: amount, status: 'Failed', from: activeWallet.address
      };
      setHistory(prevHistory => [failedTx, ...prevHistory]);
    } finally {
      setIsSending(false);
      setRecipient('');
      setAmount('');
      setTimeout(() => setTxStatus(''), 5000);
    }
  };

  return (
    <div className="dashboard-container">
      <main className="main-content">
        <header className="header">
          <h2>Welcome back, {user ? user.username : ''}!</h2>
          <p>Wallet Address: {activeWallet.address}</p>
        </header>
        <div className="balance-card">
          <p>Total Balance</p>
          <div className="total-balance">$0.00</div>
          <p className="eth-balance">{balance} BDAG</p>
        </div>
        
        <div className="contract-container">
        <h3>Greeter Smart Contract Interaction</h3>
        <p>This message is stored on the BlockDAG blockchain.</p>
        <p className="greeting-message">Current Greeting: <strong>"{greetingMessage}"</strong></p>
        
        <form onSubmit={handleSetGreeting}>
          <input 
            type="text" 
            value={newGreeting} 
            onChange={(e) => setNewGreeting(e.target.value)}
            placeholder="Enter a new greeting"
            required
          />
          <button type="submit" className="action-button">Set Greeting</button>
        </form>
        {contractStatus && <p><i>{contractStatus}</i></p>}
      </div>

        {sessionProposal && (
          <div className="modal">
            <h3>Session Proposal</h3>
            <p>A dApp at <strong>{sessionProposal.params.proposer.metadata.url}</strong> wants to connect.</p>
            <button onClick={handleApprove} className="action-button">Approve</button>
            <button onClick={handleReject} className="logout-button">Reject</button>
          </div>
        )}

        {sessionRequest && (
          <div className="modal">
            <h3>dApp Request</h3>
            <p><strong>Method:</strong> {sessionRequest.params.request.method}</p>
            <pre><strong>Details:</strong> {JSON.stringify(sessionRequest.params.request.params, null, 2)}</pre>
            <button onClick={handleRequestApprove} className="action-button">Approve</button>
            <button onClick={handleRequestReject} className="logout-button">Reject</button>
          </div>
        )}

        <div className="actions-container">
          <div className="send-container">
            <h3>Send BDAG</h3>
            <form onSubmit={handleSend}>
              <div>
                <label>Recipient Address: </label>
                <input type="text" value={recipient} onChange={handleRecipientChange} placeholder="Recipient Address" required />
                {addressIsValid && <p style={{ color: 'green', fontSize: '12px' }}>✓ Verified Address</p>}
                {addressError && <p style={{ color: 'red', fontSize: '12px' }}>{addressError}</p>}
              </div>
              <div>
                <label>Amount (BDAG): </label>
                <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (BDAG)" required />
              </div>
              <button type="submit" className="action-button" disabled={isSending}>
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </form>
            {txStatus && <p><i>Status: {txStatus}</i></p>}
          </div>
          <div className="history-container">
        <h3>Transaction History</h3>
        <ul>
          {/* --- UPDATED: History display now shows more details --- */}
          {history.slice(0, 5).map((tx) => {
            const isSender = activeWallet && tx.from && tx.from.toLowerCase() === activeWallet.address.toLowerCase();
            const explorerUrl = `https://primordial.bdagscan.com/transaction/${tx.hash}`;
            const isFailedLocal = tx.hash && tx.hash.startsWith('failed-');

            return (
              <li key={tx.hash} className={tx.status === 'Failed' ? 'failed-tx' : ''}>
                <div>
                  <strong>{tx.status === 'Failed' ? 'Failed: ' : ''}{isSender ? 'Sent' : 'Received'} {tx.amount} BDAG</strong>
                </div>
                <small>{isSender ? `To: ${tx.to.substring(0, 10)}...` : `From: ${tx.from.substring(0, 10)}...`}</small>
                <small> | {new Date(tx.timestamp).toLocaleString()}</small>
                
                {!isFailedLocal && tx.hash && (
                  <small> | Block: {tx.blockNumber} | 
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer"> View on Explorer</a>
                  </small>
                )}
              </li>
            )
          })}
        </ul>
      </div>
        </div>
        
        <div className="dapp-container">
          <h3>Connect to dApp</h3>
          <p>Paste a WalletConnect URI to connect.</p>
          <form onSubmit={handleDappConnect}>
            <input type="text" value={wcUri} onChange={(e) => setWcUri(e.target.value)} placeholder="wc:..." />
            <button type="submit" className="action-button">Connect</button>
          </form>
          {dappStatus && <p><i>{dappStatus}</i></p>}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
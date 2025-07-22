const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const crypto = require('crypto');
const argon2 = require('argon2');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Make sure to use your real password here
const uri = "mongodb+srv://heavenly:xmSn1jt1OqANz0eh@walletx.p12gnkn.mongodb.net/myDatabaseName?retryWrites=true&w=majority&appName=Walletx";

mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB Connected..."))
  .catch(err => console.log(err));

// --- Mongoose Schema & Model for a User ---
const userSchema = new mongoose.Schema({
  username: String,
  walletAddress: { type: String, required: true, unique: true },
  encryptedPrivateKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const User = mongoose.model('User', userSchema);


// --- NEW: Mongoose Schema & Model for a Transaction ---
const transactionSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  blockNumber: { type: Number },
  timestamp: { type: Date, default: Date.now },
  gasUsed: { type: String }, // For the transaction fee
});

const Transaction = mongoose.model('Transaction', transactionSchema);


// --- API Routes for Users ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- UPDATED: Create User route is now simpler ---
app.post('/api/users', async (req, res) => {
  const user = new User({
    username: req.body.username,
    walletAddress: req.body.walletAddress,
    encryptedPrivateKey: req.body.encryptedPrivateKey
  });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser); // Doesn't need to send a recovery key anymore
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- NEW: Route for the password reset flow ---
app.post('/api/users/reset-password-with-key', async (req, res) => {
  try {
    const { username, newEncryptedPrivateKey } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    user.encryptedPrivateKey = newEncryptedPrivateKey;
    await user.save();
    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// --- UPDATED: Transaction routes now handle both sender and receiver ---
app.post('/api/transactions', async (req, res) => {
  try {
    const sender = await User.findOne({ walletAddress: req.body.from });
    const receiver = await User.findOne({ walletAddress: req.body.to });

    const newTransaction = new Transaction({
      hash: req.body.hash,
      from: req.body.from,
      to: req.body.to,
      amount: req.body.amount,
      sender: sender ? sender._id : null,
      receiver: receiver ? receiver._id : null,
      blockNumber: req.body.blockNumber,
      gasUsed: req.body.gasUsed,
      // Timestamp will be added by default by MongoDB
    });
    
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/users/:userId/transactions', async (req, res) => {
  try {
    // Find all transactions where the user is either the sender OR the receiver
    const transactions = await Transaction.find({
      $or: [{ sender: req.params.userId }, { receiver: req.params.userId }]
    }).sort({ _id: -1 }); // Sort by newest first
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`🚀 Server is listening on port ${port}`);
});
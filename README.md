# Smart-WalletKey
A user-friendly smart wallet for the BlockDAG Hackathon with dApp connectivity and a secure recovery phrase system.


## Project Overview & Purpose
SmartKey Wallet is a user-friendly, non-custodial smart wallet designed to simplify the Web3 experience for new users. It removes common barriers like seed phrases by offering a secure username/password system with an 18-word recovery phrase, while providing core Web3 functionalities like dApp connectivity and smart contract interaction on the BlockDAG network.

## Features
* **Secure Wallet Creation:** Client-side generation of wallets with password-encrypted private keys.
* **18-Word Recovery Phrase:** A user-friendly, non-custodial method for account recovery.
* **BlockDAG Testnet Integration:** Full connectivity to the Primordial testnet for balance display and transactions.
* **Transaction History:** Two-way history for both sent and received BDAG tokens.
* **dApp Connectivity:** Connect to dApps using the WalletConnect v2 protocol.
* **Smart Contract Interaction:** Deployed and interacts with a custom "Greeter" smart contract on the BlockDAG network.
* **Admin View:** A special view for a designated admin user to see all registered wallets.

## Installation Steps
**Back-End Server:**
1. Navigate to the project root folder.
2. Run `npm install` to install dependencies.
3. Run `node app.js` to start the server.

**Front-End Application:**
1. Navigate to the `/client` folder.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the front-end server.

## Usage Instructions
1. Create a new wallet using a username and password.
2. Save the 18-word recovery phrase.
3. Log in to access the dashboard.
4. Use the BlockDAG Faucet to fund your wallet with testnet BDAG.
5. Send BDAG, connect to a dApp, or interact with the Greeter smart contract.

## Deployed Smart Contract Address
* **Greeter Contract:** `YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE`

## License
This project is licensed under the MIT License.

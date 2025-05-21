YieldHunter
YieldHunter is a DeFi yield optimization platform that helps users discover and manage high-yield 
opportunities across multiple blockchain networks.
X Account - https://x.com/Brainiac_A
Table of Contents
Prerequisites
Installation
Configuration
Running the Application
Features
Supported Networks
Troubleshooting
Prerequisites
Before setting up YieldHunter, ensure you have the following installed:

Node.js (v16 or higher)
npm (v7 or higher) or yarn
Git
Installation
Clone the repository:
git clone https://github.com/yourusername/yieldhunter.git


Navigate to the project directory:
cd yieldhunter


Install dependencies for both client and server:
npm install


Configuration
Environment Variables
Create a .env file in the root directory with the following variables:

# Server Configuration
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/yieldhunter

# Client Configuration
VITE_API_URL=http://localhost:3001/api

# Blockchain RPC URLs (optional - defaults are provided)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-key
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
BASE_RPC_URL=https://mainnet.base.org
OPTIMISM_RPC_URL=https://mainnet.optimism.io


Database Setup
Create a PostgreSQL database:
createdb yieldhunter

Run database migrations:
npm run migrate


Running the Application
Development Mode
Start the server:
npm run server:dev


In a separate terminal, start the client:
npm run client:dev


Access the application at http://localhost:3000
Production Mode
Build the client:
npm run client:build


Start the production server:
npm run start


Access the application at the configured port (default: http://localhost:3001)
Features
Multi-chain Support: Connect to Ethereum, Arbitrum, Polygon, BSC, Base, and Optimism
Opportunity Discovery: Find the best yield opportunities across multiple networks
Transaction History: Track your DeFi interactions
Risk Assessment: Filter opportunities based on risk tolerance
Agent Configuration: Set up automated scanning for new opportunities
Supported Networks
YieldHunter currently supports the following networks:

Network ID	Network Name
1	Ethereum
42161	Arbitrum
137	Polygon
56	BSC
8453	Base
10	Optimism
11155111	Sepolia (Testnet)

Troubleshooting
Wallet Connection Issues
If you're having trouble connecting your wallet:

Ensure you have a compatible wallet extension installed (coinbase wallet,metamask etc.)
Check that you're on a supported network
Clear your browser cache and reload the application
Transaction Failures
If transactions are failing:

Verify you have sufficient funds for gas fees
Check that the contract you're interacting with is still active
Ensure you've approved token spending if interacting with ERC20 tokens
API Connection Issues
If the client can't connect to the server:

Verify the server is running
Check that the VITE_API_URL in your environment variables is correct
Look for CORS issues in your browser console
For additional help, please open an issue on the GitHub repository.


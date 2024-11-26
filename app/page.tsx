"use client";

// Importing necessary packages and components
import { CHAIN_NAMESPACES, IAdapter, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Box, Paper, Typography, Button, TextField } from "@mui/material";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { AccountAbstractionProvider, SafeSmartAccount } from "@web3auth/account-abstraction-provider";
import { ethers } from "ethers"; // Used for blockchain interaction
import { formatUnits, parseUnits } from "ethers"; // Utility functions for token formatting
import { useEffect, useState, useRef } from "react"; // React hooks for managing state and lifecycle

// Web3Auth client ID for initialization
const clientId = "BN6F8-BoCoUwSBlKODDCA8yWvkpZfiflGunSxVAz4yCQ1Zxrd2u0TEjQQkjG_Vx6qtAE7G4K01moqw1XGRX1u8s";

// API key for Pimlico (bundler and paymaster)
const pimlicoAPIKey = "pim_NQiLku6tPP9FW3Tn7B78JH";

// Platform fee contract address (to be replaced with your actual deployed contract address)
const platformFeeContractAddress = "YOUR_PLATFORM_FEE_CONTRACT_ADDRESS";

// USDC contract address on Polygon Amoy Testnet (replace with the correct address for other networks)
const usdcContractAddress = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582";

// Configuration for the blockchain (Polygon Amoy Testnet)
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155, // Ethereum-compatible namespace
  chainId: "0x13882", // Chain ID for Polygon Amoy Testnet
  rpcTarget: "https://rpc.ankr.com/polygon_amoy", // RPC URL for interacting with the chain
  displayName: "Polygon Amoy Testnet", // Friendly name for the chain
  ticker: "MATIC", // Currency ticker
  tickerName: "Matic", // Currency full name
};

// ABI for interacting with the platform fee contract
const platformFeeContractABI = [
  "function transferWithPlatformFee(address recipient, uint256 amount, uint256 fee) public",
];

// Ethereum provider for private key-based interaction
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Account abstraction provider configuration
const accountAbstractionProvider = new AccountAbstractionProvider({
  config: {
    chainConfig,
    smartAccountInit: new SafeSmartAccount(), // Safe smart account initialization
    bundlerConfig: {
      url: `https://api.pimlico.io/v2/13882/rpc?apikey=${pimlicoAPIKey}`, // Bundler API URL
    },
    paymasterConfig: {
      url: `https://api.pimlico.io/v2/13882/rpc?apikey=${pimlicoAPIKey}`, // Paymaster API URL
    },
  },
});

function App() {
  // State variables
  const [provider, setProvider] = useState<IProvider | null>(null); // Blockchain provider
  const [usdcBalance, setUsdcBalance] = useState<string>(""); // USDC balance
  const [walletAddress, setWalletAddress] = useState<string>(""); // User's wallet address
  const [loggedIn, setLoggedIn] = useState(false); // Login state
  const web3auth = useRef<Web3Auth | null>(null); // Ref for Web3Auth instance
  const [isInitialized, setIsInitialized] = useState(false); // Web3Auth initialization status

  // Form inputs for recipient and amount
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);

  // Computed platform fee and total amount
  const platformFee = amount * 0.05;
  const totalAmount = amount + platformFee;

  // Function to fetch and set the user's wallet address
  const fetchWalletAddress = async () => {
    if (provider) {
      const signer = new ethers.BrowserProvider(provider).getSigner();
      const address = await (await signer).getAddress();
      setWalletAddress(address);
    }
  };

  // Function to fetch and set the user's USDC balance
  const fetchUsdcBalance = async () => {
    if (provider) {
      const signer = new ethers.BrowserProvider(provider).getSigner();
      const usdcContract = new ethers.Contract(
        usdcContractAddress,
        ["function balanceOf(address owner) view returns (uint256)"],
        await signer
      );
      const balance = await usdcContract.balanceOf(await (await signer).getAddress());
      setUsdcBalance(formatUnits(balance, 6)); // Assuming USDC has 6 decimals
    }
  };

  // Initialization of Web3Auth and WalletServicesPlugin
  useEffect(() => {
    const init = async () => {
      try {
        const web3AuthOptions: Web3AuthOptions = {
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
          accountAbstractionProvider,
        };

        // Initialize Web3Auth
        web3auth.current = new Web3Auth(web3AuthOptions);
        await web3auth.current.initModal();

        // Set initial state
        setIsInitialized(true);
        setProvider(web3auth.current.provider);
        if (web3auth.current.connected) {
          setLoggedIn(true);
          await fetchWalletAddress();
          await fetchUsdcBalance();
        }
      } catch (error) {
        console.error("Error initializing Web3Auth or WalletServicesPlugin:", error);
      }
    };

    init(); // Call the initialization function
  }, []);

   // Refetch balance when logged in state changes
  useEffect(() => {
    if (loggedIn) {
      fetchWalletAddress();
      fetchUsdcBalance();

    }
  }, [loggedIn]);

  // Function to handle transaction with platform fee
  const sendWithPlatformFee = async () => {
    if (!provider || !recipientAddress || amount <= 0) return;

    const signer = new ethers.BrowserProvider(provider).getSigner();
    const platformFeeContract = new ethers.Contract(
      platformFeeContractAddress,
      platformFeeContractABI,
      await signer
    );

    try {
      const tx = await platformFeeContract.transferWithPlatformFee(
        recipientAddress,
        parseUnits(amount.toString(), 6), // Convert amount to 6 decimals
        parseUnits(platformFee.toString(), 6) // Convert fee to 6 decimals
      );
      await tx.wait(); // Wait for transaction confirmation
      console.log("Transaction with platform fee sent!");
      await fetchUsdcBalance(); // Update balance after transaction
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  // Function to log in the user
  const login = async () => {
    if (web3auth.current) {
      const web3authProvider = await web3auth.current.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);
      await fetchWalletAddress();
      await fetchUsdcBalance();
    }
  };

  // Function to log out the user
  const logout = async () => {
    if (web3auth.current) {
      await web3auth.current.logout();
      setProvider(null);
      setLoggedIn(false);
      setWalletAddress("");
    }
  };

  // Views for logged-in and unlogged-in states
const loggedInView = (
  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        maxWidth: 450,
        borderRadius: 4,
        p: 3,
        textAlign: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Wallet overview */}
      <Typography variant="h5" gutterBottom>
        Wallet Overview
      </Typography>

      {/* Wallet address display */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Wallet Address:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            wordBreak: "break-all",
            overflowWrap: "anywhere",
            fontWeight: "bold",
            mt: 1,
            backgroundColor: "#e0e0e0",
            p: 1,
            borderRadius: 1,
          }}
        >
          {walletAddress}
        </Typography>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(walletAddress);
            alert("Wallet address copied!");
          }}
          variant="outlined"
          color="primary"
          sx={{ mt: 1 }}
        >
          Copy Address
        </Button>
      </Box>

      {/* USDC balance display */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="textSecondary">
          USDC Balance:
        </Typography>
        <Typography variant="h6" color="primary" sx={{ fontWeight: "bold", mt: 1 }}>
          {usdcBalance ? usdcBalance : "Loading..."}
        </Typography>
      </Box>

      {/* Form for transferring USDC */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Donate USDC
        </Typography>
        <TextField
          label="Campaign Address"
          variant="outlined"
          fullWidth
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        />
        <TextField
          label="Amount (USDC)"
          type="number"
          variant="outlined"
          fullWidth
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          sx={{ mb: 2 }}
        />
        {/* Platform fee and total display */}
        <Typography
          variant="subtitle2"
          color="textSecondary"
          sx={{ textAlign: "left", mt: 2 }}
        >
          Platform Fee (5%): {platformFee.toFixed(6)} USDC
        </Typography>
        <Typography
          variant="subtitle2"
          color="textSecondary"
          sx={{ textAlign: "left", mt: 1 }}
        >
          Total Amount: {totalAmount.toFixed(6)} USDC
        </Typography>

        {/* Buttons for interacting with the platform */}
        <Button
          onClick={sendWithPlatformFee}
          disabled={!amount || totalAmount > parseFloat(usdcBalance)}
          variant="contained"
          color="secondary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Send USDC with Platform Fee
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={logout} variant="contained" color="error">
          Logout
        </Button>

        {/* Buy USDC button */}
        <Button
          onClick={() => alert("Not available for now, on testnet")}
          variant="contained"
          color="secondary"
        >
          Buy USDC
        </Button>
      </Box>
    </Paper>
  </Box>
);
  const unloggedInView = (
    <button onClick={login} className="card">Login</button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/sdk/pnp/web/modal" rel="noreferrer">
          PennyFundMe{" "}
        </a>
        & NextJS Quick Start
      </h1>
      {!isInitialized ? (
      <p>Loading Web3Auth...</p> // Display loading message if still initializing
    ) : (
      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
    )}
    </div>
  );
}

export default App;

/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */

"use client";

// Import necessary modules and types from Web3Auth SDK
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { useEffect, useState } from "react";

// Import custom RPC methods for blockchain interactions
import RPC from "./ethersRPC";

// Client ID from Web3Auth dashboard
const clientId = "BN6F8-BoCoUwSBlKODDCA8yWvkpZfiflGunSxVAz4yCQ1Zxrd2u0TEjQQkjG_Vx6qtAE7G4K01moqw1XGRX1u8s";

// Chain configuration for the Ethereum Sepolia Testnet
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882", // hex of 80002, polygon testnet
  rpcTarget: "https://rpc.ankr.com/polygon_amoy",
  displayName: "Polygon Amoy Testnet",
  blockExplorerUrl: "https://amoy.polygonscan.com",
  ticker: "MATIC",
  tickerName: "Matic",
  logo: "https://cryptologos.cc/logos/matic-network-matic-logo.png",
};

// Initialize the Ethereum private key provider with chain configuration
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Web3Auth options including clientId, network, and private key provider
const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
};

// Initialize Web3Auth with options
const web3auth = new Web3Auth(web3AuthOptions);

function App() {
  // State to track provider and login status
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Configure Social Login Adapter explicitly for Web3Auth
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: "sapphire_devnet", // Network configuration
            clientId,
          },
        });
        web3auth.configureAdapter(openloginAdapter);

        // Initialize the modal, which will prioritize social login
        await web3auth.initModal();

        // Set provider after initialization
        setProvider(web3auth.provider);

        // Check login status and update state
        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      }
    };

    // Call the initialization function
    init();
  }, []);

  // Login function to connect Web3Auth
  const login = async () => {
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      if (web3auth.connected) {
        setLoggedIn(true);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Fetch user information from Web3Auth
  const getUserInfo = async () => {
    try {
      const user = await web3auth.getUserInfo();
      uiConsole(user);
    } catch (error) {
      console.error("Failed to get user info:", error);
    }
  };

  // Logout function to disconnect Web3Auth
  const logout = async () => {
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      uiConsole("logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Blockchain call to get connected accounts
  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const address = await RPC.getAccounts(provider);
    uiConsole(address);
  };

  // Blockchain call to fetch balance of connected account
  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const balance = await RPC.getBalance(provider);
    uiConsole(balance);
  };

  // Blockchain call to sign a message
  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const signedMessage = await RPC.signMessage(provider);
    uiConsole(signedMessage);
  };

  // Blockchain call to send a transaction
  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole("Sending Transaction...");
    const transactionReceipt = await RPC.sendTransaction(provider);
    uiConsole(transactionReceipt);
  };

  // Utility function to display messages on UI and console
  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
      console.log(...args);
    }
  }

  // Render view when user is logged in
  const loggedInView = (
    <>
      <div className="flex-container">
        <button onClick={getUserInfo} className="card">Get User Info</button>
        <button onClick={getAccounts} className="card">Get Accounts</button>
        <button onClick={getBalance} className="card">Get Balance</button>
        <button onClick={signMessage} className="card">Sign Message</button>
        <button onClick={sendTransaction} className="card">Send Transaction</button>
        <button onClick={logout} className="card">Log Out</button>
      </div>
    </>
  );

  // Render view when user is not logged in
  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  // Main component render function
  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/sdk/pnp/web/modal" rel="noreferrer">
          PennyFundMe{" "}
        </a>
        & NextJS Quick Start
      </h1>
      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/web3auth-pnp-examples/tree/main/web-modal-sdk/quick-starts/nextjs-modal-quick-start"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;

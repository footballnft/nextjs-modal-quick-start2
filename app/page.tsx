"use client";

import { CHAIN_NAMESPACES, IAdapter, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { AccountAbstractionProvider, SafeSmartAccount } from "@web3auth/account-abstraction-provider";
import { useEffect, useState, useRef } from "react";

// Web3Auth client ID and Pimlico API key (replace with your actual API key)
const clientId = "BN6F8-BoCoUwSBlKODDCA8yWvkpZfiflGunSxVAz4yCQ1Zxrd2u0TEjQQkjG_Vx6qtAE7G4K01moqw1XGRX1u8s";
const pimlicoAPIKey = "pim_NQiLku6tPP9FW3Tn7B78JH";

// Polygon Amoy testnet configuration for Web3Auth and Pimlico
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882",
  rpcTarget: "https://rpc.ankr.com/polygon_amoy",
  displayName: "Polygon Amoy Testnet",
  ticker: "MATIC",
  tickerName: "Matic",
};

// Ethereum private key provider setup for standard transactions
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Account Abstraction Provider setup with Pimlico Bundler and Paymaster
const accountAbstractionProvider = new AccountAbstractionProvider({
  config: {
    chainConfig,
    smartAccountInit: new SafeSmartAccount(),
    bundlerConfig: {
      url: `https://api.pimlico.io/v2/13882/rpc?apikey=${pimlicoAPIKey}`, // Pimlico endpoint for bundler
    },
    paymasterConfig: {
      url: `https://api.pimlico.io/v2/13882/rpc?apikey=${pimlicoAPIKey}`, // Pimlico endpoint for paymaster
    },
  },
});

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  const web3auth = useRef<Web3Auth | null>(null);
  const [pluginConnected, setPluginConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Web3Auth configuration options
        const web3AuthOptions: Web3AuthOptions = {
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider, // Standard transaction provider
          accountAbstractionProvider, // SCW and gasless transactions provider
          useAAWithExternalWallet: true, // Enables Smart Account for external wallets
        };

        // Initialize Web3Auth instance
        web3auth.current = new Web3Auth(web3AuthOptions);
        await web3auth.current.initModal(); // Open modal for user authentication

        // Initialize WalletServicesPlugin for additional wallet features
        const walletPlugin = new WalletServicesPlugin({
          wsEmbedOpts: {},
          walletInitOptions: {
            whiteLabel: {
              showWidgetButton: true,
              buttonPosition: "bottom-right",
              logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
              logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
            },
            confirmationStrategy: "modal",
          },
        });

        // Add WalletServicesPlugin to Web3Auth
        web3auth.current.addPlugin(walletPlugin);
        setWalletServicesPlugin(walletPlugin);

        // Listen for plugin connection event
        walletPlugin.on("connected", () => {
          console.log("WalletServicesPlugin connected");
          setPluginConnected(true);
        });

        // Set provider and login status
        setProvider(web3auth.current.provider);
        if (web3auth.current.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      }
    };

    init();
  }, []);

  // Handle user login
  const login = async () => {
    try {
      if (web3auth.current) {
        const web3authProvider = await web3auth.current.connect();
        setProvider(web3authProvider);
        setLoggedIn(true);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Handle user logout
  const logout = async () => {
    try {
      if (web3auth.current) {
        await web3auth.current.logout();
        setProvider(null);
        setLoggedIn(false);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Open Wallet Services UI if plugin is connected
  const openWalletServices = async () => {
    if (walletServicesPlugin && pluginConnected) {
      try {
        console.log("Attempting to open Wallet Services...");
        await walletServicesPlugin.showWalletUi();
      } catch (error) {
        console.error("Failed to open Wallet Services:", error);
      }
    } else {
      console.error("WalletServicesPlugin is not initialized or not connected");
    }
  };

  // View when user is logged in
  const loggedInView = (
    <div>
      <p>Welcome to PennyFundMe! You’re now logged in.</p>
      <button onClick={logout} className="card">
        Logout
      </button>
      <button onClick={openWalletServices} className="card">
        Go to Wallet Services
      </button>
    </div>
  );

  // View when user is not logged in
  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/sdk/pnp/web/modal" rel="noreferrer">
          PennyFundMe{" "}
        </a>
        & NextJS Quick Start
      </h1>
      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
    </div>
  );
}

export default App;

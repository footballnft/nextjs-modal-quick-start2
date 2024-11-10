"use client";
/*
import { CHAIN_NAMESPACES, IAdapter, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
// import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
// import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { AccountAbstractionProvider, SafeSmartAccount } from "@web3auth/account-abstraction-provider";
import { useEffect, useState, useRef } from "react";

const clientId = "BN6F8-BoCoUwSBlKODDCA8yWvkpZfiflGunSxVAz4yCQ1Zxrd2u0TEjQQkjG_Vx6qtAE7G4K01moqw1XGRX1u8s";
const pimlicoAPIKey = "pim_NQiLku6tPP9FW3Tn7B78JH"; // Replace with your Pimlico API key

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882",
  rpcTarget: "https://rpc.ankr.com/polygon_amoy",
  displayName: "Polygon Amoy Testnet",
  ticker: "MATIC",
  tickerName: "Matic",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Initialize the Account Abstraction Provider with Pimlico Bundler and Paymaster
const accountAbstractionProvider = new AccountAbstractionProvider({
  config: {
    chainConfig,
    smartAccountInit: new SafeSmartAccount(),
    bundlerConfig: {
      url: `https://api.pimlico.io/v2/13882/rpc?apikey=${pimlicoAPIKey}`, // Update with correct chain ID for Pimlico if needed
    },
    paymasterConfig: {
      url: `https://api.pimlico.io/v2/13882/rpc?apikey=${pimlicoAPIKey}`,
    },
  },
});


function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  let web3auth = useRef<Web3Auth | null>(null);
  const [pluginConnected, setPluginConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {

        const web3AuthOptions: Web3AuthOptions = {
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider, // Original provider for standard transactions
          accountAbstractionProvider, // Use this provider for SCW and gasless transactions
          useAAWithExternalWallet: true, // Enable Smart Account for external wallets as well
        }
        // const web3auth = new Web3Auth(web3AuthOptions);
        // IMP END - SDK Initialization
        web3auth.current = new Web3Auth(web3AuthOptions);

        // IMP START - Configuring External Wallets
        //const adapters = await getDefaultExternalAdapters({ options: web3AuthOptions });

       // adapters.forEach((adapter) => {
         // if (web3auth.current && "configureAdapter" in web3auth.current) {
            // @ts-ignore: configureAdapter might not be part of the type in older versions
            // web3auth.current.configureAdapter(adapter as IAdapter<unknown>);
         // }
       // });

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: "sapphire_devnet",
            clientId,
          },
        });

        //web3auth.current.configureAdapter(adapter);
        await web3auth.current.initModal();

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
        web3auth.current.addPlugin(walletPlugin);
        setWalletServicesPlugin(walletPlugin);

        // Listen for the connected event
        walletPlugin.on("connected", () => {
          console.log("WalletServicesPlugin connected");
          setPluginConnected(true);
        });

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
*/
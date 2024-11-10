/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console

"use client";

import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { useEffect, useState, useRef } from "react";
// import RPC from "./ethersRPC";

const clientId = "BN6F8-BoCoUwSBlKODDCA8yWvkpZfiflGunSxVAz4yCQ1Zxrd2u0TEjQQkjG_Vx6qtAE7G4K01moqw1XGRX1u8s";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882",
  rpcTarget: "https://rpc.ankr.com/polygon_amoy",
  displayName: "Polygon Amoy Testnet",
  blockExplorerUrl: "https://amoy.polygonscan.com",
  ticker: "MATIC",
  tickerName: "Matic",
  logo: "https://cryptologos.cc/logos/matic-network-matic-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  const web3auth = useRef<Web3Auth | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        web3auth.current = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
        });

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: "sapphire_devnet",
            clientId,
          },
        });
        web3auth.current.configureAdapter(openloginAdapter);
        await web3auth.current.initModal();

        const walletPlugin = new WalletServicesPlugin({
          wsEmbedOpts: {},
          walletInitOptions: {
            whiteLabel: { showWidgetButton: true, buttonPosition: "bottom-right" },
            confirmationStrategy: "modal",
          },
        });
        web3auth.current.addPlugin(walletPlugin);
        setWalletServicesPlugin(walletPlugin);

        setProvider(web3auth.current.provider);
        if (web3auth.current.connected) {
          setLoggedIn(true);
          // Redirect user to Wallet Services UI after login
          await walletPlugin.showCheckout();
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
        // Redirect to Wallet Services UI upon login
        if (walletServicesPlugin) {
          await walletServicesPlugin.showCheckout();
        }
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
      <div className="grid">{loggedIn ? <p>Redirecting to Wallet Services...</p> : unloggedInView}</div>
    </div>
  );
}

export default App;
*/
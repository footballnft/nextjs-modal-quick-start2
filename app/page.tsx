/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */

"use client";

import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin"; // Import WalletServicesPlugin
import { useEffect, useState } from "react";
import RPC from "./ethersRPC";

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

const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
};

const web3auth = new Web3Auth(web3AuthOptions);

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: "sapphire_devnet",
            clientId,
          },
        });
        web3auth.configureAdapter(openloginAdapter);

        await web3auth.initModal();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
          // Initialize WalletServicesPlugin here, if necessary
          const walletServicesPlugin = new WalletServicesPlugin(); // Initialize without provider
          console.log("WalletServicesPlugin initialized.");
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      }
    };

    init();
  }, []);

  const login = async () => {
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);

      if (web3auth.connected) {
        setLoggedIn(true);
        console.log("Logged in successfully.");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      console.log("logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/sdk/pnp/web/modal" rel="noreferrer">
          PennyFundMe{" "}
        </a>
        & NextJS Quick Start
      </h1>
      <div className="grid">{loggedIn ? <LoggedInView logout={logout} /> : <UnloggedInView login={login} />}</div>
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

const LoggedInView = ({ logout }: { logout: () => Promise<void> }) => (
  <>
    <div className="flex-container">
      <button onClick={logout} className="card">Log Out</button>
    </div>
  </>
);

const UnloggedInView = ({ login }: { login: () => Promise<void> }) => (
  <button onClick={login} className="card">
    Login
  </button>
);

export default App;

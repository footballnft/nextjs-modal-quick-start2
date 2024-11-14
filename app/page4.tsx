"use client";

import { CHAIN_NAMESPACES, IAdapter, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { AccountAbstractionProvider, SafeSmartAccount } from "@web3auth/account-abstraction-provider";
import { ethers } from "ethers"; // Import ethers for balance retrieval and transaction
import { formatUnits, parseUnits } from "ethers";
import { useEffect, useState, useRef } from "react";

const clientId = "YOUR_CLIENT_ID";
const pimlicoAPIKey = "YOUR_PIMLICO_API_KEY";
const platformFeeContractAddress = "YOUR_PLATFORM_FEE_CONTRACT_ADDRESS"; // Replace with your deployed contract address

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882",
  rpcTarget: "https://rpc.ankr.com/polygon_amoy",
  displayName: "Polygon Amoy Testnet",
  ticker: "MATIC",
  tickerName: "Matic",
};

// ABI for the platform fee smart contract
const platformFeeContractABI = [
  "function transferWithPlatformFee(address recipient, uint256 amount, uint256 fee) public",
];

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const accountAbstractionProvider = new AccountAbstractionProvider({
  config: {
    chainConfig,
    smartAccountInit: new SafeSmartAccount(),
    bundlerConfig: {
      url: `https://api.pimlico.io/v2/13882/rpc?apikey=${pimlicoAPIKey}`,
    },
    paymasterConfig: {
      url: `https://api.pimlico.io/v2/13882/rpc?apikey=${pimlicoAPIKey}`,
    },
  },
});

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>(""); // State for USDC balance
  const [loggedIn, setLoggedIn] = useState(false);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  const web3auth = useRef<Web3Auth | null>(null);
  const [pluginConnected, setPluginConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUsdcBalance = async () => {
    if (provider) {
      const signer = new ethers.BrowserProvider(provider).getSigner();
      const usdcContract = new ethers.Contract(
        "USDC_CONTRACT_ADDRESS",
        ["function balanceOf(address owner) view returns (uint256)"],
        await signer
      );
      const balance = await usdcContract.balanceOf(await (await signer).getAddress());
      setUsdcBalance(formatUnits(balance, 6)); // Assuming USDC has 6 decimals
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const web3AuthOptions: Web3AuthOptions = {
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
          accountAbstractionProvider,
        };

        web3auth.current = new Web3Auth(web3AuthOptions);
        await web3auth.current.initModal();

        const walletPlugin = new WalletServicesPlugin({
          wsEmbedOpts: {},
          walletInitOptions: {
            whiteLabel: {
              showWidgetButton: true,
              buttonPosition: "bottom-right",
            },
            confirmationStrategy: "modal",
          },
        });

        web3auth.current.addPlugin(walletPlugin);
        setWalletServicesPlugin(walletPlugin);

        walletPlugin.on("connected", () => {
          console.log("WalletServicesPlugin connected");
          setPluginConnected(true);
        });

        setIsInitialized(true);
        setProvider(web3auth.current.provider);
        if (web3auth.current.connected) {
          setLoggedIn(true);
          await fetchUsdcBalance();
        }
      } catch (error) {
        console.error("Error initializing Web3Auth or WalletServicesPlugin:", error);
      }
    };

    init();
  }, []);

  // Fetch balance when logged in state changes
  useEffect(() => {
    if (loggedIn) {
      fetchUsdcBalance();
    }
  }, [loggedIn]);


  const sendWithPlatformFee = async (amount: number) => {
    if (!provider) return;

    const signer = new ethers.BrowserProvider(provider).getSigner();
    const platformFeeContract = new ethers.Contract(
        platformFeeContractAddress,
        platformFeeContractABI,
        await signer
    );

    try {
        // Directly call the contract with the total amount
        const tx = await platformFeeContract.transferWithPlatformFee(
            "RECIPIENT_ADDRESS", // Replace with recipient's address
            parseUnits(amount.toString(), 6)
        );
        await tx.wait();
        console.log("Transaction with platform fee sent!");
        await fetchUsdcBalance();
    } catch (error) {
        console.error("Transaction failed:", error);
    }
};


  const login = async () => {
    if (web3auth.current) {
      const web3authProvider = await web3auth.current.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);
      await fetchUsdcBalance();
    }
  };

  const logout = async () => {
    if (web3auth.current) {
      await web3auth.current.logout();
      setProvider(null);
      setLoggedIn(false);
    }
  };

  const openWalletServices = async () => {
    if (walletServicesPlugin && pluginConnected) {
      try {
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
      <p>Your USDC Balance: {usdcBalance ? usdcBalance : "Loading..."}</p>
      <button onClick={() => sendWithPlatformFee(10)} className="card">
        Send 10 USDC with Platform Fee
      </button>
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
        PennyFundMe & NextJS Quick Start
      </h1>
      {!isInitialized ? (
        <p>Loading Web3Auth...</p>
      ) : (
        <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
      )}
    </div>
  );
}

export default App;

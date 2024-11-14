"use client";

import { CHAIN_NAMESPACES, IAdapter, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { AccountAbstractionProvider, SafeSmartAccount } from "@web3auth/account-abstraction-provider";
import { ethers } from "ethers";
import { formatUnits, parseUnits } from "ethers";
import { useEffect, useState, useRef } from "react";

const clientId = "BN6F8-BoCoUwSBlKODDCA8yWvkpZfiflGunSxVAz4yCQ1Zxrd2u0TEjQQkjG_Vx6qtAE7G4K01moqw1XGRX1u8s";
const pimlicoAPIKey = "pim_NQiLku6tPP9FW3Tn7B78JH";
const platformFeeContractAddress = "YOUR_PLATFORM_FEE_CONTRACT_ADDRESS"; // Replace with your deployed contract address
const usdcContractAddress = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"; // Replace with the correct USDC contract address

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882",
  rpcTarget: "https://rpc.ankr.com/polygon_amoy",
  displayName: "Polygon Amoy Testnet",
  ticker: "MATIC",
  tickerName: "Matic",
};

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
  const [usdcBalance, setUsdcBalance] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>(""); // New state for wallet address
  const [loggedIn, setLoggedIn] = useState(false);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  const web3auth = useRef<Web3Auth | null>(null);
  const [pluginConnected, setPluginConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);

  const platformFee = amount * 0.05;
  const totalAmount = amount + platformFee;

  const fetchWalletAddress = async () => {
    if (provider) {
      const signer = new ethers.BrowserProvider(provider).getSigner();
      const address = await (await signer).getAddress();
      setWalletAddress(address);
    }
  };


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
              logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
              logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
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
          await fetchWalletAddress();
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
      fetchWalletAddress();
    }
  }, [loggedIn]);


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
        parseUnits(amount.toString(), 6),
        parseUnits(platformFee.toString(), 6)
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
      await fetchWalletAddress();
      await fetchUsdcBalance();
    }
  };

  const logout = async () => {
    if (web3auth.current) {
      await web3auth.current.logout();
      setProvider(null);
      setLoggedIn(false);
      setWalletAddress("");
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
      <h2>Welcome to PennyFundMe!</h2>

      <div style={{ display: "flex", alignItems: "center" }}>
        <p>Your Wallet Address: {walletAddress}</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(walletAddress);
            alert("Wallet address copied!");
          }}
          style={{ marginLeft: "8px", cursor: "pointer" }}
        >
          Copy
        </button>
      </div>

      <p>Your USDC Balance: {usdcBalance ? usdcBalance : "Loading..."}</p>

      <label>
        Recipient Address:
        <input
          type="text"
          placeholder="Enter recipient address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
        />
      </label>

      <label>
        Amount (USDC):
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
      </label>

      <p>Platform Fee (5%): {platformFee.toFixed(2)} USDC</p>
      <p>Total Amount: {totalAmount.toFixed(2)} USDC</p>

      <button
        onClick={sendWithPlatformFee}
        disabled={!amount || totalAmount > parseFloat(usdcBalance)}
        className="card"
      >
        Send USDC with Platform Fee
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

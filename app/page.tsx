"use client";

import { CHAIN_NAMESPACES, IAdapter, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Box, Paper, Typography, Button, TextField } from "@mui/material";
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
      fetchWalletAddress();
      fetchUsdcBalance();

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

  // Updated loggedInView
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
      <Typography variant="h5" gutterBottom>
        Wallet Overview
      </Typography>

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

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="textSecondary">
          USDC Balance:
        </Typography>
        <Typography variant="h6" color="primary" sx={{ fontWeight: "bold", mt: 1 }}>
          {usdcBalance ? usdcBalance : "Loading..."}
        </Typography>
      </Box>

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
        <Typography variant="caption" color="textSecondary">
          Platform Fee (5%): {platformFee.toFixed(2)} USDC
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Total Amount: {totalAmount.toFixed(2)} USDC
        </Typography>
        <Button
          onClick={sendWithPlatformFee}
          disabled={!amount || totalAmount > parseFloat(usdcBalance)}
          variant="contained"
          color="secondary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Donate USDC with Platform Fee
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={logout} variant="contained" color="error">
          Logout
        </Button>
        <Button onClick={openWalletServices} variant="contained" color="primary">
          Wallet Services
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

import type { AppProps } from "next/app";
import {
  ThirdwebProvider,
  coinbaseWallet,
  embeddedWallet,
  metamaskWallet,
  smartWallet,
  walletConnect,
} from "@thirdweb-dev/react";
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const BaseSepoliaTestnet = {
  chain: "ETH",
  chainId: 84532,
  explorers: [
    {
      name: "basescout",
      url: "https://base-sepolia.blockscout.com",
      standard: "EIP3091",
      icon: {
        url: "ipfs://QmYtUimyqHkkFxYdbXXRbUqNg2VLPUg6Uu2C2nmFWowiZM",
        width: 551,
        height: 540,
        format: "png",
      },
    },
  ],
  faucets: [],
  icon: {
    url: "ipfs://QmaxRoHpxZd8PqccAynherrMznMufG6sdmHZLihkECXmZv",
    width: 1200,
    height: 1200,
    format: "png",
  },
  infoURL: "https://base.org",
  name: "Base Sepolia Testnet",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  networkId: 84532,
  rpc: [
    "https://84532.rpc.thirdweb.com/${THIRDWEB_API_KEY}",
    "https://sepolia.base.org",
    "https://base-sepolia-rpc.publicnode.com",
    "wss://base-sepolia-rpc.publicnode.com",
  ],
  shortName: "basesep",
  slip44: 1,
  slug: "base-sepolia-testnet",
  testnet: true,
};

export const PolygonAmoyTestnet = {
  chain: "Polygon",
  chainId: 80002,
  explorers: [
    {
      name: "polygonamoy",
      url: "https://www.oklink.com/amoy",
      standard: "EIP3091",
    },
  ],
  faucets: ["https://faucet.polygon.technology/"],
  features: [],
  icon: {
    url: "ipfs://QmcxZHpyJa8T4i63xqjPYrZ6tKrt55tZJpbXcjSDKuKaf9/polygon/512.png",
    width: 512,
    height: 512,
    format: "png",
  },
  infoURL: "https://polygon.technology/",
  name: "Polygon Amoy Testnet",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  networkId: 80002,
  redFlags: [],
  rpc: [
    "https://80002.rpc.thirdweb.com/${THIRDWEB_API_KEY}",
    "https://rpc-amoy.polygon.technology",
    "https://polygon-amoy-bor-rpc.publicnode.com",
    "wss://polygon-amoy-bor-rpc.publicnode.com",
  ],
  shortName: "polygonamoy",
  slip44: 1,
  slug: "polygon-amoy-testnet",
  testnet: true,
  title: "Polygon Amoy Testnet",
};

// This is the chain your dApp will work on.
// Change this to the chain your app is built for.
// You can also import additional chains from `@thirdweb-dev/chains` and pass them directly.
// const activeChain = PolygonAmoyTestnet;
const activeChain = BaseSepoliaTestnet;

const smartWalletConfig = smartWallet(
  embeddedWallet({
    auth: {
      options: ["email", "google", "apple"],
    },
  }),
  {
    factoryAddress: process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS!,
    gasless: true,
  }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider
      activeChain={activeChain}
      clientId={process.env.NEXT_PUBLIC_THRIDWEB_CLIENT_ID}
      supportedWallets={[smartWalletConfig]}
    >
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </ThirdwebProvider>
  );
}

export default MyApp;

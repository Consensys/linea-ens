import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-storage-layout";

const hardhatPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    goerli: {
      url: process.env.L1_PROVIDER_URL,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    goerliLinea: {
      url: process.env.L2_PROVIDER_URL,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    localhost: {
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY, hardhatPrivateKey] : [],
    },
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY ?? "",
      goerliLinea: process.env.LINEASCAN_API_KEY ?? "",
    },
    customChains: [
      {
        network: "goerliLinea",
        chainId: 59140,
        urls: {
          apiURL: "https://api-goerli.lineascan.build/api",
          browserURL: "https://goerli.lineascan.build/",
        },
      },
    ],
  },
};

export default config;

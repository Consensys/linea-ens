import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";

const hardhatPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    goerliLinea: {
      url: process.env.GOERLI_LINEA_URL,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    localhost: {
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY, hardhatPrivateKey] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "goerliLinea",
        chainId: 59140,
        urls: {
          apiURL: "https://explorer.goerli.linea.build/api",
          browserURL: "https://explorer.goerli.linea.build/",
        },
      },
    ],
  },
};

export default config;

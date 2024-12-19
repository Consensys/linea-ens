# linea-ccip-gateway

Adapted from [EVM gateway](https://github.com/ensdomains/evmgateway) for fetching data on Linea along with Sparse Merkle
Proofs and return it to the L1 callback function.

## Start dev env

```shell
cp .env.example .env
pnpm i
pnpm build
pnpm start
```

## Build

```shell
pnpm build
```

### Tests

```shell
pnpm i
pnpm compile
pnpm test
```

## Example of how to use CCIP-Read using EtherJs

This example demonstrates how to use CCIP-Read using EtherJs to call a contract that implements the protocol.

### Interacting with the `TestL1` Contract Using CCIP-Read

To interact with the `TestL1` contract using the CCIP-Read protocol, follow these steps:

#### Prerequisites

Before running the script, ensure that you have the necessary environment variables set up in your `.env` file:

- **`INFURA_API_KEY`**: Your Infura project ID, which allows you to connect to the Ethereum network via Infura.

#### Adding the Script

Create a new script file in your project directory at `scripts/testL1.ts` and add the following code:

```js
import { ethers } from 'ethers';
import 'dotenv/config';

// Define the ABI for the getLatest function
const getLatestABI = [
  {
    inputs: [],
    name: 'getLatest',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

async function main() {
  /* 
  Address of the deployed TestL1 contract on the Sepolia testnet.
  You can view the contract on Etherscan using the following link:
  https://sepolia.etherscan.io/address/0xb12038acce44e39dd5b2f59f0f68bbfaac35dd16
  */

  const testL1Address = '0xB12038acCE44e39dd5B2f59F0f68bbfAaC35dd16';

  const provider = new ethers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
  );

  const testL1Contract = new ethers.Contract(
    testL1Address,
    getLatestABI,
    provider
  );

  try {
    // Call the getLatest function with CCIP read enabled
    const result = await testL1Contract.getLatest({ enableCcipRead: true });
    console.log({ result });
  } catch (error) {
    console.error({ error });
  }
}

main().catch((error) => {
  console.error('Error in main execution:', error);
  process.exitCode = 1;
});
```

This script connects to the Sepolia testnet and calls the `getLatest` function of the `TestL1` contract, demonstrating
how to enable and use the CCIP-Read functionality.

#### Running the Script

To execute the script, follow these steps:

1. **Open a terminal** and navigate to the root directory of your project.

2. **Run the script using Hardhat** with the following command:

```shell
npx hardhat run scripts/testL1.ts --network sepolia
```

- This command will launch the `testL1.ts` script, which interacts with the `TestL1` contract deployed on the Sepolia
  network.
- The script demonstrates the usage of Chainlink's CCIP-Read protocol to fetch and verify off-chain data using a Sparse
  Merkle Proof.

#### What the Script Does

- **Connects to the Sepolia Network**: Utilizes Infura as the provider to connect to the Ethereum Sepolia testnet.
- **Interacts with the Contract**: Calls the `getLatest` function on the `TestL1` contract, showcasing how to enable and
  leverage CCIP-Read capabilities.
- **Handles Off-Chain Data**: Demonstrates the retrieval and verification of off-chain data, integrating it back into
  the on-chain environment using CCIP.

This example provides a practical demonstration of how to set up and utilize the CCIP-Read protocol within a dApp,
highlighting the benefits of off-chain data fetching and proof verification.

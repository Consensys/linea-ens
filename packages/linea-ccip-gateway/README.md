# linea-ccip-gateway

Adapted from [EVM gateway](https://github.com/ensdomains/evmgateway) for fetching data on Linea along with Sparse Merkle Proofs and return it to the L1 callback function.

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

## Example of CCIP-Read Call

This example demonstrates how to use CCIP-Read to call a contract that implements the protocol.

### Prerequisites

- Node.js and npm installed
- Hardhat installed (`npm install --save-dev hardhat`)
- Ethers.js installed (`npm install ethers`)
- Chainlink's CCIP-Read server installed (`npm install @chainlink/ccip-read-server`)
- Supertest installed (`npm install supertest`)

### Setup

1. **Add the following Solidity contract to your `contracts` directory:**

   `contracts/TestContract.sol`

   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.4;

   contract TestContract {
       uint256 public latest;

       function getLatest() public view returns (uint256) {
           return latest;
       }

       function setLatest(uint256 _latest) public {
           latest = _latest;
       }
   }
   ```

2. **Create a deploy script to deploy the `TestContract`:**

   `scripts/deploy.js`

   ```javascript
   async function main() {
     const [deployer] = await ethers.getSigners();
     console.log("Deploying contracts with the account:", deployer.address);

     const TestContract = await ethers.getContractFactory("TestContract");
     const testContract = await TestContract.deploy();
     await testContract.deployed();

     console.log("TestContract deployed to:", testContract.address);
   }

   main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error);
       process.exit(1);
     });
   ```

3. **Deploy the contract:**

   ```sh
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. **Add the following test script to interact with the contract using CCIP-Read:**

   `test/test.js`

   ```javascript
   const { expect } = require("chai");
   const { ethers } = require("hardhat");
   const { Server } = require("@chainlink/ccip-read-server");
   const request = require("supertest");

   describe("CCIP-Read Example", function () {
     let testContract;
     let server;

     before(async function () {
       const [deployer] = await ethers.getSigners();

       const TestContract = await ethers.getContractFactory("TestContract");
       testContract = await TestContract.deploy();
       await testContract.deployed();

       const app = new Server().makeApp("/");
       server = request(app);
     });

     it("should return correct value using CCIP-Read", async function () {
       await testContract.setLatest(42);

       const result = await testContract.getLatest({ enableCcipRead: true });
       expect(Number(result)).to.equal(42);
     });
   });
   ```

5. **Run the tests:**

   ```sh
   npx hardhat test
   ```

## Conclusion

This example demonstrates how to set up and use CCIP-Read to interact with a smart contract. The dApp retrieves data from the contract using Chainlink's CCIP-Read server for off-chain data fetching and proof verification.

For more information, refer to the [Chainlink CCIP documentation](https://docs.chain.link/ccip).

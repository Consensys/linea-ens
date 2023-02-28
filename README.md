# How to test in local

All the contracts are deployed on the same goerli L1 hardhat fork

1. `yarn install`
2. `yarn hardhat node --fork YOUR_GOERLI_L1_RPC_URL`
3. `yarn hardhat compile`
4. `yarn hardhat run scripts/deployL2.ts --network localhost`
5. Take note of the resolver address created
6. `RESOLVER_ADDRESS=$RESOLVER_ADDRESS yarn hardhat run scripts/deployL1.ts --network localhost`
7. Take note of the resolver and the helper addresses
8. `cd gateway`
9. `yarn build`
10. `yarn start --l2_resolver_address $RESOLVER_ADDRESS --helper_address $HELPER_ADDRESS`

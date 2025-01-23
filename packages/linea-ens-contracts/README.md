# linea-ens-contracts

ENS contracts deployed on Linea to support "linea.eth" subdomain registration on Linea.  
Its implementation has started with a fork from official ENS's repo https://github.com/ensdomains/ens-contracts

A few specificities:

- Supports 3 levels domain registration
- A POH linked to the account registering is needed to be able to register
- Registration is free using POH
- One registration by account using POH is allowed
- Is supported on L1 resolution thanks to CCIP

## Contracts

## Registry

The ENS registry is the core contract that lies at the heart of ENS resolution. All ENS lookups start by querying the registry. The registry maintains a list of domains, recording the owner, resolver, and TTL for each, and allows the owner of a domain to make changes to that data. It also includes some generic registrars.

### ENS.sol

Interface of the ENS Registry.

### ENSRegistry

Implementation of the ENS Registry, the central contract used to look up resolvers and owners for domains.

### ENSRegistryWithFallback

The new implementation of the ENS Registry after the 2020 ENS Registry Migration.

### FIFSRegistrar

Implementation of a simple first-in-first-served registrar, which issues (sub-)domains to the first account to request them.

### ReverseRegistrar

Implementation of the reverse registrar responsible for managing reverse resolution via the .addr.reverse special-purpose TLD.

### TestRegistrar

Implementation of the `.test` registrar facilitates easy testing of ENS on the Ethereum test networks. Currently deployed on Ropsten network, it provides functionality to instantly claim a domain for test purposes, which expires 28 days after it was claimed.

### BaseRegistrar

BaseRegistrar is the contract that owns the TLD in the ENS registry. This contract implements a minimal set of functionality:

- The owner of the registrar may add and remove controllers.
- Controllers may register new domains and extend the expiry of (renew) existing domains. They can not change the ownership or reduce the expiration time of existing domains.
- Name owners may transfer ownership to another address.
- Name owners may reclaim ownership in the ENS registry if they have lost it.
- Owners of names in the interim registrar may transfer them to the new registrar, during the 1 year transition period. When they do so, their deposit is returned to them in its entirety.

This separation of concerns provides name owners strong guarantees over continued ownership of their existing names, while still permitting innovation and change in the way names are registered and renewed via the controller mechanism.

### EthRegistrarController

EthRegistrarController is taken from the official ENS's [registration controller](https://github.com/ensdomains/ens-contracts/blob/staging/contracts/ethregistrar/ETHRegistrarController.sol) with some changes:

- The owner of the registrar can register a domain for any address that has not been registered yet for free.
- Users can register a new name using a commit/reveal process and if they have completed of Proof of humanity process.
- Users can renew a name 6 month before the expiration date.

It has the same the commit/reveal process is used to avoid frontrunning, and operates as follows:

1.  A user commits to a hash, the preimage of which contains the name to be registered and a secret value.
2.  After a minimum delay period and before the commitment expires, the user calls the register function with the name to register and the secret value from the commitment. If a valid commitment is found and the other preconditions are met, the name is registered.

The minimum delay and expiry for commitments exist to prevent miners or other users from effectively frontrunning registrations.

### PohRegistrationManger

PohRegistrationManger is the contract responsible to keep track of the users that used their POH to register a domain (One registration by address).

- The owner of the PohRegistrationManger can set addresses as managers.
- The managers of PohRegistrationManager can mark an address as having used its POH, EthRegistrarController is intended to be a manager.

### PohVerifier

PohVerifier is the contract responsible for checking the signature of the private key responsible for acknowledging an address has passed the POH process or not.

- The owner of PohVerifier can set the signer address responsible for acknowledging a POH

### FixedPriceOracle

FixedPriceOracle is a price oracle implementation that always return the same price.
It is used to make the original register function very expensive making it almost impossible to use and to force users to use the registration with POH.

## Resolvers

Resolver implements a general-purpose ENS resolver that is suitable for most standard ENS use cases. The public resolver permits updates to ENS records by the owner of the corresponding name.

PublicResolver includes the following profiles that implements different EIPs.

- ABIResolver = EIP 205 - ABI support (`ABI()`).
- AddrResolver = EIP 137 - Contract address interface. EIP 2304 - Multicoin support (`addr()`).
- ContentHashResolver = EIP 1577 - Content hash support (`contenthash()`).
- InterfaceResolver = EIP 165 - Interface Detection (`supportsInterface()`).
- NameResolver = EIP 181 - Reverse resolution (`name()`).
- PubkeyResolver = EIP 619 - SECP256k1 public keys (`pubkey()`).
- TextResolver = EIP 634 - Text records (`text()`).
- DNSResolver = Experimental support is available for hosting DNS domains on the Ethereum blockchain via ENS. [The more detail](https://veox-ens.readthedocs.io/en/latest/dns.html) is on the old ENS doc.

## Developer guide

### How to setup

```
cd ./packages/linea-ens-contracts
yarn
```

### How to run tests

```
yarn test
```

### How to deploy

Example :

```
npx hardhat --network lineaSepolia deploy
```

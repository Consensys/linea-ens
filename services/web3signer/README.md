# Web3Signer

Web3Signer is an open-source remote signing service.

## Development

### Configure the privateKey

Set the private key:

```bash
cp ./services/web3signer/keyFiles/examples/signer.yaml ./services/web3signer/keyFiles/signer.yaml
nano ./services/web3signer/keyFiles/signer.yaml
```

Inside the `signer.yaml` file, replace the value of `JustChangeMe` with a valid private key.

### Start

```bash
make dev-docker &
```

### Test

Go to:

http://localhost:9000/upcheck

http://localhost:9000/api/v1/eth1/publicKeys

## API Documentation

https://consensys.github.io/web3signer/web3signer-eth1.html

import { ethers } from 'ethers'

// Check if a domain name is provided via command line arguments
const args = process.argv.slice(2)
if (args.length === 0) {
  console.log(
    'Please provide a domain name. Usage: ts-node calculateNamehash.ts <domainName>',
  )
  process.exit(1)
}

const domainName = args[0]

// Calculate the namehash of the provided domain name
const domainNamehash = ethers.utils.namehash(domainName)

// Log the namehash
console.log(`The namehash of '${domainName}' is: ${domainNamehash}`)

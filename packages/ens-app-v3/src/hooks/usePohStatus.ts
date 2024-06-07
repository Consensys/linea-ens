import { useMemo, useState } from 'react'
import { Address, Hex } from 'viem'
import { useAccount } from 'wagmi'

export const usePohSignature = (address: Address | undefined): Hex | undefined => {
  const { chain } = useAccount()
  const [signature, setSignature] = useState<string | undefined>(undefined)
  useMemo(async () => {
    const pohSignatureApi = chain ? chain.custom.pohVerifierUrl : undefined
    if (!pohSignatureApi) return undefined
    const resp = await fetch(`${pohSignatureApi}/poh/${address}`, {
      method: 'GET',
      redirect: 'follow',
    })
    const respResult = resp.ok ? await resp.text() : undefined
    setSignature(respResult)
  }, [address, chain])

  return signature ? (signature as `0x${string}`) : undefined
}

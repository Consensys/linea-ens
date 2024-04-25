import { useMemo, useState } from 'react'
import { Address, Hex } from 'viem'

export const usePohSignature = (address: Address | undefined): Hex | undefined => {
  const [signature, setSignature] = useState<string | undefined>(undefined)
  useMemo(async () => {
    const pohSignatureApi = process.env.NEXT_PUBLIC_POH_SIGNATURE_API
    if (!pohSignatureApi) return undefined
    const resp = await fetch(`${pohSignatureApi}/poh/${address}`, {
      method: 'GET',
      redirect: 'follow',
    })
    const respResult = resp.ok ? await resp.text() : undefined
    setSignature(respResult)
  }, [address])

  return signature ? (signature as `0x${string}`) : undefined
}

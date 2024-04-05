import { useDnsSecEnabled } from './dns/useDnsSecEnabled'

export const useSupportsTLD = (name = '') => {
  const labels = name?.split('.') || []
  const tld = labels[labels.length - 1]
  const sld = labels.length > 1 ? labels[labels.length - 2] : undefined

  const { data: isDnsSecEnabled, ...query } = useDnsSecEnabled({ name: tld })
  return {
    data: (tld === 'eth' && sld === 'linea') || tld === '[root]' || isDnsSecEnabled,
    ...query,
  }
}

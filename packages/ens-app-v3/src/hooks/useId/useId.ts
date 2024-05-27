import * as React from 'react'

import { useIsoMorphicEffect } from './useIsoMorphicEffect'
import { useServerHandoffComplete } from './useServerHandoffComplete'

const idPrefix = 'thorin'

let currentId = 0
function generateId() {
  currentId += 1
  return currentId
}

export const useId = () => {
  const ready = useServerHandoffComplete()
  const [id, setId] = React.useState(ready ? generateId : null)

  useIsoMorphicEffect(() => {
    if (id === null) setId(generateId())
  }, [id])

  return id != null ? `${idPrefix}${id}` : undefined
}

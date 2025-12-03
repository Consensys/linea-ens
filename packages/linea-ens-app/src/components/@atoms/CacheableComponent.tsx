import styled, { css, keyframes } from 'styled-components'

const anim = keyframes`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0.5;
  }
`

export interface CacheableComponentProps {
  $isCached?: boolean
}

export const cacheableComponentStyles = css<CacheableComponentProps>`
  transition: opacity 0.15s ease-in-out;
  opacity: 1;
  ${({ $isCached }) =>
    $isCached &&
    css`
      opacity: 0.5;
      pointer-events: none;
      animation: ${anim} 0.25s ease-in-out 1s backwards;
    `}
`

export const CacheableComponent = styled.div<CacheableComponentProps>`
  ${cacheableComponentStyles}
`

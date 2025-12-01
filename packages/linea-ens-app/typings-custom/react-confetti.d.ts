declare module 'react-confetti' {
  import { CSSProperties, RefObject } from 'react'

  export interface IConfettiOptions {
    /**
     * Width of the canvas element
     */
    width?: number
    /**
     * Height of the canvas element
     */
    height?: number
    /**
     * Number of confetti pieces to render
     * @default 200
     */
    numberOfPieces?: number
    /**
     * Slows movement of pieces (lower number is faster)
     * @default 5000
     */
    friction?: number
    /**
     * Force of "wind" on pieces
     * @default 0
     */
    wind?: number
    /**
     * Force of gravity on pieces
     * @default 0.1
     */
    gravity?: number
    /**
     * Initial velocity in the X axis
     * @default 4
     */
    initialVelocityX?: { min: number; max: number } | number
    /**
     * Initial velocity in the Y axis
     * @default 10
     */
    initialVelocityY?: { min: number; max: number } | number
    /**
     * Shape of confetti.
     * @default 'All'
     */
    pieceShape?: 'Circle' | 'Square' | 'Strip' | 'All'
    /**
     * Width of confetti pieces
     * @default { min: 5, max: 20 }
     */
    pieceWidth?: {
      min: number
      max: number
    } | number
    /**
     * Height of confetti pieces
     * @default { min: 5, max: 20 }
     */
    pieceHeight?: {
      min: number
      max: number
    } | number
    /**
     * Array of colors to choose from.
     */
    colors?: string[]
    /**
     * Opacity of the confetti pieces
     * @default 1.0
     */
    opacity?: number
    /**
     * Whether to recycle confetti pieces (animation will repeat)
     * @default true
     */
    recycle?: boolean
    /**
     * Run the animation
     * @default true
     */
    run?: boolean
    /**
     * Show debugging information for tweaking config
     * @default false
     */
    debug?: boolean
    /**
     * Canvas style properties
     */
    style?: CSSProperties
    /**
     * Canvas className
     */
    className?: string
    /**
     * Manually set a reference to the canvas element
     */
    canvasRef?: RefObject<HTMLCanvasElement> | ((instance: HTMLCanvasElement | null) => void) | null
    /**
     * Callback when animation is complete (when recycle is false)
     */
    onConfettiComplete?: (confetti?: any) => void
    /**
     * Additional canvas properties
     */
    drawShape?: (context: CanvasRenderingContext2D) => void
    /**
     * Tweens for controlling the animation
     */
    tweenDuration?: number
    tweenFunction?: (currentTime: number, startValue: number, changeInValue: number, duration: number) => number
  }

  export default function Confetti(props: IConfettiOptions): JSX.Element
}


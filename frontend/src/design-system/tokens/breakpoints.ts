/**
 * Design System Breakpoint Tokens
 * Based on requirements 2.1, 2.4 for responsive design across devices
 */

export interface Breakpoints {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

export const breakpoints: Breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

export interface MediaQueries {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  mobile: string
  tablet: string
  desktop: string
}

export const mediaQueries: MediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  mobile: `@media (max-width: ${breakpoints.md})`,
  tablet: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  desktop: `@media (min-width: ${breakpoints.lg})`
}

export interface ContainerSizes {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

export const containerSizes: ContainerSizes = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
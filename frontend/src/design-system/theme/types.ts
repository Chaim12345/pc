/**
 * Theme System Types
 * TypeScript interfaces for theme configuration and CSS custom properties
 */

import type { Breakpoints } from '../tokens/breakpoints'
import type { ColorTokens } from '../tokens/colors'
import type { BorderRadius, Shadow, SpacingScale } from '../tokens/spacing'
import type { FontFamily, FontWeight, TypographyScale } from '../tokens/typography'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  mode: ThemeMode
  primaryColor?: string
  fontFamily?: string
  fontSize?: 'small' | 'medium' | 'large'
  reducedMotion?: boolean
  highContrast?: boolean
}

export interface Theme {
  colors: ColorTokens
  typography: {
    fontSizes: TypographyScale
    fontWeights: FontWeight
    fontFamilies: FontFamily
  }
  spacing: SpacingScale
  borderRadius: BorderRadius
  shadows: Shadow
  breakpoints: Breakpoints
}

export interface ThemeContextType {
  theme: Theme
  mode: ThemeMode
  config: ThemeConfig
  setMode: (mode: ThemeMode) => void
  updateConfig: (config: Partial<ThemeConfig>) => void
  toggleTheme: () => void
}

export interface CSSCustomProperties {
  [key: string]: string
}
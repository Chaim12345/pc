/**
 * Design System Typography Tokens
 * Based on requirements 3.2, 3.4 for consistent typography hierarchy
 */

export interface FontSize {
  fontSize: string
  lineHeight: string
  letterSpacing?: string
}

export interface TypographyScale {
  xs: FontSize
  sm: FontSize
  base: FontSize
  lg: FontSize
  xl: FontSize
  '2xl': FontSize
  '3xl': FontSize
  '4xl': FontSize
  '5xl': FontSize
  '6xl': FontSize
}

export interface FontWeight {
  light: number
  normal: number
  medium: number
  semibold: number
  bold: number
}

export interface FontFamily {
  sans: string[]
  serif: string[]
  mono: string[]
}

export const fontSizes: TypographyScale = {
  xs: {
    fontSize: '0.75rem',
    lineHeight: '1rem'
  },
  sm: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem'
  },
  base: {
    fontSize: '1rem',
    lineHeight: '1.5rem'
  },
  lg: {
    fontSize: '1.125rem',
    lineHeight: '1.75rem'
  },
  xl: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem'
  },
  '2xl': {
    fontSize: '1.5rem',
    lineHeight: '2rem'
  },
  '3xl': {
    fontSize: '1.875rem',
    lineHeight: '2.25rem'
  },
  '4xl': {
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
    letterSpacing: '-0.025em'
  },
  '5xl': {
    fontSize: '3rem',
    lineHeight: '1',
    letterSpacing: '-0.025em'
  },
  '6xl': {
    fontSize: '3.75rem',
    lineHeight: '1',
    letterSpacing: '-0.025em'
  }
}

export const fontWeights: FontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
}

export const fontFamilies: FontFamily = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ],
  serif: [
    'Georgia',
    'Cambria',
    'Times New Roman',
    'Times',
    'serif'
  ],
  mono: [
    'JetBrains Mono',
    'Fira Code',
    'Consolas',
    'Monaco',
    'Courier New',
    'monospace'
  ]
}
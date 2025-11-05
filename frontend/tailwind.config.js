export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Monday.com Vibe Design System colors
        monday: {
          primary: '#0073ea',
          primaryHover: '#0060c0',
          primarySelected: '#0050a0',
          primaryLight: '#cce5ff',
          primaryUltraLight: '#e6f4ff',
          secondary: '#00ca72',
          green: '#00ca72',
          greenHover: '#00a85d',
          greenLight: '#ccf4e3',
          purple: '#7e3af2',
          blue: '#579bfc',
          blueHover: '#4387e8',
          blueLight: '#e1ecff',
          orange: '#fdab3d',
          yellow: '#ffcb00',
          red: '#e2445c',
          redHover: '#d83a52',
          redLight: '#ffe5e9',
          dark: '#181b34',
          darkLight: '#1f2244',
          darkTertiary: '#252847',
          text: '#323338',
          textLight: '#676879',
          placeholder: '#9699a6',
          disabled: '#c3c6d4',
          border: '#e6e9ef',
          borderMedium: '#d0d4e4',
          borderStrong: '#b3b7c4',
          background: '#f6f7fb',
          backgroundHover: '#f5f6f8',
          backgroundSelected: '#e9ecf5',
        },
        primary: {
          50: '#FFE5E9',
          100: '#FFCCD3',
          200: '#FF99A7',
          300: '#FF667B',
          400: '#FF3D57', // Main Monday red
          500: '#E62E49',
          600: '#CC283F',
          700: '#B32236',
          800: '#991C2C',
          900: '#801622',
        },
      },
      fontFamily: {
        sans: ['Figtree', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      borderRadius: {
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'monday': '0 4px 10px rgba(0, 0, 0, 0.06)',
        'monday-hover': '0 8px 20px rgba(0, 0, 0, 0.12)',
        'monday-card': '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in-from-top': 'slideInFromTop 0.2s ease-out',
        'slide-in-from-bottom': 'slideInFromBottom 0.3s ease-out',
        'zoom-in': 'zoomIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        slideInFromTop: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        slideInFromBottom: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        zoomIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.95)'
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
        },
      },
    },
  },
  plugins: [],
}

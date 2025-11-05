export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Monday.com inspired color palette
        monday: {
          primary: '#FF3D57', // Monday red/coral
          primaryHover: '#E62E49',
          primaryLight: '#FFE5E9',
          secondary: '#00CA72', // Success green
          green: '#00CA72',
          purple: '#7E3AF2',
          blue: '#579BFC',
          orange: '#FDAB3D',
          yellow: '#FFCB00',
          dark: '#1F2128', // Dark mode background
          darkLight: '#292A31',
          text: '#323338',
          textLight: '#676879',
          border: '#D0D4E4',
          background: '#F6F7FB',
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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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

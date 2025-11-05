import React from 'react'

interface VibeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger' | 'warning'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

export default function VibeButton({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: VibeButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200 rounded-lg outline-none
    focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `

  const variantClasses = {
    primary: 'bg-[#0073ea] hover:bg-[#0060c0] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus-visible:ring-[#0073ea]',
    secondary: 'bg-transparent border border-[#d0d4e4] hover:border-[#b3b7c4] text-[#323338] hover:bg-[#f5f6f8] focus-visible:ring-[#0073ea]',
    tertiary: 'bg-transparent text-[#323338] hover:bg-[#f5f6f8] focus-visible:ring-[#0073ea]',
    success: 'bg-[#00ca72] hover:bg-[#00a85d] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus-visible:ring-[#00ca72]',
    danger: 'bg-[#e2445c] hover:bg-[#d83a52] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus-visible:ring-[#e2445c]',
    warning: 'bg-[#ff9900] hover:bg-[#e68a00] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus-visible:ring-[#ff9900]',
  }

  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs gap-1.5',
    medium: 'px-4 py-2 text-sm gap-2',
    large: 'px-6 py-3 text-base gap-2.5',
  }

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  )
}
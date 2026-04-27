import { forwardRef } from 'react'

const ButtonComponent = forwardRef(({
  className = '',
  variant = 'default',
  size = 'default',
  type = 'button',
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      className={`ui-button ui-button-${variant} ui-button-${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
})

ButtonComponent.displayName = 'Button'

export const Button = ButtonComponent

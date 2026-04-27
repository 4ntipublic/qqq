import { forwardRef } from 'react'

export const Input = forwardRef(({
  type = 'text',
  placeholder,
  className = '',
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      className={`ui-input ${className}`.trim()}
      {...props}
    />
  )
})

Input.displayName = 'Input'

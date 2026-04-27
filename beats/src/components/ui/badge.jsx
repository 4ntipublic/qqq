export function Badge({ className = '', variant = 'default', children, ...props }) {
  return (
    <span className={`ui-badge ui-badge-${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  )
}

export function HoverCard({ className = '', children }) {
  return <div className={`ui-hover-card ${className}`.trim()}>{children}</div>
}

export function HoverCardTrigger({ className = '', children, ...props }) {
  return (
    <span className={`ui-hover-card-trigger ${className}`.trim()} tabIndex={0} {...props}>
      {children}
    </span>
  )
}

export function HoverCardContent({ className = '', children, ...props }) {
  return (
    <div className={`ui-hover-card-content ${className}`.trim()} role="tooltip" {...props}>
      {children}
    </div>
  )
}

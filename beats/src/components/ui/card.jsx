export function Card({ className = '', children, ...props }) {
  return (
    <article className={`ui-card ${className}`.trim()} {...props}>
      {children}
    </article>
  )
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`ui-card-content ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

import { createContext, useContext, useMemo, useState } from 'react'

const TabsContext = createContext(null)

export function Tabs({ defaultValue, className = '', children }) {
  const [value, setValue] = useState(defaultValue)
  const ctx = useMemo(() => ({ value, setValue }), [value])

  return (
    <TabsContext.Provider value={ctx}>
      <section className={`ui-tabs ${className}`.trim()}>{children}</section>
    </TabsContext.Provider>
  )
}

export function TabsList({ className = '', children }) {
  return <div className={`ui-tabs-list ${className}`.trim()}>{children}</div>
}

export function TabsTrigger({ value, className = '', children }) {
  const ctx = useContext(TabsContext)
  const isActive = ctx?.value === value

  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={`ui-tabs-trigger ${isActive ? 'is-active' : ''} ${className}`.trim()}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className = '', children }) {
  const ctx = useContext(TabsContext)
  if (ctx?.value !== value) {
    return null
  }

  return <div className={`ui-tabs-content ${className}`.trim()}>{children}</div>
}

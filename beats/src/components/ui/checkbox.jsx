import { forwardRef } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'

export const Checkbox = forwardRef(({ className = '', ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={`ui-checkbox ${className}`.trim()}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="checkbox-indicator">
        <CheckIcon width={16} height={16} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})

Checkbox.displayName = 'Checkbox'

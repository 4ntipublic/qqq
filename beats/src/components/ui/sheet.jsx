import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { cn } from "../../lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    }}
    className={`sheet-overlay ${className || ''}`}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = {
  side: "right",
  variants: {
    side: {
      top: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        maxHeight: '50vh',
      },
      bottom: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        maxHeight: '50vh',
      },
      left: {
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        width: '75%',
        maxWidth: '424px',
      },
      right: {
        position: 'fixed',
        top: 0,
        bottom: 0,
        right: 0,
        zIndex: 50,
        width: '75%',
        maxWidth: '424px',
      },
    },
  },
  defaultVariants: {
    side: "right",
  },
}

const SheetContent = React.forwardRef(
  ({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        style={{
          ...sheetVariants.variants.side[side],
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease-in-out',
        }}
        className={`sheet-content ${className || ''}`}
        {...props}
      >
        {children}
        <SheetPrimitive.Close 
          style={{
            position: 'absolute',
            right: '16px',
            top: '16px',
            padding: '4px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          <Cross2Icon style={{ width: '16px', height: '16px' }} />
          <span style={{ display: 'none' }}>Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
)
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      textAlign: 'left',
      marginBottom: '-8px',
    }}
    className={className}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: '8px',
    }}
    className={className}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    style={{
      fontSize: '18px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '0',
      lineHeight: '1.2',
    }}
    className={className}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    style={{
      fontSize: '14px',
      color: '#666',
      margin: '0',
      lineHeight: '1.2',
    }}
    className={className}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

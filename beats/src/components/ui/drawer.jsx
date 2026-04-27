import * as React from "react"
import * as DrawerPrimitive from "vaul"

import { cn } from "../../lib/utils"

const Drawer = React.forwardRef(({ children, ...props }, ref) => (
  <DrawerPrimitive.Root {...props} ref={ref}>
    {children}
  </DrawerPrimitive.Root>
))
Drawer.displayName = "Drawer"

const DrawerPortal = DrawerPrimitive.Portal

const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 w-full rounded-t-[10px] border border-neutral-200 bg-white",
        className
      )}
      style={{ 
        maxHeight: '85vh',
        backgroundColor: '#ffffff',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none'
      }}
      {...props}
    >
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({ className, ...props }) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({ className, ...props }) => (
  <div className={cn("mt-4 flex flex-col gap-2 p-4 sm:flex-row-reverse", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)}
    {...props}
  />
))
DrawerDescription.displayName = "DrawerDescription"

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

import * as React from "react"
import { cn } from "../../lib/utils"

const Modal = React.forwardRef(({ children, open, onOpenChange, className, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setIsOpen(true)
    } else {
      // Delay closing for animation
      const timer = setTimeout(() => setIsOpen(false), 150)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-md transition-all duration-150",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={() => onOpenChange?.(false)}
      />
      
      {/* Modal Content */}
      <div
        ref={ref}
        className={cn(
          "relative z-50 w-full max-w-2xl mx-4 bg-white border border-neutral-200 rounded-xl shadow-2xl",
          "max-h-[85vh] overflow-y-auto",
          "transition-all duration-300 ease-out",
          open 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
})
Modal.displayName = "Modal"

const ModalHeader = ({ className, ...props }) => (
  <div className={cn("flex items-center justify-between p-6 border-b border-neutral-200", className)} {...props} />
)
ModalHeader.displayName = "ModalHeader"

const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-semibold text-neutral-900", className)}
    {...props}
  />
))
ModalTitle.displayName = "ModalTitle"

const ModalDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-500", className)}
    {...props}
  />
))
ModalDescription.displayName = "ModalDescription"

const ModalContent = ({ className, ...props }) => (
  <div className={cn("p-6", className)} {...props} />
)
ModalContent.displayName = "ModalContent"

const ModalFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center justify-end gap-3 p-6 border-t border-neutral-200", className)} {...props} />
)
ModalFooter.displayName = "ModalFooter"

const ModalClose = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
      "h-8 w-8 flex items-center justify-center",
      className
    )}
    {...props}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
    <span className="sr-only">Close</span>
  </button>
))
ModalClose.displayName = "ModalClose"

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
}

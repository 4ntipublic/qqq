'use client'

type CartBubbleProps = {
  itemCount: number
}

export default function CartBubble({ itemCount }: CartBubbleProps) {
  const badgeLabel = itemCount > 99 ? '99+' : String(itemCount)
  const hasItems = itemCount > 0

  return (
    <div className="fixed right-6 top-6 z-50 transition-transform hover:scale-105">
      <button
        type="button"
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-3xl"
        aria-label={`Carrito flotante, ${itemCount} items`}
      >
        <span className="pointer-events-none absolute inset-[2px] rounded-full border border-white/20" />

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6 text-white/90"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>

        <div
          className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
            hasItems ? 'bg-red-500 text-white' : 'bg-amber-200 text-black'
          }`}
        >
          {badgeLabel}
        </div>
      </button>
    </div>
  )
}

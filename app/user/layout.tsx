import type { ReactNode } from 'react'

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#ffffff] via-[#f7f8fa] to-[#eef0f3]">
      {children}
    </div>
  )
}

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardHomeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-10 w-80 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded" />
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <Skeleton key={n} className="h-[88px] rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-[124px] rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {[0, 1].map((n) => (
          <Card key={n}>
            <CardHeader className="gap-2">
              <Skeleton className="h-5 w-44 rounded" />
              <Skeleton className="h-3 w-64 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function BeatsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded" />
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[440px_1fr]">
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-10 rounded-xl" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-12 rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

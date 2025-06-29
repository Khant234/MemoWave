
"use client";

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function NoteCardSkeleton() {
  return (
    <Card
      className={cn(
        "overflow-hidden shadow-md flex flex-col"
      )}
      style={{ borderTop: `4px solid hsl(var(--muted))` }}
    >
      <CardHeader className="relative px-4 pt-4 pb-2">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="px-4 pb-4 flex-grow">
        <div className="relative h-[60px] space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 px-4 pb-4 pt-0">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex justify-between w-full items-center pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardFooter>
    </Card>
  )
}

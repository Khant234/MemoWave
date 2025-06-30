
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function CalendarPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col items-center">
            <div className="flex justify-between w-full p-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="w-full p-3 space-y-2">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-md" />
                ))}
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Skeleton key={j} className="h-9 w-9 rounded-full" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="lg:col-span-1">
        <Skeleton className="h-7 w-48 mb-4" />
        <Card>
          <CardContent className="p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border-l-4 border-muted">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

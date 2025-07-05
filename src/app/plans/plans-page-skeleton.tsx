
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PlansPageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="shadow-soft w-full overflow-hidden">
            <CardHeader className="p-4 sm:p-6 border-b">
                <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <div className="mt-4 flex items-center gap-3">
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-5 w-10" />
                </div>
            </CardHeader>
            <CardContent className="p-2">
                <Skeleton className="h-9 w-full" />
            </CardContent>
        </Card>
      ))}
    </div>
  );
}

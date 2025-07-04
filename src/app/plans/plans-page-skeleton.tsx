
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

export function PlansPageSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="shadow-soft border-none w-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-3/4 space-y-2">
                        <Skeleton className="h-7 w-4/5" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <div className="mt-4 flex items-center gap-3">
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-5 w-10" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <CardFooter className="py-3 px-6 border-t">
                    <div className="w-full space-y-4">
                        {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 w-2/3">
                                    <Skeleton className="w-1.5 h-6 rounded-full" />
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                </CardFooter>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}

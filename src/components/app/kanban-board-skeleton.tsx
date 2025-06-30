
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function KanbanBoardSkeleton() {
    return (
        <div className="flex gap-6 flex-1">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col w-80 flex-shrink-0">
                    <Skeleton className="h-7 w-32 mb-4" />
                    <div className="flex-1 bg-secondary rounded-lg p-2 space-y-4">
                        {Array.from({ length: 3 }).map((_, j) => (
                           <Card key={j}>
                                <CardHeader className="p-4">
                                    <Skeleton className="h-5 w-3/4" />
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-5 w-8" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

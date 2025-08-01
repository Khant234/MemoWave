
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function KanbanBoardSkeleton() {
    return (
        <div className="flex flex-1 gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col w-[80vw] max-w-[280px] sm:w-80 sm:max-w-none flex-shrink-0">
                    <Skeleton className="h-6 w-32 mb-2 sm:mb-3" />
                    <div className="flex-1 bg-secondary rounded-lg p-1 sm:p-2 space-y-2 sm:space-y-3">
                        {Array.from({ length: 3 }).map((_, j) => (
                           <Card key={j}>
                                <CardHeader className="p-2 sm:p-3">
                                    <Skeleton className="h-5 w-3/4" />
                                </CardHeader>
                                <CardContent className="p-2 sm:p-3 pt-0">
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

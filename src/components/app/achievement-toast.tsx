"use client";

import { Trophy } from "lucide-react";

type AchievementToastProps = {
    title: string;
    description: string;
}

export function AchievementToast({ title, description }: AchievementToastProps) {
  return (
    <div className="flex items-start gap-3">
        <Trophy className="h-8 w-8 text-yellow-400 mt-1" />
        <div>
            <p className="font-bold text-base">{title}</p>
            <p className="text-sm">{description}</p>
        </div>
    </div>
  );
}

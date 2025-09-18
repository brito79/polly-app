'use client';

import { Card } from '@/components/ui/card';

export function ActivitySkeleton() {
  return (
    <section className="mt-8">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-center">
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </Card>
    </section>
  );
}
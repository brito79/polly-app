import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-6 w-40" />
      </div>
      
      <Card className="p-6">
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </Card>
      
      <div className="mt-8">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      <Skeleton className="h-7 w-48 mt-8 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            <Skeleton className="h-[200px] w-full" />
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
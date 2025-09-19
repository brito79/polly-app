import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function AnnouncementsLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <Button className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Announcement</span>
        </Button>
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="p-6">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="h-6 w-60" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            
            <div className="mt-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
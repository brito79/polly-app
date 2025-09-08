import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PollList } from "@/components/polls/PollList";
import { PlusCircle, BarChart3 } from "lucide-react";

export default function PollsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="mr-3 h-8 w-8" />
              All Polls
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover and participate in polls from the community
            </p>
          </div>
          <Link href="/polls/create">
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Poll
            </Button>
          </Link>
        </div>

        {/* Polls List */}
        <Suspense fallback={<PollListSkeleton />}>
          <PollList />
        </Suspense>
      </div>
    </div>
  );
}

// Loading skeleton component
function PollListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PollList } from "@/components/polls/PollList";
import { PlusCircle, BarChart3 } from "lucide-react";
import { getAllPolls } from "@/lib/actions/poll";

export default async function PollsPage() {
  const pollsData = await getAllPolls(1, 20);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold flex items-center text-gray-900">
                  <BarChart3 className="mr-3 h-8 w-8 text-primary" />
                  All Polls
                </h1>
                <p className="text-muted-foreground text-base">
                  Discover and participate in polls from the community
                </p>
              </div>
              <div>
                <Link href="/polls/create">
                  <Button size="lg" className="shadow-sm">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Poll
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Polls List Container */}
          <div className="space-y-4">
            <PollList polls={pollsData.polls} />
          </div>
        </div>
      </div>
    </div>
  );
}

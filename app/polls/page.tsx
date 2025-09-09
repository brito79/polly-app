import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PollList } from "@/components/polls/PollList";
import { PlusCircle, BarChart3 } from "lucide-react";
import { getAllPolls } from "@/lib/actions/poll";

export default async function PollsPage() {
  const pollsData = await getAllPolls(1, 20);

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
        <PollList polls={pollsData.polls} />
      </div>
    </div>
  );
}

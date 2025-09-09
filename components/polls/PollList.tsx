import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { Poll } from "@/types/database";
import { ExpandablePollCard } from "./ExpandablePollCard";

interface PollListProps {
  polls: Poll[];
}

export function PollList({ polls }: PollListProps) {
  if (polls.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
            <p className="text-gray-500 mb-4">
              Be the first to create a poll and start gathering opinions!
            </p>
            <Link href="/polls/create">
              <Button>Create Your First Poll</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <ExpandablePollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
}

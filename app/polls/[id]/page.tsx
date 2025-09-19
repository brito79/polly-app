import { notFound } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { VotingComponent } from "@/components/polls/VotingComponent";
import { SharePollDialog } from "@/components/polls/SharePollDialog";
import { getPollWithResults, getUserVotesForPoll, checkIfUserCanVote } from "@/lib/actions/poll";

interface PollDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PollDetailsPage({ params }: PollDetailsPageProps) {
  const { id: pollId } = await params;

  // Fetch poll data, user votes, and voting permissions in parallel
  const [poll, userVotes, votePermission] = await Promise.all([
    getPollWithResults(pollId),
    getUserVotesForPoll(pollId),
    checkIfUserCanVote(pollId),
  ]);

  if (!poll) {
    notFound();
  }

  const pollUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/polls/${poll.id}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/polls">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to polls
            </Button>
          </Link>
          
          <div className="flex items-center space-x-2">
            <SharePollDialog poll={poll} />
            <Button variant="outline" size="sm" asChild>
              <a href={pollUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </a>
            </Button>
          </div>
        </div>

        {/* Voting Component */}
        <VotingComponent 
          poll={poll}
          userVotes={userVotes}
          canVote={votePermission.canVote}
          voteReason={votePermission.reason}
        />
      </div>
    </div>
  );
}

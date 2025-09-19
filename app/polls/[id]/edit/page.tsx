/**
 * Polly App - Poll Edit Page
 * 
 * This page provides a secure interface for poll creators to edit their polls.
 * Features comprehensive security measures and validation.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface PollEditPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Poll Edit Page
 * 
 * Placeholder for poll editing functionality. This page currently redirects
 * to the poll view page as editing is handled through other interfaces.
 */
export default async function EditPollPage({ params }: PollEditPageProps) {
  const resolvedParams = await params;
  const pollId = resolvedParams.id;

  // Security: Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(pollId)) {
    redirect('/polls');
  }

  // Security: Create server client and verify authentication
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Security: Verify poll exists and user is creator
  const { data: poll, error } = await supabase
    .from('polls')
    .select('id, creator_id')
    .eq('id', pollId)
    .single();

  if (error || !poll || poll.creator_id !== session.user.id) {
    redirect('/polls');
  }

  // Redirect to poll view page for now
  // TODO: Implement poll editing interface
  redirect(`/polls/${pollId}`);
}
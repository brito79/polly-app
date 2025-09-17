/**
 * Polly App - Poll Deletion Confirmation Page
 * 
 * This page provides a secure interface for poll creators to delete their polls.
 * Features comprehensive security measures and user confirmation flows.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

/**
 * Poll Deletion Confirmation Page
 * 
 * Provides a secure confirmation interface for poll deletion with:
 * - Authentication verification
 * - Creator authorization checks
 * - Poll details display for confirmation
 * - Comprehensive security warnings
 * - Secure deletion flow
 */
export default async function DeletePollPage({ params }: PageProps) {
  const pollId = params.id;

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

  // Security: Fetch poll and verify ownership
  const { data: poll, error } = await supabase
    .from('polls')
    .select(`
      id,
      title,
      description,
      creator_id,
      is_active,
      created_at,
      options:poll_options(id, text),
      votes:votes(id)
    `)
    .eq('id', pollId)
    .single();

  if (error || !poll) {
    redirect('/polls');
  }

  // Security: Verify user is the poll creator
  if (poll.creator_id !== session.user.id) {
    redirect('/polls');
  }

  const optionCount = poll.options?.length || 0;
  const voteCount = poll.votes?.length || 0;

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Link 
          href={`/polls/${pollId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Poll
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900">Delete Poll</h1>
        <p className="text-gray-600 mt-2">
          This action cannot be undone. Please review the details carefully.
        </p>
      </div>

      <div className="space-y-6">
        {/* Security Warning Card */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Permanent Deletion Warning
            </CardTitle>
            <CardDescription className="text-red-700">
              Deleting this poll will permanently remove all associated data including votes and options. 
              This action cannot be undone.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Poll Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Poll Details</CardTitle>
            <CardDescription>
              Review the poll information before deletion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-lg font-semibold">{poll.title}</p>
            </div>
            
            {poll.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-700">{poll.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Options</label>
                <p className="text-lg font-semibold">{optionCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Votes</label>
                <p className="text-lg font-semibold">{voteCount}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                poll.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {poll.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-700">
                {new Date(poll.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deletion Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Confirm Deletion</CardTitle>
            <CardDescription>
              Type the poll title to confirm deletion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={`/api/polls/${pollId}/delete`} method="POST" className="space-y-4">
              <div>
                <label htmlFor="confirmTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Type &ldquo;{poll.title}&rdquo; to confirm:
                </label>
                <input
                  type="text"
                  id="confirmTitle"
                  name="confirmTitle"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter poll title to confirm"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="destructive"
                  className="flex-1"
                  id="delete-poll-button"
                >
                  Delete Poll Permanently
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Client-side confirmation script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const form = document.querySelector('form');
              const confirmInput = document.getElementById('confirmTitle');
              const deleteButton = document.getElementById('delete-poll-button');
              const expectedTitle = ${JSON.stringify(poll.title)};
              
              function validateForm() {
                const isValid = confirmInput.value === expectedTitle;
                deleteButton.disabled = !isValid;
                deleteButton.className = isValid 
                  ? deleteButton.className.replace(' opacity-50 cursor-not-allowed', '')
                  : deleteButton.className + ' opacity-50 cursor-not-allowed';
              }
              
              confirmInput.addEventListener('input', validateForm);
              validateForm(); // Initial validation
              
              form.addEventListener('submit', function(e) {
                if (confirmInput.value !== expectedTitle) {
                  e.preventDefault();
                  alert('Please enter the exact poll title to confirm deletion.');
                  return false;
                }
                
                if (!confirm('Are you absolutely sure you want to delete this poll? This action cannot be undone.')) {
                  e.preventDefault();
                  return false;
                }
              });
            });
          `
        }}
      />
    </div>
  );
}
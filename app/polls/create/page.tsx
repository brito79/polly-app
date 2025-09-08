"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreatePollForm } from "@/components/polls/CreatePollForm";
import type { CreatePollData } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function CreatePollPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, loading, session } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push("/auth/login");
    }
  }, [loading, session, router]);

  const handleCreatePoll = async (pollData: CreatePollData) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual poll creation API call
      console.log("Creating poll:", pollData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Get the created poll ID from API response
      const pollId = "new-poll-id";
      
      console.log("Poll created successfully!");
      
      // Redirect to the polls list or the new poll
      router.push("/polls");
    } catch (error) {
      console.error("Failed to create poll:", error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <CreatePollForm onSubmit={handleCreatePoll} isLoading={isLoading} />
    </div>
  );
}

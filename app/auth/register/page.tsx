"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import type { RegisterCredentials } from "@/types";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration logic
      console.log("Register attempt:", credentials);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Store user session/token
      // For now, just redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="min-h-[80vh] flex items-center justify-center">
        <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
      </div>
    </div>
  );
}

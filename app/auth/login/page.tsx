import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
}

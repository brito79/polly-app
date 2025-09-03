import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="min-h-[80vh] flex items-center justify-center">
        <RegisterForm />
      </div>
    </div>
  );
}

import LoginForm from "@/components/login-form"

export default async function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-8 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  )
}

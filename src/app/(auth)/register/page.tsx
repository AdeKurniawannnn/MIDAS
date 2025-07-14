import { RegisterForm } from '@/components/features/auth/register-form'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join MIDAS
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Register to access our premium marketing services
          </p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        router.push('/scanner');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="flex flex-col min-h-screen bg-background text-white">
        <div className="p-6">
          <button 
            onClick={() => router.back()} 
            className="hover:text-gray-300 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="max-w-sm w-full mx-auto space-y-8">
            <h1 className="text-4xl font-bold animate-fadeIn">
              Welcome back
            </h1>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="username"
                  className="w-full bg-inputBg p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={credentials.username}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    username: e.target.value
                  })}
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-inputBg p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={credentials.password}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    password: e.target.value
                  })}
                />
              </div>

              <button
                type="button"
                className="text-primary hover:text-primary/80 transition-colors text-left w-full"
                onClick={() => router.push('/forgot-password')}
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 p-4 rounded-lg font-medium transition-colors"
              >
                Log in
              </button>
            </form>

            <button
              type="button"
              className="w-full text-center hover:text-gray-300 transition-colors"
              onClick={() => router.push('/signup')}
            >
              New user? Sign Up
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
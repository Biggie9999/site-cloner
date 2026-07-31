"use client";

import { useState } from "react";
import Link from "next/link";

export default function DownloadLoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="bg-white min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Phantom Logo Icon */}
        <div className="flex justify-center mb-6 text-[#121212]">
          <svg width="48" height="48" viewBox="0 0 108 93" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.5 78.1789C0.5 90.2265 6.7065 93 13.1613 93C26.8155 93 37.077 80.6058 43.2007 70.8118C42.4559 72.9786 42.0422 75.1454 42.0422 77.2255C42.0422 82.946 45.1868 87.0196 51.3933 87.0196C59.9169 87.0196 69.0197 79.219 73.7367 70.8118C73.4056 72.0252 73.2401 73.1519 73.2401 74.192C73.2401 78.1789 75.3917 80.6924 79.7777 80.6924C93.5975 80.6924 107.5 55.124 107.5 32.7623C107.5 15.3411 99.0592 0 77.8743 0C40.6354 0 0.5 47.4967 0.5 78.1789ZM65.0476 30.8555C65.0476 26.5219 67.3647 23.4884 70.7575 23.4884C74.0677 23.4884 76.3848 26.5219 76.3848 30.8555C76.3848 35.1892 74.0677 38.3094 70.7575 38.3094C67.3647 38.3094 65.0476 35.1892 65.0476 30.8555ZM82.7568 30.8555C82.7568 26.5219 85.0739 23.4884 88.4668 23.4884C91.7769 23.4884 94.094 26.5219 94.094 30.8555C94.094 35.1892 91.7769 38.3094 88.4668 38.3094C85.0739 38.3094 82.7568 35.1892 82.7568 30.8555Z" fill="currentColor"></path>
          </svg>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-[#121212]">
          {isLogin ? "Welcome back" : "Create an account"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? "Log in to access your wallet" : "Get started with Phantom today"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-200 shadow-xl shadow-gray-200/50 sm:rounded-[2rem] sm:px-10">
          <form className="space-y-6" action="/index.html" method="GET">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
                  Full Name
                </label>
                <div className="mt-2">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 focus:border-[#ab9ff2] focus:outline-none focus:ring-[#ab9ff2] sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 focus:border-[#ab9ff2] focus:outline-none focus:ring-[#ab9ff2] sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 focus:border-[#ab9ff2] focus:outline-none focus:ring-[#ab9ff2] sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#ab9ff2] focus:ring-[#ab9ff2]"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-semibold text-[#ab9ff2] hover:text-[#9d8ff0]">
                    Forgot password?
                  </a>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl bg-[#ab9ff2] hover:bg-[#9d8ff0] px-4 py-3 text-sm font-bold text-[#121212] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ab9ff2] focus:ring-offset-2 transition-all"
              >
                {isLogin ? "Log in" : "Sign up"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-[#ab9ff2] hover:text-[#9d8ff0] transition-colors"
              >
                {isLogin ? "Sign up now" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

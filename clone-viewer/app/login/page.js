"use client";

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert(error.message);
        } else {
          if (email.includes('admin')) {
            router.push('/admin');
          } else {
            router.push('/index.html');
          }
        }
    } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          alert(error.message);
        } else {
          alert("Sign up successful! Please sign in.");
          setIsLogin(true);
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#1B1B1B] w-full max-w-md p-8 rounded-2xl shadow-xl relative">
        <button 
            onClick={() => router.push('/')}
            className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-[#222] rounded-full text-white hover:bg-[#333]"
        >
            ←
        </button>
        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl font-bold text-white mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p className="text-gray-400">{isLogin ? "Sign in to your wallet" : "Set up your new Phantom wallet"}</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full bg-[#222] text-white p-3 rounded-xl border border-[#333] focus:border-[#ab9ff2] focus:outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full bg-[#222] text-white p-3 rounded-xl border border-[#333] focus:border-[#ab9ff2] focus:outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#ab9ff2] hover:bg-[#9d8ff0] text-[#121212] font-bold py-3 px-4 rounded-xl transition-colors mt-6"
          >
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#ab9ff2] text-sm hover:underline"
                type="button"
            >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
        </div>
      </div>
    </div>
  );
}

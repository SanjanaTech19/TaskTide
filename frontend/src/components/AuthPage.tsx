import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  SlidersHorizontal,
  Flame,
  Zap
} from 'lucide-react';
import { login, signup, demoLogin } from '../services/api';
import { AuthResponse } from '../types';

interface AuthPageProps {
  onAuthSuccess: (data: AuthResponse) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In state
  const [loginEmail, setLoginEmail] = useState<string>('alex.chen@tasktide.io');
  const [loginPassword, setLoginPassword] = useState<string>('password123');

  // Sign Up state
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupRole, setSignupRole] = useState<string>('Computer Science Student');
  const [signupInstitution, setSignupInstitution] = useState<string>('Stanford University');
  const [seedStarterData, setSeedStarterData] = useState<boolean>(true);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      onAuthSuccess(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        role: signupRole,
        institution: signupInstitution,
        seed_demo_data: seedStarterData,
      });
      onAuthSuccess(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign up failed. Please try a different email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Instant 1-Click Demo Login
  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await demoLogin();
      onAuthSuccess(res);
    } catch (err: any) {
      setErrorMessage('Demo login failed. Starting fallback.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEAFF] flex flex-col lg:flex-row">
      {/* LEFT COLUMN: Brand Showcase & Value Proposition */}
      <div className="lg:w-1/2 bg-[#151A2D] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Subtle decorative glowing background blurs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#8878F5]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#A7E5C2]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & Title */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8878F5] to-[#A7E5C2] flex items-center justify-center shadow-lg shadow-[#8878F5]/30">
              <svg className="w-6 h-6 text-[#151A2D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12c.6 0 1.2-.4 1.4-1 1.1-2.9 3.8-5 7-5 3.6 0 6.6 2.6 7.4 6.1.2.9 1 1.5 1.9 1.5.1 0 .2 0 .3-.1" />
                <path d="M2 17c.7 0 1.3-.4 1.5-1 1-2.4 3.3-4.1 6-4.1 3.1 0 5.8 2.2 6.5 5.2.2.8.9 1.3 1.8 1.3.1 0 .2 0 .3-.1" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-white">TaskTide</span>
                <span className="text-[10px] uppercase font-bold bg-[#8878F5]/20 text-[#8878F5] px-2 py-0.5 rounded-md border border-[#8878F5]/40">
                  OR-Tools Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">Intelligent Workload Planning & Feasibility System</p>
            </div>
          </div>

          <div className="mt-12 space-y-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Does your workload <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8878F5] to-[#A7E5C2]">
                realistically fit
              </span>{' '}
              into your time?
            </h1>
            <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
              TaskTide moves beyond simple task tracking into <strong>mathematical feasibility analysis</strong>.
              It estimates task requirements, detects deadline collisions, accounts for fixed commitments, and generates constraint-satisfying schedules.
            </p>
          </div>
        </div>

        {/* Middle: Feature Highlights */}
        <div className="relative z-10 my-10 space-y-3.5 max-w-lg">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#8878F5]/20 text-[#8878F5] flex items-center justify-center shrink-0 border border-[#8878F5]/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Workload Feasibility Engine</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculates the exact gap between required hours and available time. Refuses to present fake schedules when constraints make it impossible.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Deadline Collision Simulator</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates how sudden assignments, moved deadlines, or reduced hours impact your week before you commit.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#A7E5C2]/20 text-[#A7E5C2] flex items-center justify-center shrink-0 border border-[#A7E5C2]/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Multi-Strategy Schedule Generator</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Google OR-Tools CP-SAT generates <em>Deadline-First</em>, <em>Balanced Workload</em>, and <em>Deep-Work</em> options with clear trade-offs.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial Banner */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            <p className="italic text-slate-300">
              "Finally an intelligent planner that doesn't pretend 18 hours of work magically fits into 11 available hours."
            </p>
            <p className="text-[11px] text-[#A7E5C2] font-semibold mt-1">
              — Designed for University Students, Interns & Young Professionals
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Forms & 1-Click Demo */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center items-center">
        <div className="max-w-md w-full space-y-6">
          {/* Quick Demo Button Pill */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#8878F5]/10 via-[#A7E5C2]/15 to-transparent border border-[#8878F5]/30 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#8878F5] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#8878F5]/25">
                AC
              </div>
              <div>
                <p className="text-xs font-bold text-[#151A2D]">Explore Demo Account</p>
                <p className="text-[11px] text-slate-500">Alex Chen (CS Junior & ML Intern)</p>
              </div>
            </div>
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
            >
              <span>1-Click Launch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Form Card Container */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 card-shadow space-y-6">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all ${
                  isLogin
                    ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all ${
                  !isLogin
                    ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="alex.chen@tasktide.io"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Password</label>
                    <span className="text-[11px] text-slate-400">Demo: password123</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input type="checkbox" defaultChecked className="rounded text-[#8878F5]" />
                    <span>Remember my session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] transition-all shadow-md shadow-[#8878F5]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* SIGN UP FORM */
              <form onSubmit={handleSignup} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maya Lin"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="maya.lin@university.edu"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Choose a secure password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Role / Level
                    </label>
                    <select
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                    >
                      <option value="Computer Science Student">CS Student</option>
                      <option value="Engineering / ML Intern">Tech Intern</option>
                      <option value="Undergraduate Student">College Student</option>
                      <option value="Graduate AI Researcher">Graduate Researcher</option>
                      <option value="Young Professional">Young Professional</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Institution / Org
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={signupInstitution}
                      onChange={(e) => setSignupInstitution(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seedStarterData}
                      onChange={(e) => setSeedStarterData(e.target.checked)}
                      className="mt-0.5 rounded text-[#8878F5]"
                    />
                    <span>
                      <strong>Pre-populate starter schedule</strong> (creates sample courses, labs, and project deadlines to demonstrate feasibility analysis).
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Creating Your Workspace...' : 'Create Account & Open Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Footer Database Indicator */}
          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>SQLite Relational Database Active • PBKDF2 Encrypted Passwords</span>
          </div>
        </div>
      </div>
    </div>
  );
};

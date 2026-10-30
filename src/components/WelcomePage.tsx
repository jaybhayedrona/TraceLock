import { ShieldCheck, FileText, BellRing, RefreshCw, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';

interface WelcomePageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function WelcomePage({ onGetStarted, onSignIn }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-between selection:bg-[#4776D0]/20 selection:text-[#243B6B]">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
        <Logo size={38} />
        <div className="flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="px-4 py-2 text-sm font-semibold text-[#243B6B] hover:text-[#172033] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] shadow-sm rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        {/* Subtle Brand Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4776D0]/10 text-[#243B6B] text-xs font-semibold mb-6 border border-[#4776D0]/20">
          <ShieldCheck className="w-4 h-4 text-[#4776D0]" />
          <span className="tracking-wide">Enterprise Document Integrity & Cryptographic Monitoring</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold text-[#172033] tracking-tight max-w-3xl text-balance mb-6 leading-tight">
          Your documents. <span className="text-[#4776D0]">Your absolute control.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#64748B] max-w-2xl leading-relaxed mb-10">
          Manage mission-critical documents, monitor cryptographic SHA-256 baselines, and detect unauthorized byte-level tampering in real time with enterprise-grade tenant isolation.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-sm mb-16">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto py-3 px-8 text-sm font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] shadow-md hover:shadow-lg rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Open Vault</span>
            <ArrowRight className="w-4 h-4 text-[#4776D0]" />
          </button>
          <button
            onClick={onSignIn}
            className="w-full sm:w-auto py-3 px-8 text-sm font-semibold text-[#172033] bg-white hover:bg-slate-50 border border-[#E2E8F0] shadow-xs rounded-lg transition-all cursor-pointer"
          >
            Sign In
          </button>
        </div>

        {/* Core Pillars Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-white p-7 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#4776D0] transition-all group">
            <div className="w-11 h-11 rounded-lg bg-[#4776D0]/10 flex items-center justify-center text-[#243B6B] mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-[#4776D0]" />
            </div>
            <h2 className="text-base font-semibold text-[#172033] mb-2">
              Cryptographic Baseline
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Every document registers a permanent SHA-256 byte digest calculated upon ingestion, forming an immutable source of truth.
            </p>
          </div>

          <div className="bg-white p-7 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#15966A] transition-all group">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-[#15966A] mb-4 group-hover:scale-105 transition-transform">
              <BellRing className="w-5 h-5 text-[#15966A]" />
            </div>
            <h2 className="text-base font-semibold text-[#172033] mb-2">
              Instant Security Alerts
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Automated periodic verification detects unexpected byte deviations and notifies stakeholders with deduplicated forensic alerts.
            </p>
          </div>

          <div className="bg-white p-7 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#243B6B] transition-all group">
            <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center text-[#243B6B] mb-4 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-5 h-5 text-[#243B6B]" />
            </div>
            <h2 className="text-base font-semibold text-[#172033] mb-2">
              Duplicate Detection & Resilience
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Smart hash checks guard against redundant uploads, while fault-tolerant rollback buffers protect storage integrity.
            </p>
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-3">
          <span>&copy; {new Date().getFullYear()} TraceLock Platform. All rights reserved.</span>
          <span className="font-mono text-slate-400">
            NIST SHA-256 · Deep Indigo Architecture · High-Integrity Subsystem
          </span>
        </div>
      </footer>
    </div>
  );
}

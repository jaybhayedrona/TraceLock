import { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      onFinish();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 250);
          return 100;
        }
        return prev + 12;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#111C35] via-[#1A2C52] to-[#243B6B] text-white select-none">
      <div className="flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Document + Shield Logo */}
        <div className="mb-6 transform transition-transform hover:scale-105">
          <Logo size={72} showText={false} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans">
          TraceLock
        </h1>

        <p className="text-sm font-medium text-slate-300 tracking-wide mb-8">
          Enterprise Document Integrity & Cryptographic Monitoring
        </p>

        {/* Minimal Progress Bar */}
        <div className="w-56 h-1.5 bg-white/15 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[#4776D0] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[11px] font-mono tabular-nums text-slate-400 tracking-wider">
          Initializing SHA-256 verification engine...
        </p>
      </div>

      <div className="absolute bottom-6 text-[11px] text-slate-400 tracking-wider font-sans">
        Smart Document Management & Tamper Detection
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { Button } from './button';
import { ChevronLeftIcon, GithubIcon, Grid2x2PlusIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface MinimalAuthPageProps {
  onLogin?: (email: string) => void;
}

export function MinimalAuthPage({ onLogin }: MinimalAuthPageProps) {
  const [loadingType, setLoadingType] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle, signInWithGithub } = useAuth();

  const handleSocialLogin = async (type: 'google' | 'github') => {
    setLoadingType(type);
    setError(null);
    try {
      if (type === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
      // Auth state change will be handled by AuthContext automatically
    } catch (err: any) {
      console.error(`${type} login error:`, err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (err?.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email using a different provider.');
      } else {
        setError(`Failed to sign in with ${type}. Please try again.`);
      }
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="relative md:h-screen md:overflow-hidden w-full flex items-center justify-center">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-center px-4">
        <div className="mx-auto space-y-4 sm:w-sm bg-black/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
          {/* Subtle accent glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl transition-all group-hover:bg-emerald-500/20" />
          
          <div className="flex items-center gap-2 mb-4">
            <Grid2x2PlusIcon className="size-6 text-emerald-400" />
            <p className="text-xl font-semibold text-white tracking-tight">LegalEdge AI</p>
          </div>
          
          <div className="flex flex-col space-y-1 mb-6">
            <h1 className="font-heading text-2xl font-bold tracking-wide text-white">
              Sign In or Join Now!
            </h1>
            <p className="text-gray-500 text-base">
              Login or create your account to continue.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              type="button" 
              size="lg" 
              className="w-full bg-white text-black hover:bg-white/90 font-bold h-12 rounded-xl"
              onClick={() => handleSocialLogin('google')}
              disabled={!!loadingType}
            >
              {loadingType === 'google' ? <Loader2 className="animate-spin mr-2" /> : <GoogleIcon className="me-2 size-4" />}
              Continue with Google
            </Button>
            <Button 
              type="button" 
              size="lg" 
              variant="outline"
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => handleSocialLogin('github')}
              disabled={!!loadingType}
            >
              {loadingType === 'github' ? <Loader2 className="animate-spin mr-2" /> : <GithubIcon strokeWidth={2.5} className="me-2 size-4" />}
              Continue with GitHub
            </Button>
          </div>
          
          <p className="text-gray-500 mt-8 text-sm text-center">
            By clicking continue, you agree to our{' '}
            <a href="#" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <g>
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </g>
  </svg>
);
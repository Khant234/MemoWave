
"use client";

import * as React from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.582-3.333-11.227-7.962l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.978,36.213,44,30.551,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
      toast({
        title: "Signed In",
        description: "Welcome back!",
      });
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({
        title: "Sign In Failed",
        description: "Could not sign you in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex items-center justify-center gap-2 mb-8">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-primary"
            >
                <path
                d="M10 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M14 20H20C20.5523 20 21 19.5523 21 19V5C21 4.44772 20.5523 4 20 4H14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M7 16H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M7 12H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M7 8H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
            </svg>
            <span className="font-headline text-4xl font-bold text-foreground/90 tracking-tight">
                MemoWeave
            </span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome Back!</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to access your notes and continue your journey.
        </p>
        <div className="mt-8">
          <Button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 text-base"
          >
            {isSigningIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-5 w-5" />
            )}
            Sign In with Google
          </Button>
        </div>
        <p className="mt-12 text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}

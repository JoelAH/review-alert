"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GoogleButton from 'react-google-button';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { handleGoogleSignIn, handleAuthError } from '@/lib/utils/authHandlers';

export interface GoogleAuthButtonProps {
  /** Custom styling for the Google button */
  style?: React.CSSProperties;
  /** Redirect path after successful authentication */
  redirectTo?: string;
  /** Show toast notifications */
  showToast?: boolean;
}

export default function GoogleAuthButton({ 
  style = { margin: '0 auto' },
  redirectTo = '/dashboard',
  showToast = true 
}: GoogleAuthButtonProps) {
    const router = useRouter();
    const [errors, setErrors] = useState<string>('');

    useEffect(() => {
        if (errors && showToast) {
            toast.error(errors, {
                position: "top-right"
            });
        }
    }, [errors, showToast])

    const onGoogleSignIn = () => {
        setErrors(''); // Clear previous errors
        handleGoogleSignIn(router, {
            redirectTo,
            onError: (error) => handleAuthError(error, setErrors)
        });
    }

    return (
        <>
            {showToast && <ToastContainer />}
            <GoogleButton onClick={onGoogleSignIn} style={style} />
        </>
    )
}
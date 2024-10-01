"use client";

import CONSTANTS from '@/lib/constants';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { signInToServer } from '@/lib/services/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GoogleButton from 'react-google-button';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

export default function AuthButton() {
    const router = useRouter();
    const [errors, setErrors] = useState<string>('');

    useEffect(() => {
        if (errors) {
            toast.error(errors, {
                position: "top-right"
            });
        }
    }, [errors])

    const onGoogleSignIn = () => {
        signInWithGoogle()
            .then(async (userCred) => {
                if (!userCred?.user) {
                    return;
                }
                setErrors('');
                await signInToServer(userCred.user);
                console.log('go to dash')
                router.replace("/dashboard");
            })
            .catch((e) => {
                if (e.code === CONSTANTS.errors.firebase.EMAIL_USED) {
                    setErrors('You have already signed up! Please log into your account.');
                } else {
                    setErrors(CONSTANTS.errors.defaultMessage);
                }
            });
    }

    return (
        <>
            <ToastContainer />
            <GoogleButton onClick={onGoogleSignIn} style={{ 'margin': '0 auto' }} />
        </>
    )
}
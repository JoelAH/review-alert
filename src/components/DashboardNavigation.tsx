'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navigation from './Navigation';
import { signOut } from '@/lib/firebase/auth';
import { signOutOfServer } from '@/lib/services/auth';

/**
 * Navigation component specifically for the dashboard page
 * Includes sign out functionality and authenticated state
 */
export default function DashboardNavigation() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      await signOutOfServer();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Navigation
      isAuthenticated={true}
      currentPath="/dashboard"
      transparent={false}
      showSignOut={true}
      onSignOut={handleSignOut}
    />
  );
}
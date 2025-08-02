
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRedirector() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/');
      return;
    }

    const fetchRole = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        switch (userRole) {
          case 'Admin':
            router.replace('/dashboard/admin');
            break;
          case 'Support Agent':
            router.replace('/dashboard/support-agent');
            break;
          case 'End-User':
            router.replace('/dashboard/end-user');
            break;
          default:
            router.replace('/'); 
            break;
        }
      } else {
        // Handle case where user document doesn't exist
        router.replace('/');
      }
    };

    fetchRole();
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
        <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
  );
}

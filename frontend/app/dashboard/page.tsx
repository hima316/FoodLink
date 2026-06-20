'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import useAuthStore from '../../context/authStore';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (user?.role) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center"
      >
        <Leaf className="w-6 h-6 text-white" />
      </motion.div>
      <p className="text-muted-foreground text-sm animate-pulse">Redirecting to your dashboard...</p>
    </div>
  );
}

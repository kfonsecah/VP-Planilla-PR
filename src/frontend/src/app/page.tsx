"use client"
// pages/home.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to pages/auth
    router.push('/pages/auth');
  }, [router]);

  return null; // Or a loading spinner
};

export default Home;
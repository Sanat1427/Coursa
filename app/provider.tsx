"use client"
import React, { useState } from 'react'
import axios from 'axios';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/userDetailContext';
import Header from './_components/Header';

function Provider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    user && createNewUser();
  }, [user])
  const createNewUser = async () => {
    let attempts = 0;
    while (attempts < 2) {
      try {
        const result = await axios.post('/api/user');
        setUserDetail(result?.data || {});
        return;
      } catch (e) {
        attempts += 1;
        console.error("Failed to create/fetch user", e, "attempt", attempts);
        if (attempts >= 2) {
          // fallback value
          setUserDetail({});
          // optionally notify user via toast or other mechanism
          // toast.error("Unable to load user details");
        } else {
          await new Promise((r) => setTimeout(r, 500 * attempts));
        }
      }
    }
  }
  return (
    <div>
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        <Header />
        <div className='max-w-7xl mx-auto'>
          {children}
        </div>
      </UserDetailContext.Provider>
    </div>
  )
}

export default Provider
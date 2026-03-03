"use client"
import React, { useState } from 'react'
import axios from 'axios';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/userDetailContext';
import Header from './_components/Header';

function provider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    user && createNewUser();
  }, [user])
  const createNewUser = async () => {
    try {
      const result = await axios.post('/api/user');
      setUserDetail(result?.data);
    } catch (e) {
      console.error("Failed to create/fetch user", e);
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

export default provider
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
    const result = await axios.post('/api/user');
    console.log(result.data);
    setUserDetail(result?.data);
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
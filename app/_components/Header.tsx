"use client"
import React from 'react';
import Image from 'next/image';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

function Header() {
    const { user } = useUser();
    return (
        <div className='flex items-center justify-between p-4'>
            <div className='flex gap-2 items-center cursor-pointer group transition-all'>
                <Image src="/logo.png" alt="Logo" width={80} height={80} className='group-hover:rotate-12 group-hover:scale-110 transition-all duration-300' />
                <h2 className='text-3xl font-bold'>Coursa</h2>
            </div>
            <ul className='flex gap-8 items-center'>
                <li className='text-lg hover:primary font-medium cursor-pointer'>Home</li>

                <li className='text-lg hover:primary font-medium cursor-pointer'>Pricing</li>

            </ul>
            {user ?
                <UserButton />
                :
                <SignInButton mode='modal'>
                    <Button>Get Started</Button>
                </SignInButton>
            }
        </div>
    )
}

export default Header
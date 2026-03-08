"use client";
import React from 'react';
import Image from 'next/image';
import { SignInButton, SignOutButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

function Header() {
    const { user } = useUser();
    return (
        <header className='sticky top-0 z-30 bg-white flex items-center justify-between px-8 py-4 shadow-md'>
            <div className='flex items-center gap-6'>
                <Button className='flex items-center gap-2 px-4 py-2 text-lg font-semibold bg-primary text-white rounded-lg'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5M3.75 5.25v13.5m16.5-13.5v13.5" />
                    </svg>
                    Play
                </Button>
                <Button className='flex items-center gap-2 px-4 py-2 text-lg font-semibold bg-secondary text-white rounded-lg'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75v16.5m10.5-16.5v16.5M3.75 3.75h16.5v16.5H3.75V3.75z" />
                    </svg>
                    Book
                </Button>
            </div>
            <ul className='flex gap-10 items-center mx-8'>
                <li className='text-lg hover:text-primary font-medium cursor-pointer'>Home</li>
                <li className='text-lg hover:text-primary font-medium cursor-pointer'>Pricing</li>
            </ul>
            <div className='flex items-center gap-6'>
                {user ?
                    <div className="flex items-center gap-4">
                        <UserButton />
                        <SignOutButton>
                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">Log Out</Button>
                        </SignOutButton>
                    </div>
                    :
                    <SignInButton mode='modal'>
                        <Button>Get Started</Button>
                    </SignInButton>
                }
            </div>
        </header>
    )
}

export default Header
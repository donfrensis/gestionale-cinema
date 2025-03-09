// src/app/dashboard/layout.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from '@/lib/auth-options';
import Navbar from "@/components/Navbar";
import React from "react";

export default async function DashboardLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
        {modal}
      </main>
    </div>
  );
}
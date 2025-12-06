"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="w-full px-6 md:px-12 lg:px-16 py-6 flex items-center justify-between">
      <Link href="/">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          AI Mülakat Asistanı
        </h1>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="outline" className="bg-white text-purple-600 hover:bg-gray-100 rounded-full px-6 py-2 text-sm font-medium">
            Giriş Yap
          </Button>
        </Link>
        <Link href="/signup">
          <Button className="bg-purple-600 text-white hover:bg-purple-700 rounded-full px-6 py-2 text-sm font-medium">
            Kayıt Ol
          </Button>
        </Link>
      </div>
    </nav>
  );
}


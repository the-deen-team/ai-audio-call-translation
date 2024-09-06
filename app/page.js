"use client";
import { useRouter } from "next/navigation";
import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  const handleStartCall = () => {
    router.push("/call");
  };

  return (
    <div className="w-full">
      <header className="bg-blue-600">
        <nav className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-white text-lg font-bold">AI Audio Call Translator</h1>
          <div className="flex gap-4">
            <Link href="/sign-in" className="text-white hover:underline">
              Login
            </Link>
            <Link href="/sign-up" className="text-white hover:underline">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex flex-col items-center justify-center w-full h-screen gap-6">
        <h2 className="text-3xl font-bold">AI Audio Call Translation</h2>
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
          onClick={handleStartCall}
        >
          Call
        </button>
      </main>
    </div>
  );
}

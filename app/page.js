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
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 w-full">
        <nav className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-white text-lg font-bold">Lingo AI</h1>
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

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center gap-16 container mx-auto px-4 lg:px-24">
        {/* Top Section with Left Text and Right Phone Image */}
        <section className="flex flex-col lg:flex-row w-full items-center justify-between gap-8">
          {/* Left: Text Section */}
          <div className="flex flex-col items-start gap-4 max-w-lg">
            <h2 className="text-4xl font-bold text-left">
              Speak In Any Language And Let Lingo AI Do The Rest
            </h2>
            <p className="text-gray-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
              facilisis sit amet magna nec tincidunt. Lorem ipsum dolor sit
              amet.
            </p>
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
              onClick={handleStartCall}
            >
              Start Call
            </button>
          </div>

          {/* Right: Phone Image */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-lg flex justify-center items-center">
            {/* Replace with actual image later */}
            <div className="w-64 h-96 border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center p-4">
              <div className="w-full h-56 bg-gray-200 rounded-lg mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Call with Ismail Peracha</h3>
              <div className="text-center text-sm text-gray-500">
                <div>Audio waveform placeholder</div>
              </div>
              <button className="bg-red-600 text-white mt-4 px-4 py-2 rounded">
                End Call
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Section: About Lingo AI */}
        <section className="flex flex-col items-center gap-4 text-center">
          <h3 className="text-2xl font-bold">About Lingo AI</h3>
          <p className="text-gray-600 max-w-xl">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
            facilisis sit amet magna nec tincidunt. Maecenas id ullamcorper
            velit, a faucibus elit. Proin ornare, nibh id scelerisque ultricies,
            urna lacus laoreet odio, sed convallis massa justo non erat.
          </p>

          {/* Globe Icon with Languages */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex justify-center items-center">
              EN
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex justify-center items-center">
              FR
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex justify-center items-center">
              ES
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex justify-center items-center">
              DE
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

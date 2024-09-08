import Link from "next/link";

export default function Navbar() {
  return (
    <header className="bg-blue-600 w-full">
      <nav className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-white text-lg font-bold cursor-pointer">LingoBridge AI</h1>
        </Link>
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
  );
}

import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import Navbar from "@/components/Navbar"; // Import the Navbar component

export default function SignInPage() {
    return (
        <div className="w-screen">
            {/* Replace header with Navbar */}
            <Navbar />

            <div className="flex flex-col items-center justify-center mt-16">
                <h2 className="text-2xl font-semibold mb-4">Sign In</h2>
                <SignIn />
            </div>
        </div>
    );
}

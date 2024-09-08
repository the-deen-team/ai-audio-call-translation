import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from "@clerk/nextjs";
import Navbar from "@/components/Navbar"; // Import the Navbar component

export default function SignUpPage() {
    return (
        <div className="w-screen">
            {/* Navbar Component */}
            <Navbar />

            <div className="flex flex-col items-center justify-center mt-16">
                <h2 className="text-2xl font-semibold mb-4">Sign Up</h2>
                <SignUp />
            </div>
        </div>
    );
}

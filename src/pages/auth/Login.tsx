import { useState } from "react";
import { Link } from "react-router";
import Input from "../../components/ui/Input";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const isValidEmail = (email: string) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (email && password && isValidEmail(email)) {
            console.log("Login success");
            return true;
        }

        console.log("Invalid input");
        return false;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                    Welcome back
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        type="email"
                        placeholder="Email"
                        className="h-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        type="password"
                        placeholder="Password"
                        className="h-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        type="submit"
                        className="mt-2 cursor-pointer rounded-md bg-[#0b1f4d] px-4 py-3 text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                    >
                        Login
                    </button>
                </form>

                <p className="text-sm text-gray-500 text-center mt-6">
                    Don't have an account?{" "}
                    <Link to="/auth/signup" className="cursor-pointer text-[#0b1f4d] hover:underline active:translate-y-px">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Link } from "react-router";

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
                    <input
                        type="email"
                        placeholder="Email"
                        className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        type="submit"
                        className="mt-2 px-4 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-700"
                    >
                        Login
                    </button>
                </form>

                <p className="text-sm text-gray-500 text-center mt-6">
                    Don’t have an account?{" "}
                    <Link to="/auth/signup" className="text-blue-600 hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}

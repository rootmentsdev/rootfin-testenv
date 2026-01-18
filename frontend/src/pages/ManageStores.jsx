import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Header from "../components/Header";
import baseUrl from "../api/api";

const ManageStores = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [locCode, setLocCode] = useState("");
    const [power, setPower] = useState("normal");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !email || !password || !locCode) {
            alert("Please fill in all required fields.");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        const payload = {
            username,
            email,
            password,
            locCode,
            power,
        };

        try {
            setLoading(true);
            const response = await fetch(`${baseUrl.baseUrl}user/signin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Store created successfully!");
                // Reset form
                setUsername("");
                setEmail("");
                setPassword("");
                setLocCode("");
                setPower("normal");
            } else {
                alert(data.message || "Failed to create store. Please try again.");
            }
        } catch (error) {
            console.error("Error creating store:", error);
            alert("An error occurred while creating the store. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header title="Manage Stores" />
            <div className="ml-[290px] mt-[80px] p-4">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl">
                    <h2 className="text-2xl font-semibold text-center mb-6 text-[#016E5B]">
                        Add New Store
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-2 font-semibold text-gray-700">
                                Store Name (Username) *
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g., G.MG Road"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#016E5B] focus:border-none outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-semibold text-gray-700">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g., store@example.com"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#016E5B] focus:border-none outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-semibold text-gray-700">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#016E5B] focus:border-none outline-none"
                                    required
                                />
                                <span
                                    className="absolute right-4 top-3 text-[#016E5B] text-xl cursor-pointer"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-semibold text-gray-700">
                                Location Code *
                            </label>
                            <input
                                type="text"
                                value={locCode}
                                onChange={(e) => setLocCode(e.target.value)}
                                placeholder="e.g., 729"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#016E5B] focus:border-none outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-semibold text-gray-700">
                                User Type *
                            </label>
                            <select
                                value={power}
                                onChange={(e) => setPower(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#016E5B] focus:border-none outline-none"
                                required
                            >
                                <option value="normal">Normal</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                type="submit"
                                className={`w-[50%] py-2 rounded-lg text-white ${
                                    loading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-[#016E5B] hover:bg-[#014f42]"
                                }`}
                                disabled={loading}
                            >
                                {loading ? "Creating Store..." : "Create Store"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ManageStores;

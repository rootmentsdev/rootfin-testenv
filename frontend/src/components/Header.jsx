import { IoPersonCircleOutline } from "react-icons/io5";
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import Rootments from '../assets/Rootments.jpg';
import { useState, useEffect } from "react";

const Header = (prop) => {
    const AllLoation = [
        { "locName": "Z-Edapally1", "locCode": "144" },
        { "locName": "Warehouse", "locCode": "858" },
        { "locName": "G-Edappally", "locCode": "702" },
        { "locName": "HEAD OFFICE01", "locCode": "759" },
        { "locName": "SG-Trivandrum", "locCode": "700" },
        { "locName": "Z- Edappal", "locCode": "100" },
        { "locName": "Z.Perinthalmanna", "locCode": "133" },
        { "locName": "Z.Kottakkal", "locCode": "122" },
        { "locName": "G.Kottayam", "locCode": "701" },
        { "locName": "G.Perumbavoor", "locCode": "703" },
        { "locName": "G.Thrissur", "locCode": "704" },
        { "locName": "G.Chavakkad", "locCode": "706" },
        { "locName": "G.Calicut ", "locCode": "712" },
        { "locName": "G.Vadakara", "locCode": "708" },
        { "locName": "G.Edappal", "locCode": "707" },
        { "locName": "G.Perinthalmanna", "locCode": "709" },
        { "locName": "G.Kottakkal", "locCode": "711" },
        { "locName": "G.Manjeri", "locCode": "710" },
        { "locName": "G.Palakkad ", "locCode": "705" },
        { "locName": "G.Kalpetta", "locCode": "717" },
        { "locName": "G.Kannur", "locCode": "716" }
    ];

    const [Value, setValue] = useState({ locCode: '', locName: '' });
    console.log(Value);

    const [logOut, setlogOut] = useState(false);
    const [selectedValue, setSelectedValue] = useState("");
    const [currentUser, setCurrentUser] = useState({});

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("rootfinuser"));
        if (storedUser) {
            setCurrentUser(storedUser);
            setSelectedValue(storedUser.locCode);
        }
    }, []);

    const handleChange = (e) => {
        const selectedCode = e.target.value;
        const selectedItem = AllLoation.find(item => item.locCode === selectedCode);
        if (selectedItem) {
            setSelectedValue(selectedItem.locCode);
            setValue({
                locCode: selectedItem.locCode,
                locName: selectedItem.locName,
            });

            const updatedUser = {
                ...currentUser,
                locCode: selectedItem.locCode,
                username: selectedItem.locName,
            };

            localStorage.setItem("rootfinuser", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            window.location.reload()
        }
    };

    const HanndleRemove = () => {
        try {
            localStorage.removeItem("rootfinuser");
            window.location.reload();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <nav className="bg-gradient-to-r from-white to-gray-50 ml-[250px] border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-6 py-4">
                {/* Logo and Title */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img src={Rootments} className="h-10 w-10 rounded-lg shadow-md" alt="RootFin Logo" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-gray-800">{prop.title}</span>
                            <span className="text-xs text-gray-500">Financial Management System</span>
                        </div>
                    </div>
                </div>

                {/* User Section */}
                <div className="flex items-center space-x-4">
                    {/* Store Selector */}
                    <div className="relative">
                        <select
                            value={selectedValue}
                            onChange={handleChange}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                        >
                            {AllLoation.map((location) => (
                                <option key={location.locCode} value={location.locCode}>
                                    {location.locName}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* User Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setlogOut((prev) => !prev)}
                            className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                        >
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <FiUser className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-700">{currentUser?.username}</p>
                                    <p className="text-xs text-gray-500">Store Manager</p>
                                </div>
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {logOut && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{currentUser?.username}</p>
                                    <p className="text-xs text-gray-500">{currentUser?.email || 'user@rootfin.com'}</p>
                                </div>
                                
                                <div className="py-1">
                                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
                                        <FiSettings className="w-4 h-4 mr-3 text-gray-400" />
                                        Settings
                                    </button>
                                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
                                        <FiUser className="w-4 h-4 mr-3 text-gray-400" />
                                        Profile
                                    </button>
                                </div>
                                
                                <div className="border-t border-gray-100 pt-1">
                                    <button
                                        onClick={HanndleRemove}
                                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                    >
                                        <FiLogOut className="w-4 h-4 mr-3" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;

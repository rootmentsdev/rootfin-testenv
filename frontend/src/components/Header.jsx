import { IoPersonCircleOutline } from "react-icons/io5";
import Rootments from '../assets/Rootments.jpg';
import { useState, useEffect } from "react";
import baseUrl from '../api/api';

const Header = (prop) => {
    // Fallback hardcoded locations (for backward compatibility)
    const fallbackLocations = [
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
        { "locName": "G.Kannur", "locCode": "716" },
        { "locName": "G.Mg Road", "locCode": "718" },
        { "locName": "Production", "locCode": "101" },
        { "locName": "Office", "locCode": "102" },
        { "locName": "WAREHOUSE", "locCode": "103" }
    ];

    const [AllLoation, setAllLoation] = useState(fallbackLocations);
    const [Value, setValue] = useState({ locCode: '', locName: '' });
    const [logOut, setlogOut] = useState(false);
    const [selectedValue, setSelectedValue] = useState("");
    const [currentUser, setCurrentUser] = useState({});

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("rootfinuser"));
        if (storedUser) {
            setCurrentUser(storedUser);
            setSelectedValue(storedUser.locCode);
        }

        // Fetch stores from backend
        const fetchStores = async () => {
            try {
                const response = await fetch(`${baseUrl.baseUrl}user/getAllStores`);
                const data = await response.json();
                if (response.ok && data.stores && data.stores.length > 0) {
                    // Merge backend stores with fallback (deduplicate by locCode)
                    const backendStores = data.stores;
                    const fallbackMap = new Map(fallbackLocations.map(loc => [loc.locCode, loc]));
                    const mergedMap = new Map();

                    // Add all backend stores first (they take priority)
                    backendStores.forEach(store => {
                        mergedMap.set(store.locCode, store);
                    });

                    // Add fallback stores that don't exist in backend
                    fallbackLocations.forEach(loc => {
                        if (!mergedMap.has(loc.locCode)) {
                            mergedMap.set(loc.locCode, loc);
                        }
                    });

                    // Convert map back to array and sort by locName
                    const mergedStores = Array.from(mergedMap.values()).sort((a, b) => 
                        a.locName.localeCompare(b.locName)
                    );
                    setAllLoation(mergedStores);
                }
            } catch (error) {
                // Keep fallback locations on error
            }
        };

        fetchStores();
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
            // Silent error handling
        }
    };

    return (
        <nav className="bg-white ml-[250px] border-gray-200 dark:border-gray-700">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <a href="#" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img src={Rootments} className="h-8 rounded-md" alt="Flowbite Logo" />
                    <span className="self-center text-2xl font-semibold whitespace-nowrap text-black">{prop.title}</span>
                </a>

                <div
                    onClick={() => setlogOut((prev) => !prev)}
                    className="hidden cursor-pointer w-full md:block md:w-auto"
                    id="navbar-multi-level"
                >
                    <div className="flex items-center gap-4">
                        <h2>{currentUser?.username}</h2>
                        <IoPersonCircleOutline className="text-4xl text-green-600" />
                    </div>
                </div>
            </div>

            {logOut && (
                <div className="flex flex-col items-center text-center w-48 h-36 rounded-md shadow-2xl bg-slate-200 absolute right-5 p-4 space-y-4">
                    <button
                        className="px-3 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
                        onClick={HanndleRemove}
                    >
                        Logout
                    </button>

                    {currentUser.power === 'admin' && (
                        <select
                            className="px-2 py-1 rounded-md border-none border-gray-300"
                            value={selectedValue}
                            onChange={handleChange}
                        >
                            <option value="" disabled>
                                -- Select a location --
                            </option>
                            {AllLoation.map((item) => (
                                <option key={item.locCode} value={item.locCode}>
                                    {item.locName}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Header;

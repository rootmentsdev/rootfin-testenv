import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
    FileText, 
    ChevronDown, 
    ShoppingBag, 
    LineChart, 
    DollarSign, 
    FolderClosed, 
    Notebook,
    Home,
    BarChart3,
    Users,
    Settings
} from "lucide-react";

const Nav = () => {
    const location = useLocation();
    const currentuser = JSON.parse(localStorage.getItem("rootfinuser"));

    const activePath = location.pathname;

    const getTabClasses = (path) =>
        activePath === path ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100";

    const getTabClasses1 = (path) =>
        activePath === path ? "text-blue-600 font-medium bg-blue-50 border-l-4 border-blue-600" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50";

    const [isOpen, setIsOpen] = useState(true);
    const [homeOpen, setHomeOpen] = useState(false);
    const [homeOpen1, setHomeOpen1] = useState(false);

    return (
        <div className={`flex ${location.pathname === "/login" ? "hidden" : "block"}`}>
            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full bg-gradient-to-b from-white to-gray-50 text-gray-700 w-64 shadow-xl transform ${isOpen ? "translate-x-0" : "-translate-x-64"} transition-transform duration-300 z-40`}>
                
                {/* Logo Section */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800">RootFin</h1>
                            <p className="text-xs text-gray-500">Financial System</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4 space-y-2">
                    {/* Reports Section */}
                    <div className="space-y-1">
                        <button
                            onClick={() => setHomeOpen(!homeOpen)}
                            className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 ${getTabClasses('/')} ${getTabClasses('/datewisedaybook')} ${getTabClasses('/securityReport')} ${getTabClasses('/Revenuereport')}`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText size={16} className="text-blue-600" />
                                </div>
                                <span className="font-medium">Reports</span>
                            </div>
                            <ChevronDown 
                                size={16} 
                                className={`transition-transform duration-200 ${homeOpen ? "rotate-180" : "rotate-0"}`} 
                            />
                        </button>

                        {homeOpen && (
                            <div className="ml-6 space-y-1 mt-2">
                                <Link 
                                    to="/" 
                                    className={`block p-3 rounded-lg transition-all duration-200 ${getTabClasses1("/")}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span className="text-sm">Day Book</span>
                                    </div>
                                </Link>
                                <Link 
                                    to="/datewisedaybook" 
                                    className={`block p-3 rounded-lg transition-all duration-200 ${getTabClasses1('/datewisedaybook')}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span className="text-sm">Financial Summary</span>
                                    </div>
                                </Link>
                                <Link 
                                    to="/securityReport" 
                                    className={`block p-3 rounded-lg transition-all duration-200 ${getTabClasses1('/securityReport')}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span className="text-sm">Security Report</span>
                                    </div>
                                </Link>
                                <Link 
                                    to="/Revenuereport" 
                                    className={`block p-3 rounded-lg transition-all duration-200 ${getTabClasses1('/Revenuereport')}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span className="text-sm">Revenue Report</span>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Quantity Reports Section */}
                    <div className="space-y-1">
                        <button
                            onClick={() => setHomeOpen1(!homeOpen1)}
                            className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 ${getTabClasses('/BookingReport')} ${getTabClasses('/RentOutReport')}`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                    <ShoppingBag size={16} className="text-green-600" />
                                </div>
                                <span className="font-medium">Quantity Reports</span>
                            </div>
                            <ChevronDown 
                                size={16} 
                                className={`transition-transform duration-200 ${homeOpen1 ? "rotate-180" : "rotate-0"}`} 
                            />
                        </button>

                        {homeOpen1 && (
                            <div className="ml-6 space-y-1 mt-2">
                                <Link 
                                    to="/BookingReport" 
                                    className={`block p-3 rounded-lg transition-all duration-200 ${getTabClasses1('/BookingReport')}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-sm">Booking Report</span>
                                    </div>
                                </Link>
                                <Link 
                                    to="/RentOutReport" 
                                    className={`block p-3 rounded-lg transition-all duration-200 ${getTabClasses1('/RentOutReport')}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-sm">Rent Out Report</span>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Income & Expenses */}
                    <Link 
                        to="/Income&Expenses" 
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${getTabClasses("/Income&Expenses")}`}
                    >
                        <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                            <LineChart size={16} className="text-purple-600" />
                        </div>
                        <span className="font-medium">Income & Expenses</span>
                    </Link>

                    {/* Cash / Bank Ledger */}
                    <Link 
                        to="/CashBankLedger" 
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${getTabClasses("/CashBankLedger")}`}
                    >
                        <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <DollarSign size={16} className="text-yellow-600" />
                        </div>
                        <span className="font-medium">Cash / Bank Ledger</span>
                    </Link>

                    {/* Admin Only Sections */}
                    {currentuser.power === 'admin' && (
                        <>
                            <Link 
                                to="/CloseReport" 
                                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${getTabClasses("/CloseReport")}`}
                            >
                                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                                    <FolderClosed size={16} className="text-red-600" />
                                </div>
                                <span className="font-medium">Close Report</span>
                            </Link>

                            <Link 
                                to="/AdminClose" 
                                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${getTabClasses("/AdminClose")}`}
                            >
                                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Notebook size={16} className="text-indigo-600" />
                                </div>
                                <span className="font-medium">Admin Close</span>
                            </Link>
                        </>
                    )}
                </nav>

                {/* Bottom Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{currentuser?.username}</p>
                            <p className="text-xs text-gray-500">{currentuser?.power === 'admin' ? 'Administrator' : 'Store Manager'}</p>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Nav;





// import { IoPersonCircleOutline } from "react-icons/io5";









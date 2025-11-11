import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, ChevronDown, ShoppingBag, LineChart, DollarSign, FolderClosed, Notebook, Store, Package, Box, SlidersHorizontal, PackageSearch, ArrowLeftRight, List, Layers, Tags, ShoppingCart, ClipboardList, FileText as FileTextIcon, Truck, Wallet, RotateCcw, ReceiptText, Users } from "lucide-react";
const Nav = () => {
    const location = useLocation();
    const currentuser = JSON.parse(localStorage.getItem("rootfinuser")); // Convert back to an object

    const activePath = location.pathname;

    const getTabClasses = (path) =>
        `
        ${activePath === path ? "bg-[#3758F9] text-white font-semibold" : ""}`;

    const getTabClasses1 = (path) =>
        `
            ${activePath === path ? "text-[#3758F9]" : ""}`;

    const [isOpen, setIsOpen] = useState(true);

    const getInitialSection = useMemo(() => {
        if (activePath === "/" || activePath === "/datewisedaybook" || activePath === "/securityReport" || activePath === "/Revenuereport") {
            return "reports";
        }
        if (activePath === "/BookingReport" || activePath === "/RentOutReport") {
            return "quantity";
        }
        if (activePath.startsWith("/inventory")) {
            return "inventory";
        }
        if (activePath.startsWith("/sales")) {
            return "sales";
        }
        if (activePath.startsWith("/shoe-sales")) {
            return "shoeSales";
        }
        return null;
    }, [activePath]);

    const [openSection, setOpenSection] = useState(getInitialSection);

    useEffect(() => {
        setOpenSection(getInitialSection);
    }, [getInitialSection]);

    const isReportsOpen = openSection === "reports";
    const isQuantityOpen = openSection === "quantity";
    const isInventoryOpen = openSection === "inventory";
    const isSalesOpen = openSection === "sales";
    const isShoeSalesOpen = openSection === "shoeSales";

    const inventoryLinks = [
        { to: "/inventory/adjustments", label: "Inventory Adjustments", Icon: SlidersHorizontal },
        { to: "/inventory/packages", label: "Packages", Icon: PackageSearch },
        { to: "/inventory/transfer-orders", label: "Transfer Orders", Icon: ArrowLeftRight }
    ];
    const shoeSalesLinks = [
        { to: "/shoe-sales/items", label: "Items", Icon: List },
        { to: "/shoe-sales/item-groups", label: "Item Groups", Icon: Layers },
        { to: "/shoe-sales/price-lists", label: "Price Lists", Icon: Tags }
    ];
    const salesLinks = [
        { to: "/sales/customers", label: "Customers", Icon: Users },
        { to: "/sales/orders", label: "Sales Orders", Icon: ClipboardList },
        { to: "/sales/invoices", label: "Invoices", Icon: FileTextIcon },
        { to: "/sales/delivery-challans", label: "Delivery Challans", Icon: Truck },
        { to: "/sales/payments-received", label: "Payments Received", Icon: Wallet },
        { to: "/sales/returns", label: "Sales Returns", Icon: RotateCcw },
        { to: "/sales/credit-notes", label: "Credit Notes", Icon: ReceiptText }
    ];
    const isInventoryActive = inventoryLinks.some((link) => link.to === activePath);
    const isSalesActive = salesLinks.some((link) => link.to === activePath);
    const isShoeSalesActive = shoeSalesLinks.some((link) => link.to === activePath);

    // alert(location.pathname)
    return (
        <div className={`flex ${location.pathname === "/login" ? "hidden" : "block"}`}
        >
            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full bg-[#EEF1FF] text-[#53545C] w-64 p-5 overflow-y-auto pb-10 transform ${isOpen ? "translate-x-0" : "-translate-x-64"} transition-transform duration-300`}>
                {/* <button className="text-white mb-5" onClick={() => setIsOpen(false)}>
                <X size={24} />
            </button> */}
                <nav className="space-y-4">
                    {/* Home with Submenu */}
                    <div>
                        <Link to={'/'}>
                            <button
                                onClick={() => setOpenSection(isReportsOpen ? null : "reports")}
                                className={`flex items-center justify-between w-full p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${getTabClasses('/')}${getTabClasses('/datewisedaybook')}${getTabClasses('/securityReport')}${getTabClasses('/Revenuereport')}`}>
                                <div className="flex items-center space-x-3">
                                    <FileText size={20} />
                                    <span>Reports</span>
                                </div>
                                <ChevronDown size={20} className={`${isReportsOpen ? "rotate-180" : "rotate-0"} transition-transform`} />
                            </button>

                        </Link>
                        {isReportsOpen && (
                            <div className="ml-8 space-y-2">
                                <Link to="/" className={`block p-2 rounded hover:bg-[#86aeff] hover:text-white ${getTabClasses1("/")}`}>Day Book</Link>
                                <Link to="/datewisedaybook" className={`block p-2 rounded hover:bg-[#86aeff] hover:text-white ${getTabClasses1('/datewisedaybook')}`}>Financial Summary Report</Link>
                                <Link to="/securityReport" className={`block p-2 rounded hover:bg-[#86aeff] hover:text-white ${getTabClasses1('/securityReport')}`}>Security Report</Link>
                                <Link to="/Revenuereport" className={`block p-2 rounded hover:bg-[#86aeff] hover:text-white ${getTabClasses1('/Revenuereport')}`}>Revenue Report</Link>

                            </div>
                        )}
                    </div>

                    <div>
                        <Link to={'/BookingReport'}>
                            <button
                                onClick={() => setOpenSection(isQuantityOpen ? null : "quantity")}
                                className={`flex items-center justify-between w-full p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${getTabClasses('/BookingReport')} ${getTabClasses('/RentOutReport')}`}>
                                <div className="flex items-center space-x-3">
                                    <ShoppingBag size={20} />
                                    <span>Quantity Reports</span>
                                </div>
                                <ChevronDown size={20} className={`${isQuantityOpen ? "rotate-180" : "rotate-0"} transition-transform`} />
                            </button>

                        </Link>
                        {isQuantityOpen && (
                            <div className="ml-8 space-y-2">
                                <Link to="/BookingReport" className={`block p-2 rounded hover:bg-[#86aeff] hover:text-white ${getTabClasses1('/BookingReport')}`}>Booking Report</Link>
                                <Link to="/RentOutReport" className={`block p-2 rounded hover:bg-[#86aeff] hover:text-white ${getTabClasses1('/RentOutReport')} `}>Rent Out Report</Link>
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            onClick={() => setOpenSection(isInventoryOpen ? null : "inventory")}
                            className={`flex items-center justify-between w-full p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${isInventoryActive || isInventoryOpen ? "bg-[#3758F9] text-white font-semibold" : ""}`}
                        >
                            <div className="flex items-center space-x-3">
                                <Box size={20} />
                                <span>Inventory</span>
                            </div>
                            <ChevronDown size={20} className={`${isInventoryOpen ? "rotate-180" : "rotate-0"} transition-transform`} />
                        </button>
                        {isInventoryOpen && (
                            <div className="ml-8 space-y-2">
                                {inventoryLinks.map(({ to, label, Icon }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={`flex items-center space-x-2 p-2 rounded hover:bg-[#86aeff] hover:text-white text-[14px] ${getTabClasses1(to)}`}
                                    >
                                        <Icon size={16} />
                                        <span>{label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            onClick={() => setOpenSection(isSalesOpen ? null : "sales")}
                            className={`flex items-center justify-between w-full p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${isSalesActive || isSalesOpen ? "bg-[#3758F9] text-white font-semibold" : ""}`}
                        >
                            <div className="flex items-center space-x-3">
                                <ShoppingCart size={20} />
                                <span>Sales</span>
                            </div>
                            <ChevronDown size={20} className={`${isSalesOpen ? "rotate-180" : "rotate-0"} transition-transform`} />
                        </button>
                        {isSalesOpen && (
                            <div className="ml-8 space-y-2">
                                {salesLinks.map(({ to, label, Icon }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={`flex items-center space-x-2 p-2 rounded hover:bg-[#86aeff] hover:text-white text-[14px] ${getTabClasses1(to)}`}
                                    >
                                        <Icon size={16} />
                                        <span>{label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <Link to={'/shoe-sales/items'}>
                            <button
                                onClick={() => setOpenSection(isShoeSalesOpen ? null : "shoeSales")}
                                className={`flex items-center justify-between w-full p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${isShoeSalesActive || isShoeSalesOpen ? "bg-[#3758F9] text-white font-semibold" : ""}`}>
                                <div className="flex items-center space-x-3">
                                    <Package size={20} />
                                    <span>Shoe Sales</span>
                                </div>
                                <ChevronDown size={20} className={`${isShoeSalesOpen ? "rotate-180" : "rotate-0"} transition-transform`} />
                            </button>

                        </Link>
                        {isShoeSalesOpen && (
                            <div className="ml-8 space-y-2">
                                {shoeSalesLinks.map(({ to, label, Icon }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={`flex items-center space-x-2 p-2 rounded hover:bg-[#86aeff] hover:text-white text-[14px] ${getTabClasses1(to)}`}
                                    >
                                        <Icon size={16} />
                                        <span>{label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link to="/Income&Expenses" className={`flex items-center space-x-3 p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${getTabClasses1("/Income&Expenses")}`}>
                        <LineChart size={20} />
                        <span>Income & Expenses</span>
                    </Link>
                    <Link to="/CashBankLedger" className={`flex items-center space-x-3 p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${getTabClasses1("/CashBankLedger")}`}>
                        <DollarSign size={20} />
                        <span>Cash / Bank Ledger</span>
                    </Link>

                    {
                        currentuser.power === 'admin' && <Link to="/CloseReport" className={`flex items-center space-x-3 p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${getTabClasses1("/CloseReport")}`}>
                            <FolderClosed size={20} />
                            <span>Close  Report</span>
                        </Link>

                    }
                     {
                        currentuser.power === 'admin' && <Link to="/AdminClose" className={`flex items-center space-x-3 p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${getTabClasses1("/AdminClose")}`}>
                            <Notebook size={20} />
                            <span>Admin Close</span>
                        </Link>
                        

                    }
                    {
                        currentuser.power === 'admin' && <Link to="/ManageStores" className={`flex items-center space-x-3 p-3 rounded hover:bg-[#3758F9] hover:text-white text-[15px] font-medium ${getTabClasses1("/ManageStores")}`}>
                            <Store size={20} />
                            <span>Manage Stores</span>
                        </Link>
                    }
                </nav>

            </div>

            {/* Menu Button */}
            {/* <button className="fixed top-5 left-5 text-gray-900 bg-gray-200 p-2 rounded-md shadow-md" onClick={() => setIsOpen(true)}>
            <Menu size={24} />
        </button> */}
        </div>
    )
}

export default Nav





// import { IoPersonCircleOutline } from "react-icons/io5";









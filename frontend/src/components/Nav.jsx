import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    FileText,
    ChevronDown,
    ShoppingBag,
    LineChart,
    DollarSign,
    FolderClosed,
    Notebook,
    Store,
    Package,
    Box,
    SlidersHorizontal,
    PackageSearch,
    ArrowLeftRight,
    List,
    Layers,
    Tags,
    ShoppingCart,
    ClipboardList,
    FileText as FileTextIcon,
    Truck,
    Wallet,
    RotateCcw,
    ReceiptText,
    Users
} from "lucide-react";
const Nav = () => {
    const location = useLocation();
    const currentuser = JSON.parse(localStorage.getItem("rootfinuser")); // Convert back to an object

    const activePath = location.pathname;

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

    const isReportsActive = ["/", "/datewisedaybook", "/securityReport", "/Revenuereport"].includes(activePath);
    const isQuantityActive = ["/BookingReport", "/RentOutReport"].includes(activePath);

    const groupButtonClasses = (isActive) =>
        `sidebar-button flex items-center justify-between w-full rounded-lg px-4 py-3 text-sm font-medium tracking-wide transition-all border ${
            isActive
                ? "bg-[#132a4d] text-white border-[#2563eb]/70 shadow-[0_6px_20px_-10px_rgba(37,99,235,0.6)]"
                : "text-[#9ca3af] border-transparent hover:bg-[#111827] hover:text-white"
        }`;

    const subLinkClasses = (path) =>
        `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
            activePath === path
                ? "border border-[#2563eb]/70 bg-[#1d4ed8] text-white shadow-[0_4px_14px_-8px_rgba(37,99,235,0.8)]"
                : "border border-transparent text-[#94a3b8] hover:bg-[#111827] hover:text-white"
        }`;

    const singleLinkClasses = (path) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
            activePath === path
                ? "border border-[#2563eb]/70 bg-[#132a4d] text-white shadow-[0_4px_14px_-8px_rgba(37,99,235,0.8)]"
                : "border border-transparent text-[#94a3b8] hover:bg-[#111827] hover:text-white"
        }`;

    // alert(location.pathname)
    return (
        <div className={`flex ${location.pathname === "/login" ? "hidden" : "block"}`}>
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 transform overflow-y-auto bg-[#0b1120] pb-10 pl-4 pr-3 pt-6 text-[#cbd5f5] transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-64"
                }`}
            >
                {/* <button className="text-white mb-5" onClick={() => setIsOpen(false)}>
                <X size={24} />
            </button> */}
                <nav className="space-y-3">
                    {/* Home with Submenu */}
                    <div>
                        <Link to={'/'}>
                            <button
                                onClick={() => setOpenSection(isReportsOpen ? null : "reports")}
                                className={groupButtonClasses(isReportsActive || isReportsOpen)}
                            >
                                <div className="flex w-full items-center gap-3">
                                    <FileText size={18} className="shrink-0" />
                                    <span className="flex-1 text-left">Reports</span>
                                    <ChevronDown
                                        size={16}
                                        className={`shrink-0 transition-transform ${isReportsOpen ? "rotate-180" : "rotate-0"}`}
                                    />
                                </div>
                            </button>
                        </Link>
                        {isReportsOpen && (
                            <div className="mt-2 space-y-1 border-l border-[#1b233a]/70 pl-3">
                                <Link to="/" className={subLinkClasses("/")}>Day Book</Link>
                                <Link to="/datewisedaybook" className={subLinkClasses('/datewisedaybook')}>Financial Summary Report</Link>
                                <Link to="/securityReport" className={subLinkClasses('/securityReport')}>Security Report</Link>
                                <Link to="/Revenuereport" className={subLinkClasses('/Revenuereport')}>Revenue Report</Link>
                            </div>
                        )}
                    </div>

                    <div>
                        <Link to={'/BookingReport'}>
                            <button
                                onClick={() => setOpenSection(isQuantityOpen ? null : "quantity")}
                                className={groupButtonClasses(isQuantityActive || isQuantityOpen)}
                            >
                                <div className="flex w-full items-center gap-3">
                                    <ShoppingBag size={18} className="shrink-0" />
                                    <span className="flex-1 text-left">Quantity Reports</span>
                                    <ChevronDown
                                        size={16}
                                        className={`shrink-0 transition-transform ${isQuantityOpen ? "rotate-180" : "rotate-0"}`}
                                    />
                                </div>
                            </button>

                        </Link>
                        {isQuantityOpen && (
                            <div className="mt-2 space-y-1 border-l border-[#1b233a]/70 pl-3">
                                <Link to="/BookingReport" className={subLinkClasses('/BookingReport')}>Booking Report</Link>
                                <Link to="/RentOutReport" className={subLinkClasses('/RentOutReport')}>Rent Out Report</Link>
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            onClick={() => setOpenSection(isInventoryOpen ? null : "inventory")}
                            className={groupButtonClasses(isInventoryActive || isInventoryOpen)}
                        >
                            <div className="flex w-full items-center gap-3">
                                <Box size={18} className="shrink-0" />
                                <span className="flex-1 text-left">Inventory</span>
                                <ChevronDown
                                    size={16}
                                    className={`shrink-0 transition-transform ${isInventoryOpen ? "rotate-180" : "rotate-0"}`}
                                />
                            </div>
                        </button>
                        {isInventoryOpen && (
                            <div className="mt-2 space-y-1 border-l border-[#1b233a]/70 pl-3">
                                {inventoryLinks.map(({ to, label, Icon }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={subLinkClasses(to)}
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
                            className={groupButtonClasses(isSalesActive || isSalesOpen)}
                        >
                            <div className="flex w-full items-center gap-3">
                                <ShoppingCart size={18} className="shrink-0" />
                                <span className="flex-1 text-left">Sales</span>
                                <ChevronDown
                                    size={16}
                                    className={`shrink-0 transition-transform ${isSalesOpen ? "rotate-180" : "rotate-0"}`}
                                />
                            </div>
                        </button>
                        {isSalesOpen && (
                            <div className="mt-2 space-y-1 border-l border-[#1b233a]/70 pl-3">
                                {salesLinks.map(({ to, label, Icon }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={subLinkClasses(to)}
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
                                className={groupButtonClasses(isShoeSalesActive || isShoeSalesOpen)}
                            >
                                <div className="flex w-full items-center gap-3">
                                    <Package size={18} className="shrink-0" />
                                    <span className="flex-1 text-left">Shoe Sales</span>
                                    <ChevronDown
                                        size={16}
                                        className={`shrink-0 transition-transform ${isShoeSalesOpen ? "rotate-180" : "rotate-0"}`}
                                    />
                                </div>
                            </button>

                        </Link>
                        {isShoeSalesOpen && (
                            <div className="mt-2 space-y-1 border-l border-[#1b233a]/70 pl-3">
                                {shoeSalesLinks.map(({ to, label, Icon }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={subLinkClasses(to)}
                                    >
                                        <Icon size={16} />
                                        <span>{label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link to="/Income&Expenses" className={singleLinkClasses("/Income&Expenses")}>
                        <LineChart size={18} />
                        <span>Income & Expenses</span>
                    </Link>
                    <Link to="/CashBankLedger" className={singleLinkClasses("/CashBankLedger")}>
                        <DollarSign size={18} />
                        <span>Cash / Bank Ledger</span>
                    </Link>

                    {
                        currentuser.power === 'admin' && <Link to="/CloseReport" className={singleLinkClasses("/CloseReport")}>
                            <FolderClosed size={18} />
                            <span>Close  Report</span>
                        </Link>

                    }
                     {
                        currentuser.power === 'admin' && <Link to="/AdminClose" className={singleLinkClasses("/AdminClose")}>
                            <Notebook size={18} />
                            <span>Admin Close</span>
                        </Link>
                        
                    }
                    {
                        currentuser.power === 'admin' && <Link to="/ManageStores" className={singleLinkClasses("/ManageStores")}>
                            <Store size={18} />
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









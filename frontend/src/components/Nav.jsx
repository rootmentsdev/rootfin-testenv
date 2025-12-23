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
    ArrowLeftRight,
    List,
    Layers,
    ShoppingCart,
    ClipboardList,
    FileText as FileTextIcon,
    Truck,
    RotateCcw,
    ReceiptText,
    Users,
    PackageCheck,
    AlertTriangle
} from "lucide-react";
const Nav = () => {
    const location = useLocation();
    const currentuser = JSON.parse(localStorage.getItem("rootfinuser")); // Convert back to an object

    const activePath = location.pathname;

    const [isOpen, setIsOpen] = useState(true);

    const getInitialSection = useMemo(() => {
        if (activePath === "/" || activePath === "/datewisedaybook" || activePath === "/securityReport" || activePath === "/Revenuereport" || activePath === "/reports/sales" || activePath === "/reports/inventory") {
            return "reports";
        }
        if (activePath === "/BookingReport" || activePath === "/RentOutReport") {
            return "quantity";
        }
        if (activePath.startsWith("/inventory") ||
            activePath.startsWith("/shoe-sales/items") ||
            activePath.startsWith("/shoe-sales/item-groups") ||
            activePath.startsWith("/shoe-sales/inactive")) {
            return "inventory";
        }
        if (activePath.startsWith("/sales")) {
            return "sales";
        }
        if (activePath.startsWith("/purchase")) {
            return "purchase";
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
    const isPurchaseOpen = openSection === "purchase";

    const inventoryLinks = [
        { to: "/shoe-sales/items", label: "Items", Icon: List },
        { to: "/shoe-sales/item-groups", label: "Item Groups", Icon: Layers },
        { to: "/inventory/adjustments", label: "Inventory Adjustments", Icon: SlidersHorizontal },
        { to: "/inventory/transfer-orders", label: "Transfer Orders", Icon: ArrowLeftRight },
        { to: "/inventory/reorder-alerts", label: "Reorder Alerts", Icon: AlertTriangle },
        { to: "/shoe-sales/inactive", label: "Inactive", Icon: FolderClosed }
    ];
    const salesLinks = [
        { to: "/sales/invoices", label: "Invoices", Icon: FileTextIcon },
        { to: "/sales/returns", label: "Invoice Return", Icon: RotateCcw }
    ];
    const isInventoryActive = inventoryLinks.some((link) => link.to === activePath) ||
                               activePath.startsWith("/shoe-sales/items") ||
                               activePath.startsWith("/shoe-sales/item-groups") ||
                               activePath.startsWith("/shoe-sales/inactive");
    const isSalesActive = salesLinks.some((link) => link.to === activePath);
    const purchaseLinks = [
        { to: "/purchase/orders", label: "Purchase Orders", Icon: ClipboardList },
        { to: "/purchase/receives", label: "Purchase Receives", Icon: PackageCheck },
        { to: "/purchase/bills", label: "Bills", Icon: ReceiptText },
        { to: "/purchase/vendor-credits", label: "Purchase Return", Icon: ReceiptText },
        { to: "/purchase/vendors", label: "Vendors", Icon: Users },
    ];
    const isPurchaseActive = purchaseLinks.some((link) => link.to === activePath);

    const isReportsActive = ["/", "/datewisedaybook", "/securityReport", "/Revenuereport", "/reports/sales", "/reports/inventory"].includes(activePath);
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
                                <Link to="/reports/sales" className={subLinkClasses('/reports/sales')}>Sales Report</Link>
                                <Link to="/reports/inventory" className={subLinkClasses('/reports/inventory')}>Inventory Report</Link>
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

                    {(currentuser.power === 'admin' || currentuser.power === 'warehouse') && (
                        <div>
                            <button
                                onClick={() => setOpenSection(isPurchaseOpen ? null : "purchase")}
                                className={groupButtonClasses(isPurchaseActive || isPurchaseOpen)}
                            >
                                <div className="flex w-full items-center gap-3">
                                    <Truck size={18} className="shrink-0" />
                                    <span className="flex-1 text-left">Purchase</span>
                                    <ChevronDown
                                        size={16}
                                        className={`shrink-0 transition-transform ${isPurchaseOpen ? "rotate-180" : "rotate-0"}`}
                                    />
                                </div>
                            </button>
                            {isPurchaseOpen && (
                                <div className="mt-2 space-y-1 border-l border-[#1b233a]/70 pl-3">
                                    {purchaseLinks.map(({ to, label, Icon }) => (
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
                    )}

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









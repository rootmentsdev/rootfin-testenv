import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Printer, Download, PackageCheck, Scan, X, CheckCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import Head from "../components/Head";
import baseUrl from "../api/api";
import { mapLocNameToWarehouse } from "../utils/warehouseMapping";

const TransferOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  
  // Get user info
  const userStr = localStorage.getItem("rootfinuser");
  const user = userStr ? JSON.parse(userStr) : null;
  const userLocCode = user?.locCode || "";
  
  // Fallback locations mapping
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
  
  // Get location name - prioritize locCode lookup over username
  let userLocName = "";
  if (user?.locCode) {
    const location = fallbackLocations.find(loc => loc.locCode === user.locCode || loc.locCode === String(user.locCode));
    if (location) {
      userLocName = location.locName;
    }
  }
  if (!userLocName) {
    userLocName = user?.username || user?.locName || "";
  }
  
  const [transferOrder, setTransferOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPdfView, setShowPdfView] = useState(true);
  const [receiving, setReceiving] = useState(false);
  
  // QR/Barcode scanning state
  const [showScanner, setShowScanner] = useState(false);
  const [scannedItems, setScannedItems] = useState({}); // { itemSku: { count: number, itemName: string, quantity: number } }
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState("");
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const externalScannerInputRef = useRef(null);
  const scannedCodeBufferRef = useRef("");
  const scanTimeoutRef = useRef(null);
  
  
  // Check if current user is the destination warehouse
  const isDestinationWarehouse = () => {
    if (!transferOrder || !userLocName) return false;
    const userWarehouse = mapLocNameToWarehouse(userLocName);
    const destinationWarehouse = transferOrder.destinationWarehouse || "";
    // Case-insensitive comparison
    return userWarehouse.toLowerCase() === destinationWarehouse.toLowerCase() ||
           userLocName.toLowerCase() === destinationWarehouse.toLowerCase();
  };
  
  const canReceive = () => {
    if (!transferOrder || transferOrder.status !== "in_transit" || !isDestinationWarehouse()) {
      return false;
    }
    
    // Check if all items have been scanned
    if (!transferOrder.items || transferOrder.items.length === 0) {
      return false;
    }
    
    // Verify all items are scanned with correct quantities
    for (const item of transferOrder.items) {
      const itemSku = item.itemSku || item.itemId || "";
      const expectedQuantity = parseFloat(item.quantity) || 0;
      const scanned = scannedItems[itemSku];
      
      if (!scanned || scanned.count < expectedQuantity) {
        return false;
      }
    }
    
    return true;
  };
  
  // Handle external scanner input (keyboard wedge devices)
  const handleExternalScannerInput = (e) => {
    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    const char = e.key;
    
    // If Enter key is pressed, process the scanned code
    if (char === "Enter") {
      e.preventDefault();
      const scannedCode = scannedCodeBufferRef.current.trim();
      
      if (scannedCode.length > 0) {
        handleScannedCode(scannedCode);
        scannedCodeBufferRef.current = "";
        // Clear the input field
        if (externalScannerInputRef.current) {
          externalScannerInputRef.current.value = "";
        }
      }
      return;
    }
    
    // Ignore special keys (Shift, Ctrl, Alt, etc.)
    if (char.length > 1) {
      return;
    }
    
    // Append character to buffer
    scannedCodeBufferRef.current += char;
    
    // Set a timeout to reset buffer if no activity (handles slow typing vs fast scanning)
    scanTimeoutRef.current = setTimeout(() => {
      scannedCodeBufferRef.current = "";
    }, 100); // 100ms timeout - scanners are typically faster than this
  };

  // Initialize scanner
  const startScanner = async () => {
    // Open the modal first
    setShowScanner(true);
    setScanError("");
    setScanSuccess("");
    scannedCodeBufferRef.current = "";
    
    // Wait for DOM to update so the modal is visible
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Focus on external scanner input field for keyboard wedge devices
    if (externalScannerInputRef.current) {
      externalScannerInputRef.current.focus();
    }
    
    try {
      // Check if camera permissions are available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        // Stop the stream immediately - we just needed to check permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (permErr) {
        // Camera failed, but external scanner will still work
        if (permErr.name === "NotAllowedError" || permErr.name === "PermissionDeniedError") {
          setScanError("⚠️ Camera permission denied. You can still use an external barcode scanner - see the input field below.");
        } else if (permErr.name === "NotFoundError" || permErr.name === "DevicesNotFoundError") {
          setScanError("⚠️ No camera found. You can still use an external barcode scanner - see the input field below.");
        } else {
          setScanError(`⚠️ Camera access error: ${permErr.message}. You can still use an external barcode scanner - see the input field below.`);
        }
        // Don't return - allow external scanner to work even if camera fails
      }
      
      // Wait a bit more for the DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if the element exists
      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        setScanError("Scanner element not found. Please try again.");
        return;
      }
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      
      // Try back camera first, then fallback to any available camera
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 200, height: 200 },
          },
          (decodedText, decodedResult) => {
            handleScannedCode(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors (they happen frequently)
          }
        );
        // Clear any previous errors if scanner starts successfully
        setScanError("");
      } catch (cameraErr) {
        console.log("Back camera not available, trying any camera...", cameraErr);
        // If back camera fails, try any available camera
        try {
          await html5QrCode.start(
            { facingMode: "user" }, // Use front camera as fallback
            {
              fps: 10,
              qrbox: { width: 200, height: 200 },
            },
            (decodedText, decodedResult) => {
              handleScannedCode(decodedText);
            },
            (errorMessage) => {
              // Ignore scanning errors (they happen frequently)
            }
          );
          // Clear any previous errors if scanner starts successfully
          setScanError("");
        } catch (fallbackErr) {
          console.error("Both cameras failed:", fallbackErr);
          let errorMessage = "⚠️ Camera scanner unavailable. ";
          
          if (fallbackErr.name === "NotAllowedError" || fallbackErr.name === "PermissionDeniedError") {
            errorMessage += "Camera permission denied. ";
          } else if (fallbackErr.name === "NotFoundError" || fallbackErr.name === "DevicesNotFoundError") {
            errorMessage += "No camera found. ";
          } else if (fallbackErr.message) {
            errorMessage += `Camera error: ${fallbackErr.message}. `;
          }
          
          errorMessage += "You can still use an external barcode scanner - see the input field below.";
          setScanError(errorMessage);
          // Keep modal open so user can use external scanner
        }
      }
    } catch (err) {
      console.error("Error starting scanner:", err);
      let errorMessage = "⚠️ Camera scanner unavailable. ";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Camera permission denied. ";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage += "No camera found. ";
      } else if (err.message) {
        errorMessage += `Camera error: ${err.message}. `;
      }
      
      errorMessage += "You can still use an external barcode scanner - see the input field below.";
      setScanError(errorMessage);
      // Keep modal open so user can use external scanner
    }
  };
  
  // Stop scanner
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      
      // Clear external scanner buffer and timeout
      scannedCodeBufferRef.current = "";
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      
      setShowScanner(false);
      setScanError("");
      setScanSuccess("");
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  };
  
  // Handle scanned code
  const handleScannedCode = (scannedCode) => {
    if (!transferOrder || !transferOrder.items) {
      setScanError("No items in transfer order");
      return;
    }
    
    // Find matching item by SKU or itemId
    const matchedItem = transferOrder.items.find(item => {
      const itemSku = (item.itemSku || "").toString().trim();
      const itemId = (item.itemId || "").toString().trim();
      const scannedCodeTrimmed = scannedCode.trim();
      
      return itemSku === scannedCodeTrimmed || 
             itemId === scannedCodeTrimmed ||
             itemSku.toLowerCase() === scannedCodeTrimmed.toLowerCase() ||
             itemId.toLowerCase() === scannedCodeTrimmed.toLowerCase();
    });
    
    if (!matchedItem) {
      setScanError(`Item not found in transfer order: ${scannedCode}`);
      setTimeout(() => setScanError(""), 3000);
      return;
    }
    
    const itemSku = matchedItem.itemSku || matchedItem.itemId || "";
    const expectedQuantity = parseFloat(matchedItem.quantity) || 0;
    const currentScanned = scannedItems[itemSku] || { count: 0, itemName: matchedItem.itemName, quantity: expectedQuantity };
    
    if (currentScanned.count >= expectedQuantity) {
      setScanError(`${matchedItem.itemName} already scanned (${currentScanned.count}/${expectedQuantity})`);
      setTimeout(() => setScanError(""), 3000);
      return;
    }
    
    // Update scanned count
    const newCount = currentScanned.count + 1;
    setScannedItems(prev => ({
      ...prev,
      [itemSku]: {
        ...currentScanned,
        count: newCount
      }
    }));
    
    setScanSuccess(`✅ Scanned: ${matchedItem.itemName} (${newCount}/${expectedQuantity})`);
    setTimeout(() => setScanSuccess(""), 2000);
    
    // Play beep sound (optional)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Ignore audio errors
    }
  };
  
  // Reset scanned items
  const resetScannedItems = () => {
    setScannedItems({});
    setScanError("");
    setScanSuccess("");
  };
  
  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);
  
  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "-";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "-";
    }
  };
  
  // Fetch transfer order
  useEffect(() => {
    const fetchTransferOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/inventory/transfer-orders/${id}`);
        if (!response.ok) throw new Error("Failed to fetch transfer order");
        const data = await response.json();
        setTransferOrder(data);
      } catch (error) {
        console.error("Error fetching transfer order:", error);
        alert("Failed to load transfer order");
        navigate("/inventory/transfer-orders");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTransferOrder();
    }
  }, [id, API_URL, navigate]);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleReceive = async () => {
    if (!canReceive()) {
      alert("You can only receive transfer orders that are in transit and destined to your warehouse.");
      return;
    }
    
    if (!confirm("Are you sure you want to receive this transfer order? This will update the stock in your warehouse.")) {
      return;
    }
    
    setReceiving(true);
    try {
      const response = await fetch(`${API_URL}/api/inventory/transfer-orders/${id}/receive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.email || user?._id || user?.id || "",
          "x-user-name": user?.username || user?.name || user?.email || "",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to receive transfer order");
      }
      
      const data = await response.json();
      
      // Show detailed stock update information
      if (data.stockUpdates && Array.isArray(data.stockUpdates)) {
        const successful = data.stockUpdates.filter(u => u.status === "success");
        const failed = data.stockUpdates.filter(u => u.status !== "success");
        
        let message = "Transfer order received successfully!\n\n";
        message += `Stock updated in ${transferOrder.destinationWarehouse}:\n\n`;
        successful.forEach(update => {
          const stockBefore = update.stockBefore !== undefined ? update.stockBefore : null;
          const stockAfter = update.stockAfter !== undefined ? update.stockAfter : null;
          const received = update.quantity || 0;
          
          if (stockBefore !== null && stockAfter !== null && stockBefore !== undefined && stockAfter !== undefined) {
            message += `✅ ${update.itemName}:\n`;
            message += `   Previous stock: ${stockBefore}\n`;
            message += `   Received: +${received}\n`;
            message += `   New total: ${stockAfter}\n\n`;
          } else {
            message += `✅ ${update.itemName}: +${received} units\n`;
          }
        });
        
        if (failed.length > 0) {
          message += `\n⚠️ Failed to update:\n`;
          failed.forEach(update => {
            const errorMsg = update.error || update.message || "Unknown error";
            message += `❌ ${update.itemName}: ${errorMsg}\n`;
          });
        }
        
        message += `\n📦 Items are now available in your Items page.`;
        
        alert(message);
      } else {
        alert("Transfer order received successfully! Stock has been updated.\n\n📦 Items are now available in your Items page.");
      }
      
      // Stop scanner if active
      if (showScanner) {
        await stopScanner();
      }
      
      // Reset scanned items
      resetScannedItems();
      
      // Refresh the transfer order data
      const refreshResponse = await fetch(`${API_URL}/api/inventory/transfer-orders/${id}`);
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setTransferOrder(refreshedData);
      }
      
      // Dispatch event to refresh items page if it's open
      window.dispatchEvent(new CustomEvent('transferOrderReceived', { 
        detail: { destinationWarehouse: transferOrder.destinationWarehouse } 
      }));
    } catch (error) {
      console.error("Error receiving transfer order:", error);
      alert(`Failed to receive transfer order: ${error.message}`);
    } finally {
      setReceiving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen flex items-center justify-center">
        <div className="text-[#64748b]">Loading transfer order...</div>
      </div>
    );
  }
  
  if (!transferOrder) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748b] mb-4">Transfer order not found</p>
          <Link
            to="/inventory/transfer-orders"
            className="text-[#2563eb] hover:underline"
          >
            Back to Transfer Orders
          </Link>
        </div>
      </div>
    );
  }
  
  const totalQuantity = transferOrder.items?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
  const statusLabel = transferOrder.status === "transferred" ? "Transferred" : transferOrder.status === "in_transit" ? "In Transit" : "Draft";
  
  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      {/* Top Bar with Actions */}
      <div className="mb-4 flex items-center justify-between bg-white rounded-lg border border-[#e2e8f0] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/inventory/transfer-orders"
            className="inline-flex items-center gap-2 rounded-md border border-[#d4dcf4] bg-white px-3 py-1.5 text-sm font-medium text-[#111827] hover:bg-[#f3f4f6]"
          >
            <ArrowLeft size={16} />
          </Link>
          <Link
            to={`/inventory/transfer-orders/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-md border border-[#d4dcf4] bg-white px-3 py-1.5 text-sm font-medium text-[#111827] hover:bg-[#f3f4f6]"
          >
            <Edit size={16} />
            Edit
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-md border border-[#d4dcf4] bg-white px-3 py-1.5 text-sm font-medium text-[#111827] hover:bg-[#f3f4f6]"
          >
            <Printer size={16} />
            PDF/Print
          </button>
          {transferOrder?.status === "in_transit" && isDestinationWarehouse() && (
            <>
              {!showScanner ? (
                <button
                  onClick={startScanner}
                  className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  <Scan size={16} />
                  Start Scanning
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="inline-flex items-center gap-2 rounded-md bg-[#ef4444] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#dc2626]"
                >
                  <X size={16} />
                  Stop Scanner
                </button>
              )}
              <button
                onClick={handleReceive}
                disabled={receiving || !canReceive()}
                className="inline-flex items-center gap-2 rounded-md bg-[#10b981] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PackageCheck size={16} />
                {receiving ? "Receiving..." : canReceive() ? "Receive" : "Scan All Items First"}
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[#4b5563] cursor-pointer">
            <input
              type="checkbox"
              checked={showPdfView}
              onChange={(e) => setShowPdfView(e.target.checked)}
              className="h-4 w-4 rounded border-[#d1d5db] text-[#4f46e5] focus:ring-[#4338ca]"
            />
            Show PDF View
          </label>
          <button className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8]">
            Customize
          </button>
        </div>
      </div>
      
      {/* Document View */}
      {showPdfView && (
        <div className="bg-white rounded-lg shadow-lg border border-[#e2e8f0] overflow-hidden print:shadow-none print:border-0" style={{ maxWidth: '210mm', margin: '0 auto', position: 'relative' }}>
          {/* Status Banner - Diagonal Overlay (Top Left) */}
          {transferOrder.status === "transferred" && (
            <div 
              className="absolute top-0 left-0 bg-[#10b981] text-white px-16 py-2 text-xs font-bold uppercase tracking-wider shadow-lg z-10"
              style={{
                transform: 'rotate(-45deg)',
                transformOrigin: 'top left',
                marginLeft: '-35px',
                marginTop: '25px',
                letterSpacing: '0.1em',
              }}
            >
              {statusLabel}
            </div>
          )}
          {transferOrder.status === "in_transit" && (
            <div 
              className="absolute top-0 left-0 bg-[#3b82f6] text-white px-16 py-2 text-xs font-bold uppercase tracking-wider shadow-lg z-10"
              style={{
                transform: 'rotate(-45deg)',
                transformOrigin: 'top left',
                marginLeft: '-35px',
                marginTop: '25px',
                letterSpacing: '0.1em',
              }}
            >
              {statusLabel}
            </div>
          )}
          
          <div className="p-10 print:p-8" style={{ paddingTop: '60px' }}>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-[#111827] mb-6" style={{ letterSpacing: '0.01em', lineHeight: '1.2' }}>Transfer Order</h1>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-[#374151]">TransferOrder# </span>
                  <span className="text-[#111827]">{transferOrder.transferOrderNumber || "-"}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#374151]">Date </span>
                  <span className="text-[#111827]">{formatDate(transferOrder.date)}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#374151]">Date of Transfer </span>
                  <span className="text-[#111827]">{formatDate(transferOrder.updatedAt)}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#374151]">Created By </span>
                  <span className="text-[#111827]">{transferOrder.createdBy || "-"}</span>
                </div>
              </div>
            </div>
            
            {/* Party Details Section - Three Columns */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              {/* Sender/Originator */}
              <div className="border border-[#d1d5db] rounded p-4 bg-[#fafafa]">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-3">Sender/Originator</h3>
                <div className="space-y-1 text-sm text-[#111827] leading-relaxed">
                  <div className="font-medium">Grooms Wedding Hub</div>
                  <div className="text-[#6b7280]">Kerala</div>
                  <div className="text-[#6b7280]">India</div>
                  <div className="text-[#6b7280] mt-2">GSTIN 32ABCFR1426N1Z9</div>
                  <div className="text-[#6b7280]">7593838709</div>
                  <div className="text-[#6b7280]">rootmentsoffice@gmail.com</div>
                  <div className="text-[#6b7280] mt-2">Place Of Supply: Kerala (32)</div>
                </div>
              </div>
              
              {/* Source Warehouse */}
              <div className="border border-[#d1d5db] rounded p-4 bg-[#fafafa]">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-3">Source Warehouse</h3>
                <div className="space-y-1 text-sm text-[#111827] leading-relaxed">
                  <div className="font-medium">{transferOrder.sourceWarehouse || "-"}</div>
                  <div className="text-[#6b7280]">Kerala</div>
                  <div className="text-[#6b7280]">India</div>
                  <div className="text-[#6b7280] mt-2">GSTIN 32ABCFR1426N1Z9</div>
                  <div className="text-[#6b7280]">7593838709</div>
                </div>
              </div>
              
              {/* Destination Warehouse */}
              <div className="border border-[#d1d5db] rounded p-4 bg-[#fafafa]">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-3">Destination Warehouse</h3>
                <div className="space-y-1 text-sm text-[#111827] leading-relaxed">
                  <div className="font-medium">{transferOrder.destinationWarehouse || "-"}</div>
                  <div className="text-[#6b7280]">Kerala</div>
                  <div className="text-[#6b7280]">India</div>
                  <div className="text-[#6b7280] mt-2">GSTIN 32ABCFR1426N1Z9</div>
                  <div className="text-[#6b7280]">7593838709</div>
                </div>
              </div>
            </div>
            
            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-[#d1d5db]">
                <thead>
                  <tr className="bg-[#f9fafb]">
                    <th className="border border-[#d1d5db] px-4 py-3 text-left text-xs font-semibold text-[#374151]">#</th>
                    <th className="border border-[#d1d5db] px-4 py-3 text-left text-xs font-semibold text-[#374151]">Item & Description</th>
                    <th className="border border-[#d1d5db] px-4 py-3 text-left text-xs font-semibold text-[#374151]">HSN/SAC</th>
                    <th className="border border-[#d1d5db] px-4 py-3 text-right text-xs font-semibold text-[#374151]">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {transferOrder.items && transferOrder.items.length > 0 ? (
                    transferOrder.items.map((item, index) => (
                      <tr key={index} className="hover:bg-[#f9fafb]">
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-[#111827]">{index + 1}</td>
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-[#111827]">
                          <div className="font-medium">{item.itemName || "-"}</div>
                          {item.itemSku && (
                            <div className="text-xs text-[#6b7280] mt-1">SKU: {item.itemSku}</div>
                          )}
                        </td>
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-[#6b7280]">61051010</td>
                        <td className="border border-[#d1d5db] px-4 py-3 text-sm text-right text-[#111827] font-medium">
                          {parseFloat(item.quantity || 0).toFixed(2)} pcs
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="border border-[#d1d5db] px-4 py-8 text-center text-sm text-[#6b7280]">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f9fafb]">
                    <td colSpan="3" className="border border-[#d1d5db] px-4 py-3 text-right text-sm font-semibold text-[#374151]">
                      Total quantity
                    </td>
                    <td className="border border-[#d1d5db] px-4 py-3 text-right text-sm font-bold text-[#111827]">
                      {totalQuantity.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* Footer Section */}
            <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-[#d1d5db]">
              <div>
                <div className="mb-1">
                  <span className="text-sm font-semibold text-[#374151]">Reason </span>
                  <span className="text-sm text-[#111827]">{transferOrder.reason || "-"}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-[#374151] mb-2">Authorized Signature</div>
                  <div className="border-b-2 border-[#111827] w-48 ml-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Non-PDF View (if toggle is off) */}
      {!showPdfView && (
        <div className="bg-white rounded-lg shadow-lg border border-[#e2e8f0] p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#1e293b]">
                Transfer Order: {transferOrder.transferOrderNumber}
              </h1>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                transferOrder.status === "transferred"
                  ? "bg-[#ecfdf5] text-[#047857]"
                  : transferOrder.status === "in_transit"
                  ? "bg-[#dbeafe] text-[#1e40af]"
                  : "bg-[#f3f4f6] text-[#6b7280]"
              }`}>
                {statusLabel}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Date: </span>
              <span className="text-sm text-[#1e293b]">{formatDate(transferOrder.date)}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Created By: </span>
              <span className="text-sm text-[#1e293b]">{transferOrder.createdBy || "-"}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Source Warehouse: </span>
              <span className="text-sm text-[#1e293b]">{transferOrder.sourceWarehouse || "-"}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-[#64748b]">Destination Warehouse: </span>
              <span className="text-sm text-[#1e293b]">{transferOrder.destinationWarehouse || "-"}</span>
            </div>
          </div>
          
          {/* Scanning Progress Section */}
          {transferOrder?.status === "in_transit" && isDestinationWarehouse() && (
            <div className="mb-6 p-4 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#0369a1]">Scanning Progress</h3>
                <button
                  onClick={resetScannedItems}
                  className="text-xs text-[#0369a1] hover:text-[#075985] underline"
                >
                  Reset
                </button>
              </div>
              <div className="space-y-2">
                {transferOrder.items?.map((item, index) => {
                  const itemSku = item.itemSku || item.itemId || "";
                  const expectedQuantity = parseFloat(item.quantity) || 0;
                  const scanned = scannedItems[itemSku];
                  const scannedCount = scanned?.count || 0;
                  const isComplete = scannedCount >= expectedQuantity;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-[#bae6fd]">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1e293b]">{item.itemName || "-"}</div>
                        <div className="text-xs text-[#64748b]">SKU: {itemSku || "N/A"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-[#1e293b]">
                          <span className={isComplete ? "text-[#10b981] font-semibold" : "text-[#64748b]"}>
                            {scannedCount}
                          </span>
                          <span className="text-[#64748b]"> / {expectedQuantity}</span>
                        </div>
                        {isComplete ? (
                          <CheckCircle size={20} className="text-[#10b981]" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-[#94a3b8] rounded-full" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {scanSuccess && (
                <div className="mt-3 p-2 bg-[#d1fae5] border border-[#10b981] rounded text-sm text-[#047857]">
                  {scanSuccess}
                </div>
              )}
              {scanError && (
                <div className="mt-3 p-2 bg-[#fee2e2] border border-[#ef4444] rounded text-sm text-[#dc2626]">
                  {scanError}
                </div>
              )}
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#64748b] mb-3">Items</h3>
            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b]">Item</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b]">Quantity</th>
                    {transferOrder?.status === "in_transit" && isDestinationWarehouse() && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#64748b]">Scanned</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {transferOrder.items?.map((item, index) => {
                    const itemSku = item.itemSku || item.itemId || "";
                    const scanned = scannedItems[itemSku];
                    const scannedCount = scanned?.count || 0;
                    const expectedQuantity = parseFloat(item.quantity) || 0;
                    const isComplete = scannedCount >= expectedQuantity;
                    
                    return (
                    <tr key={index} className="border-t border-[#e2e8f0]">
                        <td className="px-4 py-3 text-sm text-[#1e293b]">
                          <div>{item.itemName || "-"}</div>
                          {item.itemSku && (
                            <div className="text-xs text-[#64748b]">SKU: {item.itemSku}</div>
                          )}
                        </td>
                      <td className="px-4 py-3 text-sm text-right text-[#1e293b]">
                          {expectedQuantity.toFixed(2)} pcs
                        </td>
                        {transferOrder?.status === "in_transit" && isDestinationWarehouse() && (
                          <td className="px-4 py-3 text-sm text-center">
                            {isComplete ? (
                              <CheckCircle size={20} className="text-[#10b981] mx-auto" />
                            ) : (
                              <span className="text-[#64748b]">{scannedCount}/{expectedQuantity}</span>
                            )}
                      </td>
                        )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {transferOrder.reason && (
            <div className="mb-4">
              <span className="text-sm font-semibold text-[#64748b]">Reason: </span>
              <span className="text-sm text-[#1e293b]">{transferOrder.reason}</span>
            </div>
          )}
        </div>
      )}
      
      {/* QR/Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-[#1e293b]">Scan Items</h2>
                <button
                  onClick={stopScanner}
                  className="text-[#64748b] hover:text-[#1e293b]"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Compact Camera Section */}
              <div className="mb-3">
                <div id="qr-reader" className="w-full mb-3" style={{ maxHeight: '200px', overflow: 'hidden' }}></div>
                
                {/* External Scanner Input Field - Compact */}
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">
                    External Scanner:
                  </label>
                  <input
                    ref={externalScannerInputRef}
                    type="text"
                    inputMode="none"
                    onKeyDown={handleExternalScannerInput}
                    placeholder="Click & scan with external scanner..."
                    className="w-full px-3 py-2 text-sm border border-[#d1d5db] rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none text-[#1e293b]"
                    autoFocus
                  />
                </div>
              </div>
              
              {scanSuccess && (
                <div className="mb-2 p-2 bg-[#d1fae5] border border-[#10b981] rounded text-xs text-[#047857]">
                  {scanSuccess}
                </div>
              )}
              
              {scanError && (
                <div className="mb-2 p-2 bg-[#fef3c7] border border-[#f59e0b] rounded text-xs text-[#92400e]">
                  <div className="font-semibold">{scanError}</div>
                  {scanError.includes("permission") && (
                    <button
                      onClick={startScanner}
                      className="mt-2 px-3 py-1 bg-[#2563eb] text-white rounded text-xs hover:bg-[#1d4ed8]"
                    >
                      Try Camera Again
                    </button>
                  )}
                </div>
              )}
              
              {/* Compact Scanning Progress */}
              <div className="mt-3">
                <h3 className="text-xs font-semibold text-[#64748b] mb-1.5">Progress</h3>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {transferOrder?.items?.map((item, index) => {
                    const itemSku = item.itemSku || item.itemId || "";
                    const expectedQuantity = parseFloat(item.quantity) || 0;
                    const scanned = scannedItems[itemSku];
                    const scannedCount = scanned?.count || 0;
                    const isComplete = scannedCount >= expectedQuantity;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-1.5 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#1e293b] truncate">{item.itemName || "-"}</div>
                          <div className="text-xs text-[#64748b]">SKU: {itemSku || "N/A"}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="text-xs text-[#1e293b] whitespace-nowrap">
                            <span className={isComplete ? "text-[#10b981] font-semibold" : "text-[#64748b]"}>
                              {scannedCount}
                            </span>
                            <span className="text-[#64748b]">/{expectedQuantity}</span>
                          </div>
                          {isComplete ? (
                            <CheckCircle size={16} className="text-[#10b981] flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-[#94a3b8] rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={resetScannedItems}
                  className="px-3 py-1.5 text-xs font-medium text-[#64748b] hover:text-[#1e293b]"
                >
                  Reset
                </button>
                <button
                  onClick={stopScanner}
                  className="px-3 py-1.5 text-xs font-medium bg-[#2563eb] text-white rounded-md hover:bg-[#1d4ed8]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferOrderView;

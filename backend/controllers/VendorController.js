import Vendor from "../model/Vendor.js";
import VendorHistory from "../model/VendorHistory.js";
import { logVendorActivity, getOriginatorName } from "../utils/vendorHistoryLogger.js";

// Create a new vendor
export const createVendor = async (req, res) => {
  try {
    const vendorData = req.body;

    // Validate required fields
    if (!vendorData.displayName || !vendorData.userId) {
      return res.status(400).json({ message: "Display name and userId are required" });
    }

    // Ensure contacts and bankAccounts are arrays
    if (vendorData.contacts && !Array.isArray(vendorData.contacts)) {
      vendorData.contacts = [];
    }
    if (vendorData.bankAccounts && !Array.isArray(vendorData.bankAccounts)) {
      vendorData.bankAccounts = [];
    }

    const vendor = await Vendor.create(vendorData);

    // Log vendor creation activity
    if (vendor._id) {
      const originator = getOriginatorName(
        null,
        null,
        { locName: vendorData.locCode || "" }
      );

      let description = "Contact created";
      if (vendorData.gstTreatment || vendorData.gstin) {
        const gstTreatment = vendorData.gstTreatment || "";
        const gstin = vendorData.gstin || "";
        const state = vendorData.sourceOfSupply || "";
        description = `Contact created with GST Treatment '${gstTreatment}'${gstin ? ` & GSTIN '${gstin}'` : ""}${state ? `. State updated to ${state}.` : "."} by ${originator}`;
      } else {
        description = `Contact created by ${originator}`;
      }

      await logVendorActivity({
        vendorId: vendor._id.toString(),
        eventType: "CONTACT_ADDED",
        title: "Contact added",
        description: description,
        originator: originator,
        relatedEntityId: vendor._id.toString(),
        relatedEntityType: "vendor",
        metadata: {
          gstTreatment: vendorData.gstTreatment,
          gstin: vendorData.gstin,
          sourceOfSupply: vendorData.sourceOfSupply,
        },
        changedBy: vendorData.userId || "",
      });

      // Log contact person addition if contacts exist
      if (vendorData.contacts && Array.isArray(vendorData.contacts) && vendorData.contacts.length > 0) {
        for (const contact of vendorData.contacts) {
          if (contact.email) {
            await logVendorActivity({
              vendorId: vendor._id.toString(),
              eventType: "CONTACT_PERSON_ADDED",
              title: "Contact person added",
              description: `Contact person ${contact.email} has been created by ${originator}`,
              originator: originator,
              relatedEntityId: vendor._id.toString(),
              relatedEntityType: "contact_person",
              metadata: {
                email: contact.email,
                firstName: contact.firstName,
                lastName: contact.lastName,
              },
              changedBy: vendorData.userId || "",
            });
          }
        }
      }
    }

    res.status(201).json(vendor);
  } catch (error) {
    console.error("Create vendor error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Vendor already exists" });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all vendors for a user
export const getVendors = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const vendors = await Vendor.find({ userId }).sort({ displayName: 1 });

    res.status(200).json(vendors);
  } catch (error) {
    console.error("Get vendors error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get vendor by ID
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json(vendor);
  } catch (error) {
    console.error("Get vendor by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update vendor
export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Ensure contacts and bankAccounts are arrays if provided
    if (updateData.contacts && !Array.isArray(updateData.contacts)) {
      updateData.contacts = [];
    }
    if (updateData.bankAccounts && !Array.isArray(updateData.bankAccounts)) {
      updateData.bankAccounts = [];
    }

    const vendor = await Vendor.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Log vendor update activity
    const originator = getOriginatorName(
      null,
      null,
      { locName: updateData.locCode || "" }
    );

    await logVendorActivity({
      vendorId: vendor._id.toString(),
      eventType: "VENDOR_UPDATED",
      title: "Contact updated",
      description: `Contact updated by ${originator}`,
      originator: originator,
      relatedEntityId: vendor._id.toString(),
      relatedEntityType: "vendor",
      metadata: updateData,
      changedBy: updateData.userId || "",
    });

    res.status(200).json(vendor);
  } catch (error) {
    console.error("Update vendor error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Vendor already exists" });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete vendor
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findByIdAndDelete(id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Delete vendor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get vendor history
export const getVendorHistory = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const history = await VendorHistory.find({ vendorId })
      .sort({ changedAt: -1 })
      .limit(100);

    res.status(200).json(history);
  } catch (error) {
    console.error("Get vendor history error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
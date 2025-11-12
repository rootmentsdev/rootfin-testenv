import ItemGroup from "../model/ItemGroup.js";

export const createItemGroup = async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ message: "Item group name is required." });
    }

    // Ensure items array is properly formatted
    const items = Array.isArray(req.body.items) 
      ? req.body.items.filter(item => item && item.name && item.name.trim() !== "")
      : [];

    console.log("Creating item group with items:", items.length, items);

    const payload = {
      ...req.body,
      name: req.body.name.trim(),
      items: items,
      stock: req.body.stock || 0,
      attributeRows: req.body.attributeRows || [],
    };

    const itemGroup = await ItemGroup.create(payload);
    console.log("Item group created with items count:", itemGroup.items ? itemGroup.items.length : 0);
    return res.status(201).json(itemGroup);
  } catch (error) {
    console.error("Error creating item group:", error);
    
    // Return more detailed error message
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: errors 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to create item group.",
      error: error.message 
    });
  }
};

export const getItemGroups = async (_req, res) => {
  try {
    const groups = await ItemGroup.find().sort({ createdAt: -1 });
    
    // Transform data to match frontend format
    const formattedGroups = groups.map(group => {
      const groupObj = group.toObject();
      
      // Get items array - ensure it's an array
      const itemsArray = Array.isArray(groupObj.items) ? groupObj.items : [];
      
      // Calculate total stock from all items
      const totalStock = itemsArray.reduce((sum, item) => {
        const itemStock = typeof item.stock === 'number' ? item.stock : 0;
        return sum + itemStock;
      }, 0);
      
      // Get item count
      const itemCount = itemsArray.length;
      
      console.log(`Item Group "${groupObj.name}": ${itemCount} items`);
      
      return {
        id: groupObj._id,
        name: groupObj.name,
        items: itemCount,
        sku: groupObj.sku || "",
        stock: totalStock.toFixed(2),
        reorder: groupObj.reorder || "",
        // Only include primitive fields, exclude nested objects/arrays
        itemType: groupObj.itemType,
        unit: groupObj.unit,
        manufacturer: groupObj.manufacturer,
        brand: groupObj.brand,
        createdAt: groupObj.createdAt,
        updatedAt: groupObj.updatedAt,
      };
    });
    
    return res.json(formattedGroups);
  } catch (error) {
    console.error("Error fetching item groups:", error);
    return res.status(500).json({ message: "Failed to fetch item groups." });
  }
};

export const getItemGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const itemGroup = await ItemGroup.findById(id);
    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    return res.json(itemGroup);
  } catch (error) {
    console.error("Error fetching item group:", error);
    return res.status(500).json({ message: "Failed to fetch item group." });
  }
};

export const updateItemGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const itemGroup = await ItemGroup.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    return res.json(itemGroup);
  } catch (error) {
    console.error("Error updating item group:", error);
    return res.status(500).json({ message: "Failed to update item group." });
  }
};

export const deleteItemGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const itemGroup = await ItemGroup.findByIdAndDelete(id);
    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    return res.json({ message: "Item group deleted successfully." });
  } catch (error) {
    console.error("Error deleting item group:", error);
    return res.status(500).json({ message: "Failed to delete item group." });
  }
};


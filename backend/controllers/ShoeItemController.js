import ShoeItem from "../model/ShoeItem.js";

const sanitizeWords = (text = "") =>
  text
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-_,]+/)
    .filter(Boolean);

const buildSkuBase = (name = "") => {
  const words = sanitizeWords(name);
  if (words.length === 0) {
    return "ITEM";
  }

  const alphaWords = words.filter((word) => /[A-Za-z]/.test(word));
  const numericWords = words.filter((word) => /^\d+$/.test(word));

  let letters = alphaWords.map((word) => word[0].toUpperCase()).join("");

  if (!letters && alphaWords.length > 0) {
    letters = alphaWords[0].slice(0, 3).toUpperCase();
  }

  if (!letters) {
    letters = words[0].slice(0, 3).toUpperCase();
  }

  let base = letters || "ITEM";
  const digits = numericWords.join("");
  if (digits) {
    base += `-${digits}`;
  }

  return base;
};

const generateUniqueSku = async (name = "") => {
  const base = buildSkuBase(name);
  let sku = base;
  let counter = 1;

  // Ensure uniqueness
  while (await ShoeItem.exists({ sku })) {
    const suffix = String(counter).padStart(2, "0");
    sku = `${base}-${suffix}`;
    counter += 1;
  }

  return sku;
};

export const createShoeItem = async (req, res) => {
  try {
    if (!req.body.itemName || req.body.itemName.trim() === "") {
      return res.status(400).json({ message: "Item name is required." });
    }

    let incomingSku = req.body.sku?.toString().trim().toUpperCase();
    if (incomingSku) {
      const existing = await ShoeItem.exists({ sku: incomingSku });
      if (existing) {
        incomingSku = await generateUniqueSku(req.body.itemName);
      }
    } else {
      incomingSku = await generateUniqueSku(req.body.itemName);
    }

    const payload = {
      ...req.body,
      itemName: req.body.itemName.trim(),
      sku: incomingSku,
      sellingPrice: req.body.sellingPrice ? Number(req.body.sellingPrice) : 0,
      costPrice: req.body.costPrice ? Number(req.body.costPrice) : 0,
    };

    const item = await ShoeItem.create(payload);
    return res.status(201).json(item);
  } catch (error) {
    console.error("Error creating shoe item:", error);
    return res.status(500).json({ message: "Failed to create shoe item." });
  }
};

export const getShoeItems = async (_req, res) => {
  try {
    const items = await ShoeItem.find().sort({ createdAt: -1 });
    return res.json(items);
  } catch (error) {
    console.error("Error fetching shoe items:", error);
    return res.status(500).json({ message: "Failed to fetch shoe items." });
  }
};

export const getShoeItemById = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    const item = await ShoeItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    return res.json(item);
  } catch (error) {
    console.error("Error fetching shoe item:", error);
    return res.status(500).json({ message: "Failed to fetch shoe item." });
  }
};


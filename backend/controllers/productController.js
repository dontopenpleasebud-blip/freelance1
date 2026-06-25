const Product = require("../models/Product");
const categoryDefaults = {
  Milk: "/uploads/defaults/Milk.jpg",
  Curd: "/uploads/defaults/Curd.jpg",
  Butter: "/uploads/defaults/Butter.jpg",
  Ghee: "/uploads/defaults/Ghee.jpg",
  Paneer: "/uploads/defaults/Paneer.jpg",
  Cheese: "/uploads/defaults/Cheese.jpg",
  Cream: "/uploads/defaults/Cream.jpg",
  Lassi: "/uploads/defaults/Lassi.jpg",
  "Flavoured Milk": "/uploads/defaults/Flavoured-Milk.jpg",
  "Ice Cream": "/uploads/defaults/Ice-Cream.jpg",
  Sweets: "/uploads/defaults/Sweets.jpg",
  Spices: "/uploads/defaults/Spices.jpg",
};

// @desc    Get all products
// @route   GET /api/products/
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sortBy,
      order = "asc",
      page = 1,
      limit = 20,
      productType,
    } = req.query;

    const filter = {};

    // Product Type filter
    if (productType) {
      if (productType === "retail") {
        filter.$or = [
          { productType: "retail" },
          { productType: { $exists: false } },
        ];
      } else {
        filter.productType = productType;
      }
    }

    // Search by name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Sorting
    let sort = {};

    switch (sortBy) {
      case "price":
        sort.price = order === "desc" ? -1 : 1;
        break;

      case "name":
        sort.name = order === "desc" ? -1 : 1;
        break;

      case "serialNumber":
        sort.serialNumber = order === "desc" ? -1 : 1;
        break;

      case "newest":
        sort.createdAt = -1;
        break;

      case "oldest":
        sort.createdAt = 1;
        break;

      default:
        sort.createdAt = -1;
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    const productsWithImages = products.map((product) => {
      const productObj = product.toObject();
      return {
        ...productObj,
        image:
          productObj.image ||
          categoryDefaults[productObj.category] ||
          "/uploads/defaults/logo.jpg",
      };
    });

    res.json({
      products: productsWithImages,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const productObj = product.toObject();
    productObj.image =
      productObj.image ||
      categoryDefaults[productObj.category] ||
      "/uploads/defaults/logo.jpg";
    res.json(productObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new product
// @route   POST /api/products/
const createProduct = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    const {
      name,
      serialNumber,
      price,
      description,
      category,
      productType,
      stock,
    } = req.body;
    const image = req.file ? `/uploads/products/${req.file.filename}` : null;
    if (!name || !serialNumber || price === undefined || !category || stock === undefined) {
      return res.status(400).json({
        message: "Name, serial number, category, price and stock are required",
      });
    }
    const existingProduct = await Product.findOne({ serialNumber });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Product with this serial number already exists" });
    }
    const product = new Product({
      name,
      serialNumber,
      price,
      description: description || "",
      category,
      image,
      productType: productType || "retail",
      stock,
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      serialNumber,
      price,
      description,
      category,
      productType,
      stock,
    } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (price !== undefined) product.price = price;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (name) product.name = name;
    if (productType !== undefined) product.productType = productType;
    if (stock !== undefined) product.stock = stock;
    if (serialNumber) {
      const existingProduct = await Product.findOne({
        serialNumber,
        _id: { $ne: req.params.id },
      });
      if (existingProduct) {
        return res.status(400).json({
          message: "Another product with this serial number already exists",
        });
      }
      product.serialNumber = serialNumber;
    }
    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    }
    await product.save();
    const productObj = product.toObject();

    productObj.image =
      productObj.image ||
      categoryDefaults[productObj.category] ||
      "/uploads/defaults/logo.jpg";
    res.json(productObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.deleteOne();
    res.json({ message: `${product.name} deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const categoryPrefixes = {
  Milk: "MILK",
  Cheese: "CHS",
  Butter: "BTR",
  Yogurt: "YGT",
  Ghee: "GHEE",
  Paneer: "PANR",
  Cream: "CRM",
  Lassi: "LSI",
  "Flavoured Milk": "FLV",
  "Ice Cream": "ICE",
};

// @desc    Get next serial number for a category
// @route   GET /api/products/next-serial
const getNextSerialNumber = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res
        .status(400)
        .json({ message: "Category query parameter is required" });
    }

    const prefix =
      categoryPrefixes[category] || category.substring(0, 3).toUpperCase();

    // Find all products in this category
    const products = await Product.find({ category }).select("serialNumber");

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}(\\d+)$`, "i");

    products.forEach((prod) => {
      if (prod.serialNumber) {
        const match = prod.serialNumber.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    const nextSerial = `${prefix}${nextNum.toString().padStart(2, "0")}`;

    res.json({ nextSerial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getNextSerialNumber,
};

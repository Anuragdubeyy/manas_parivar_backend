const User = require("../model/User");
const UserProductCount = require("../model/UserProductCount");
const Product = require("../model/product");
const ProductCount = require("../model/ProductCount");

// ✅ ADMIN: Add new product
exports.addProduct = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Product name required" });

    const product = await Product.create({ name });
    res.status(201).json(product);
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN + USER: Get all products with total count
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    // Aggregate total counts per product
    const counts = await ProductCount.aggregate([
      { $group: { _id: "$product", totalCount: { $sum: "$count" } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.totalCount;
    });

    const response = products.map((p) => ({
      ...p.toObject(),
      totalCount: countMap[p._id.toString()] || 0,
    }));

    res.status(200).json(response);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: err.message });
  }
};

// ✅ USER: Add to product count (accumulative)
exports.addProductCount = async (req, res) => {
  try {
    const { productId, count } = req.body;
    const userId = req.user._id;

    if (!productId || typeof count !== "number" || count <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Find existing user record
    let record = await ProductCount.findOne({ user: userId, product: productId });

    if (record) {
      record.count += count; // ✅ add to existing
      await record.save();
    } else {
      record = await ProductCount.create({
        user: userId,
        product: productId,
        count,
      });
    }

    res.status(200).json({ message: "Count updated successfully", record });
  } catch (err) {
    console.error("Error adding count:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN: Get all users and counts for a specific product
exports.getProductCounts = async (req, res) => {
  try {
    const { productId } = req.params;
    const counts = await ProductCount.find({ product: productId })
      .populate("user", "name email")
      .populate("product", "name");

    const totalCount = counts.reduce((sum, c) => sum + c.count, 0);

    res.status(200).json({
      productId,
      totalCount,
      userCounts: counts,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching counts", error: err.message });
  }
};

// ✅ USER: Get own counts (only user’s data)
exports.getMyCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const counts = await ProductCount.find({ user: userId }).populate("product", "name");
    res.json(counts);
  } catch (err) {
    console.error("Error fetching counts:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getAllUsersWithCounts = async (req, res) => {
   try {
    const users = await User.find({ role: "user" }).select("-password");

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        // Get all counts for this user
        const counts = await ProductCount.find({ user: user._id }).populate("product", "name");

        // Calculate per-product totals
        const products = counts.map((item) => ({
          productId: item.product._id,
          productName: item.product.name,
          count: item.count,
        }));

        // Calculate total count for this user
        const totalUserCount = counts.reduce((sum, item) => sum + item.count, 0);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          isBlocked: user.isBlocked,
          role: user.role,
          products,
          totalUserCount,
        };
      })
    );

    res.json(usersWithCounts);
  } catch (error) {
    console.error("Error fetching users with counts:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.addUserProductCount = async (req, res) => {
  try {
    const { productId, count } = req.body;
    const userId = req.user.id;

    let record = await UserProductCount.findOne({ user: userId, product: productId });

    if (record) {
      record.count += Number(count);
      await record.save();
    } else {
      record = await UserProductCount.create({
        user: userId,
        product: productId,
        count,
      });
    }

    res.json({ message: "Product count updated", record });
  } catch (err) {
    console.error("Error adding user product count:", err);
    res.status(500).json({ message: "Server error" });
  }
};
const Card = require("../model/listing");
const cloudinary = require("../config/cloudinary");

// Simple in-memory cache for listings
let listingsCache = null;
let listingsCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const invalidateCache = () => {
    listingsCache = null;
    listingsCacheTime = 0;
};

// Helper function to upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = "project1_venues") => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET) {
            return reject(new Error("Cloudinary credentials are not configured in server environment variables."));
        }

        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

// GET all listings (optimized with lean + cache)
exports.getAllListings = async (req, res) => {
    try {
        const now = Date.now();
        if (listingsCache && (now - listingsCacheTime < CACHE_TTL_MS)) {
            return res.json(listingsCache);
        }

        const cards = await Card.find()
            .select("tittle price img country location avgRating owner")
            .lean();

        listingsCache = cards;
        listingsCacheTime = now;

        res.json(cards);
    } catch (err) {
        console.error("Get listings error:", err);
        res.status(500).json({ message: "Error fetching listings", error: err.message });
    }
};

// GET single listing (optimized with lean)
exports.getListingById = async (req, res) => {
    try {
        const { id } = req.params;

        const card = await Card.findById(id).populate("owner").lean();
        if (!card) {
            return res.status(404).json({ message: "Listing not found" });
        }
        res.json(card);
    } catch (err) {
        console.error("Get listing error:", err);
        res.status(500).json({ message: "Error fetching listing", error: err.message });
    }
};

// CREATE listing
exports.createListing = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Only owner allowed" });
        }

        let { title, description, image, price, country, location } = req.body;

        // If an image file was uploaded via multipart/form-data
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            image = uploadResult.secure_url;
        }

        if (!image) {
            image = "https://media.istockphoto.com/id/1324356458/vector/picture-icon-photo-frame-symbol.jpg";
        }

        const newCard = await Card.create({
            img: image,
            tittle: title,
            description,
            price: price !== undefined ? Number(price) : 0,
            country,
            location,
            review: [],
            owner: req.user.id
        });

        invalidateCache();

        res.status(201).json(newCard);
    } catch (err) {
        console.error("Create listing error:", err);
        res.status(500).json({ message: err.message || "Error creating listing" });
    }
};

// UPDATE listing
exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;

        const card = await Card.findById(id);
        if (!card) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (card.owner && card.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not allowed to edit this listing" });
        }

        let imageUrl = req.body.image || req.body.img || card.img;

        // If a new image file was uploaded
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            imageUrl = uploadResult.secure_url;
        }

        const updatedListing = {
            tittle: req.body.title || req.body.tittle || card.tittle,
            description: req.body.description || card.description,
            img: imageUrl,
            price: req.body.price !== undefined ? Number(req.body.price) : card.price,
            country: req.body.country || card.country,
            location: req.body.location || card.location
        };

        const updated = await Card.findByIdAndUpdate(id, updatedListing, { returnDocument: 'after' });

        invalidateCache();

        res.json(updated);
    } catch (err) {
        console.error("Update listing error:", err);
        res.status(500).json({ message: err.message || "Error updating listing" });
    }
};

// DELETE listing
exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;

        const card = await Card.findById(id);
        if (!card) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (card.owner && card.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not allowed" });
        }

        await Card.findByIdAndDelete(id);

        invalidateCache();

        res.json({ message: "Deleted successfully" });
    } catch (err) {
        console.error("Delete listing error:", err);
        res.status(500).json({ message: "Error deleting listing", error: err.message });
    }
};
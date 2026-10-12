const Booking = require("../model/booking");
const Card = require("../model/listing");
const { Types } = require("mongoose");

// CREATE booking
exports.createBooking = async (req, res) => {
    try {
        const { username, contact, datein, dateout, listingId } = req.body;

        if (!datein || !dateout || !listingId) {
            return res.status(400).json({ message: "Check-in date, check-out date, and venue are required" });
        }

        const newIn = new Date(datein);
        const newOut = new Date(dateout);

        if (isNaN(newIn.getTime()) || isNaN(newOut.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        if (newIn >= newOut) {
            return res.status(400).json({ message: "Check-out date must be after check-in date" });
        }

        // Check if check-in is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (newIn < today) {
            return res.status(400).json({ message: "Check-in date cannot be in the past" });
        }

        // Verify listing exists
        const listing = await Card.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: "Venue listing not found" });
        }

        // Prevent double booking / overlapping dates on the same venue
        // Overlap occurs if existing.datein < newOut AND existing.dateout > newIn
        const conflict = await Booking.findOne({
            listingsdetails: listingId,
            datein: { $lt: newOut },
            dateout: { $gt: newIn }
        });

        if (conflict) {
            return res.status(400).json({
                message: "Selected dates are already booked for this venue. Please select different dates."
            });
        }

        const booking = new Booking({
            username: username || req.user.username || "Guest",
            contact,
            datein: newIn,
            dateout: newOut,
            listingsdetails: listingId,
            user: req.user.id
        });

        await booking.save();

        res.status(201).json({ message: "Booking confirmed successfully", booking });
    } catch (err) {
        console.error("Create booking error:", err);
        res.status(500).json({ message: "Error creating booking", error: err.message });
    }
};

// GET bookings (optimized with lean)
exports.getBookings = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        const listing = await Card.findById(id).lean();
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        let query = { listingsdetails: id };

        // Always filter by user if provided
        if (userId) {
            query.user = userId;
        }

        const bookings = await Booking.find(query)
            .populate("user", "name username email contactno")
            .lean();

        res.json(bookings);
    } catch (err) {
        console.error("Get bookings error:", err);
        res.status(500).json({ message: "Error fetching bookings", error: err.message });
    }
};

// GET booked dates (optimized with lean)
exports.getBookedDates = async (req, res) => {
    try {
        const bookings = await Booking.find({
            listingsdetails: req.params.id
        })
        .select("datein dateout")
        .lean();

        const dates = bookings.map(b => ({
            datein: b.datein,
            dateout: b.dateout
        }));

        res.json(dates);
    } catch (err) {
        console.error("Get booked dates error:", err);
        res.status(500).json({ message: "Error fetching booked dates", error: err.message });
    }
};

// DELETE booking
exports.deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const listing = await Card.findById(booking.listingsdetails).lean();

        const isBookingUser = booking.user && booking.user.toString() === req.user.id;
        const isListingOwner = listing && listing.owner && listing.owner.toString() === req.user.id;

        if (!isBookingUser && !isListingOwner) {
            return res.status(403).json({ message: "Not allowed to cancel this booking" });
        }

        await Booking.findByIdAndDelete(bookingId);

        res.json({ message: "Booking cancelled" });
    } catch (err) {
        console.error("Delete booking error:", err);
        res.status(500).json({ message: "Error deleting booking", error: err.message });
    }
};
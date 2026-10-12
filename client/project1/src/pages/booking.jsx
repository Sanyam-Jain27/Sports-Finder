import { useState, useEffect } from "react";
import api from "../api";
import DatePicker from "react-datepicker";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Pre-fill username and contact from logged in user profile
  const [formData, setFormData] = useState({
    username: user?.username || user?.name || "",
    contact: user?.contactno || ""
  });

  const [listing, setListing] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  useEffect(() => {
    // Fetch booked dates for exclusion
    api
      .get(`/booking/dates/${id}`)
      .then((res) => {
        const dates = [];
        res.data.forEach((b) => {
          let start = new Date(b.datein);
          let end = new Date(b.dateout);

          while (start <= end) {
            dates.push(new Date(start));
            start.setDate(start.getDate() + 1);
          }
        });
        setBookedDates(dates);
      })
      .catch((err) => console.error("Error fetching booked dates:", err));

    // Fetch listing info for price & details
    api
      .get(`/airbnb/full-view/${id}`)
      .then((res) => {
        setListing(res.data);
      })
      .catch((err) => console.error("Error fetching listing:", err));
  }, [id]);

  // Handle date selection with overlap validation
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    if (start && end) {
      // Check if any booked date falls inside the selected range
      const overlaps = bookedDates.some((bDate) => {
        const d = new Date(bDate);
        return d >= start && d <= end;
      });

      if (overlaps) {
        toast.error("Selected range overlaps with already booked dates!");
        setStartDate(start);
        setEndDate(null);
        return;
      }
    }
    setStartDate(start);
    setEndDate(end);
  };

  // Calculate nights and total price
  const nights = (startDate && endDate)
    ? Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)))
    : 0;
  const totalPrice = listing?.price ? nights * listing.price : 0;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      toast.error("Login first");
      navigate("/airbnb/login");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (startDate >= endDate) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/booking", {
        username: formData.username,
        contact: formData.contact,
        datein: startDate,
        dateout: endDate,
        listingId: id
      });

      toast.success("Booking Successful 🎉");

      // Update booked dates in local state
      let newDates = [...bookedDates];
      let start = new Date(startDate);
      let end = new Date(endDate);
      while (start <= end) {
        newDates.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
      setBookedDates(newDates);

      setStartDate(null);
      setEndDate(null);

      navigate(`/airbnb/full-view/${id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Booking Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="container mt-5">
        <div className="card shadow p-4">
          <h2 className="text-center mb-4">
            Booking Form {listing ? `— ${listing.tittle}` : ""}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Contact</label>
              <input
                type="text"
                name="contact"
                className="form-control"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Phone number"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Select Dates</label>
              <DatePicker
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                minDate={new Date()}
                excludeDates={bookedDates}
                className="form-control"
                placeholderText="Select booking dates"
                required
              />
            </div>

            {/* Price & night summary when dates are picked */}
            {startDate && endDate && (
              <div className="alert alert-info py-2 text-center mb-3">
                <strong>{nights} night{nights > 1 ? "s" : ""}</strong> selected
                {listing?.price ? ` • Total Price: ₹${totalPrice} (₹${listing.price}/night)` : ""}
              </div>
            )}

            <div className="text-center">
              <button
                className="btn btn-primary px-4"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Booking..." : "Book Now"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <hr />
      <div className="text-center mb-5">
        <NavLink to={`/airbnb/full-view/${id}`} className="btn btn-secondary px-4">
          ← Back to Property
        </NavLink>
      </div>
    </>
  );
}

export default Booking;
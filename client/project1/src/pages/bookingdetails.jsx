import { useEffect, useState } from "react";
import api from "../api";
import { useParams, NavLink } from "react-router-dom";
import { toast } from "react-toastify";

function BookingDetails() {
  const { id } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    let isMounted = true;
    async function fetchBookings() {
      try {
        const res = await api.get(
          `/booking/${id}`,
          {
            params: user?.role === "owner" 
              ? {} 
              : { userId: user?._id }
          }
        );
        if (isMounted) {
          setBookings(res.data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fetch bookings error:", err);
        if (isMounted) setLoading(false);
      }
    }
  
    if (user) fetchBookings();
    else setLoading(false);

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  async function handleDelete(bookingId) {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await api.delete(`/booking/${bookingId}`);

      toast.success("Booking Cancelled");
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Not allowed");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <div className="container mt-5">
        <div className="card shadow p-4">

          <h2 className="text-center mb-4">Booking Details</h2>

          {loading ? (
            <p className="text-center text-muted">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="text-center text-muted">No bookings found for this venue.</p>
          ) : (
            bookings.map((b) => {
              const nights = Math.max(
                1,
                Math.round((new Date(b.dateout) - new Date(b.datein)) / (1000 * 60 * 60 * 24))
              );

              return (
                <div key={b._id} className="border rounded p-3 mb-3">
                  <p><strong>Name:</strong> {b.username}</p>
                  <p><strong>Contact:</strong> {b.contact}</p>
                  <p><strong>Check-In:</strong> {new Date(b.datein).toDateString()}</p>
                  <p><strong>Check-Out:</strong> {new Date(b.dateout).toDateString()}</p>
                  <p><strong>Duration:</strong> {nights} night{nights > 1 ? "s" : ""}</p>

                  <button
                    onClick={() => handleDelete(b._id)}
                    className="btn btn-danger btn-sm mt-2"
                    disabled={cancellingId === b._id}
                  >
                    {cancellingId === b._id ? "Cancelling..." : "Cancel Booking"}
                  </button>
                </div>
              );
            })
          )}

        </div>
      </div>

      <div className="text-center mt-3 mb-5">
        <NavLink
          to={`/airbnb/full-view/${id}`}
          className="btn btn-secondary px-4"
        >
          ← Back to Property
        </NavLink>
      </div>
    </>
  );
}

export default BookingDetails;
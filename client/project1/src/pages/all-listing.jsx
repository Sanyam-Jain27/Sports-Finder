import { useEffect, useState } from "react";
import api from "../api";
import './all-listing.css';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function AllList() {
    const navigate = useNavigate();

    // Stale-while-revalidate: instant display from cache if available
    const [listings, setListings] = useState(() => {
        try {
            const cached = sessionStorage.getItem("cached_listings");
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });

    const [loading, setLoading] = useState(listings.length === 0);

    useEffect(() => {
        let isMounted = true;

        async function fetchListings() {
            try {
                const res = await api.get("/airbnb/all-listing");
                if (isMounted) {
                    setListings(res.data);
                    setLoading(false);
                    try {
                        sessionStorage.setItem("cached_listings", JSON.stringify(res.data));
                    } catch (e) {
                        console.error("Cache store error", e);
                    }
                }
            } catch (err) {
                console.error("Error fetching listings:", err);
                if (isMounted) setLoading(false);
            }
        }

        fetchListings();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleViewDetails = (id) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            toast.info("Please login to view details");
            navigate("/airbnb/login");
            return;
        }
        navigate(`/airbnb/full-view/${id}`);
    };

    return (
        <div className="container mt-5">
            <h1 className="fw-bold mb-4 text-center">All Listings</h1>

            <div className="row g-4">
                {/* Skeleton placeholders when loading and no cache exists */}
                {loading && listings.length === 0 && (
                    [1, 2, 3, 4, 5, 6].map((n) => (
                        <div className="col-12 col-sm-6 col-md-4" key={`skeleton-${n}`}>
                            <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                                <div style={{ height: "220px", backgroundColor: "#e9ecef" }} className="placeholder-glow"></div>
                                <div className="card-body d-flex flex-column">
                                    <div className="placeholder col-8 mb-2" style={{ height: "20px", borderRadius: "4px" }}></div>
                                    <div className="placeholder col-5 mb-3" style={{ height: "16px", borderRadius: "4px" }}></div>
                                    <div className="placeholder col-4 mt-auto rounded-pill" style={{ height: "30px" }}></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {listings.map((card) => (
                    <div className="col-12 col-sm-6 col-md-4" key={card._id}>
                        <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-card">
                            <button
                                onClick={() => handleViewDetails(card._id)}
                                className="p-0 border-0 bg-transparent w-100"
                            >
                                <img
                                    src={card.img}
                                    className="card-img-top"
                                    alt={card.tittle || "Venue"}
                                    loading="lazy"
                                    style={{ height: "220px", objectFit: "cover" }}
                                />
                            </button>

                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title text-truncate fw-semibold mb-2">
                                    {card.tittle}
                                </h5>

                                <p className="card-text text-muted mb-2">
                                    <b>Price:</b> ₹{card.price}/slot
                                </p>

                                <button
                                    className="btn btn-outline-danger btn-sm mt-auto rounded-pill"
                                    onClick={() => handleViewDetails(card._id)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AllList;
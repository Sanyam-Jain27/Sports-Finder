import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Home() {
  const [listings, setListings] = useState(() => {
    try {
      const cached = sessionStorage.getItem("cached_listings");
      if (cached) {
        return JSON.parse(cached)
          .sort((a, b) => (b.avgRating || b.rating || 0) - (a.avgRating || a.rating || 0))
          .slice(0, 3);
      }
    } catch {
      // ignore
    }
    return [];
  });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function fetchListings() {
      try {
        const res = await api.get("/airbnb/all-listing");
        if (isMounted) {
          const topRated = res.data
            .sort((a, b) => (b.avgRating || b.rating || 0) - (a.avgRating || a.rating || 0))
            .slice(0, 3);
          setListings(topRated);
          try {
            sessionStorage.setItem("cached_listings", JSON.stringify(res.data));
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchListings();

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <>
      {/* Hero Section */}
      <section className="bg-light py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-7 text-center text-lg-start">
              <h1 className="display-4 fw-bold">
                Find the Perfect Place to <span className="text-primary">Play</span>
              </h1>

              <p className="lead text-muted mt-3">
                Discover the best turfs, badminton courts, football grounds,
                cricket pitches and more near you.
              </p>

              <div className="d-flex gap-3 justify-content-center justify-content-lg-start mt-4">
                <NavLink
                  to="/airbnb/all-listing"
                  className="btn btn-primary btn-lg"
                >
                  Find a Venue
                </NavLink>

                <NavLink
                  to="#"
                  className="btn btn-outline-dark btn-lg"
                  onClick={(e) => {
                    e.preventDefault();

                    const user = JSON.parse(localStorage.getItem("user"));

                    if (!user) {
                      alert("Login first");
                      navigate("/airbnb/login");
                      return;
                    }

                    if (user.role !== "owner") {
                      alert("Only owners can list property");
                      return;
                    }

                    navigate("/airbnb/list-your-venue");
                  }}
                >
                  List Your Venue
                </NavLink>
              </div>
            </div>

            <div className="col-lg-5 mt-5 mt-lg-0 text-center">
              <img
                src="https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=800&q=80"
                className="img-fluid rounded-4 shadow"
                alt="People playing sports"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      

      {/* Sports Categories */}
      <section className="py-5">
        <div className="container">
          <h2 className="fw-bold text-center">Play Your Favourite Sport</h2>

          <p className="text-center text-muted mb-5">
            Find the best sports venues around you
          </p>

          <div className="row g-4">

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm text-center p-3 h-100">
                <div className="fs-1">⚽</div>
                <h6 className="mt-2">Football</h6>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm text-center p-3 h-100">
                <div className="fs-1">🏏</div>
                <h6 className="mt-2">Cricket</h6>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm text-center p-3 h-100">
                <div className="fs-1">🏸</div>
                <h6 className="mt-2">Badminton</h6>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm text-center p-3 h-100">
                <div className="fs-1">🏀</div>
                <h6 className="mt-2">Basketball</h6>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm text-center p-3 h-100">
                <div className="fs-1">🎾</div>
                <h6 className="mt-2">Tennis</h6>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm text-center p-3 h-100">
                <div className="fs-1">🏓</div>
                <h6 className="mt-2">Table Tennis</h6>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why SportFinder */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="fw-bold text-center mb-5">
            Why Choose SportFinder?
          </h2>

          <div className="row text-center g-4">

            <div className="col-md-4">
              <div className="card border-0 bg-transparent">
                <div className="fs-1">📍</div>
                <h5 className="mt-3">Find Nearby Venues</h5>
                <p className="text-muted">
                  Discover sports venues close to your location and spend
                  less time searching.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 bg-transparent">
                <div className="fs-1">⭐</div>
                <h5 className="mt-3">Trusted Reviews</h5>
                <p className="text-muted">
                  Compare ratings and reviews before choosing the perfect
                  place to play.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 bg-transparent">
                <div className="fs-1">📅</div>
                <h5 className="mt-3">Easy Booking</h5>
                <p className="text-muted">
                  Check availability and book your preferred time slot
                  quickly and easily.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Popular Venues */}
<section className="py-5">
  <div className="container">

    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 className="fw-bold mb-1">Top Rated Venues</h2>
        <p className="text-muted mb-0">
          The highest-rated places players love
        </p>
      </div>

      <NavLink
        to="/airbnb/all-listing"
        className="btn btn-outline-primary"
      >
        View All
      </NavLink>
    </div>

    <div className="row g-4">

      {listings.map((card) => (
        <div className="col-12 col-md-4" key={card._id}>

          <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden">

            <button
              onClick={() => {
                const user = JSON.parse(localStorage.getItem("user"));

                if (!user) {
                  alert("Login first");
                  return;
                }

                navigate(`/airbnb/full-view/${card._id}`);
              }}
              className="p-0 border-0 bg-transparent w-100"
            >
              <img
                src={card.img}
                className="card-img-top"
                alt={card.tittle}
                style={{
                  height: "220px",
                  objectFit: "cover"
                }}
              />
            </button>

            <div className="card-body d-flex flex-column">

              <h5 className="card-title fw-semibold mb-2">
                {card.tittle}
              </h5>

              <p className="text-muted mb-2">
                📍 {card.location}
              </p>

              <p className="mb-2">
                <b>₹{card.price}</b> / slot
              </p>

              <p className="mb-0">
                ⭐ <strong>{card.rating}</strong>
              </p>

            </div>

          </div>

        </div>
      ))}

    </div>
  </div>
</section>

      {/* CTA */}
      <section className="bg-primary text-white py-5 text-center">
        <div className="container">

          <h2 className="fw-bold">
            Own a Sports Venue?
          </h2>

          <p className="lead">
            List your turf, court or ground and reach more players.
          </p>

          <NavLink
            to="#"
            className="btn btn-light btn-lg mt-2"
            onClick={(e) => {
              e.preventDefault();

              const user = JSON.parse(localStorage.getItem("user"));

              if (!user) {
                alert("Login first");
                navigate("/airbnb/login");
                return;
              }

              if (user.role !== "owner") {
                alert("Only owners can list property");
                return;
              }

              navigate("/airbnb/list-your-venue");
            }}
          >
            List Your Venue
          </NavLink>

        </div>
      </section>
    </>
  );
}

export default Home;
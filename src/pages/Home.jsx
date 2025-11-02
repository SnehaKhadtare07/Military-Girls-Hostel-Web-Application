import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
import "../styles/Home.css";
import ContactCard from "../components/ContactCard";

const Home = () => {
  const [showContactCard, setShowContactCard] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(list);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleContactClick = () => setShowContactCard(true);
  const handleClose = () => setShowContactCard(false);

  return (
    <main className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            A Secure, Disciplined, and Caring Home for Army Daughters
          </h1>
          <div className="hero-buttons">
            <Link to="/application">
              <button className="btn btn-primary">Apply for Room</button>
            </Link>
            <Link to="/login">
              <button className="btn btn-secondary">Login</button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <h2 className="section-title">About the Hostel</h2>
          <p className="about-description">
            Our hostel provides a safe and structured environment for the daughters of army
            personnel, fostering personal growth and academic success. We are committed to
            upholding the values of discipline, respect, and community, ensuring a supportive
            home away from home.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-image">
                <img src="./images/Room.jpg" alt="Comfortable Room" referrerPolicy="no-referrer" />
              </div>
              <h3 className="feature-title">Comfortable Rooms</h3>
              <p className="feature-description">Well-furnished rooms with individual study spaces</p>
            </div>

            <div className="feature-card">
              <div className="feature-image">
                <img src="./images/food.jpg" alt="Nutritious Meals" referrerPolicy="no-referrer" />
              </div>
              <h3 className="feature-title">Nutritious Meals</h3>
              <p className="feature-description">Balanced and healthy meals prepared with care</p>
            </div>

            <div className="feature-card">
              <div className="feature-image">
                <img src="./images/Hall.jpg" alt="Dedicated Study Hall" referrerPolicy="no-referrer" />
              </div>
              <h3 className="feature-title">Dedicated Study Hall</h3>
              <p className="feature-description">Quiet and well-lit study areas for focused learning</p>
            </div>

            <div className="feature-card">
              <div className="feature-image">
                <img src="./images/Security.jpg" alt="Round-the-Clock Security" referrerPolicy="no-referrer" />
              </div>
              <h3 className="feature-title">Round-the-Clock Security</h3>
              <p className="feature-description">24/7 security personnel and surveillance systems</p>
            </div>

            <div className="feature-card">
              <div className="feature-image">
                <img src="./images/internet.png" alt="High-Speed Internet" referrerPolicy="no-referrer" />
              </div>
              <h3 className="feature-title">High-Speed Internet</h3>
              <p className="feature-description">Reliable internet access for academics and personal use</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rulebook Section */}
      <section className="rulebook">
        <div className="container">
          <div className="rulebook-content">
            <div className="rulebook-text">
              <h2 className="section-title">Rulebook Highlight</h2>
              <p className="rulebook-description">
                Our hostel operates under a comprehensive rulebook designed to maintain a
                disciplined and respectful environment. Key highlights include guidelines on curfew,
                guest visits, and academic conduct. For a complete understanding of our expectations,
                please refer to the full rulebook.
              </p>
              <Link to="/rulebook">
                <button className="btn btn-outline">Read Full Rulebook</button>
              </Link>
            </div>
            <div className="rulebook-image">
              <img src="./images/StudyEnv.jpg" alt="Study Environment" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section (dynamic) */}
      <section className="announcements">
        <div className="container">
          <h2 className="section-title">Announcements / Notice Board</h2>
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <div key={a.id} className="announcement-card">
                <div className="announcement-content">
                  <h3 className="announcement-title">{a.title}</h3>
                  <p className="announcement-description">{a.description}</p>
                  {a.createdAt && (
                    <p className="announcement-time">
                      Posted on: {new Date(a.createdAt.toDate()).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No announcements available.</p>
          )}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="quick-links">
        <div className="container">
          <h2 className="section-title">Quick Links for Visitors</h2>
          <div className="quick-links-buttons">
            <Link to="/application">
              <button className="btn btn-primary">Apply for Room</button>
            </Link>
            <Link to="/gallery">
              <button className="btn btn-outline">Hostel Gallery</button>
            </Link>
            <button className="btn btn-outline" onClick={handleContactClick}>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {showContactCard && <ContactCard onClose={handleClose} />}

      <footer className="footer">
        <p className="footer-text">© 2024 Military Girls Hostel. All rights reserved.</p>
      </footer>
    </main>
  );
};

export default Home;

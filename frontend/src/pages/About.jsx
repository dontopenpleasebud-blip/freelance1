import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  Info,
  Layers,
  Truck,
  ShoppingBag,
  Award,
  CheckCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Activity,
  Heart
} from "lucide-react";
import "./About.css";

const About = () => {
  const verifiedPhones = ["+91 99666 75377", "+91 85009 35377"];
  const officialEmail = "yarramsettimanikondaswamy@gmail.com";

  const services = [
    {
      title: "Wholesale Milk Supply",
      desc: "Bulk pasteurized milk supply in bags, cans, and cartons for restaurants, caterers, and wholesale distributors.",
      icon: <Layers className="about-service-icon" size={24} />
    },
    {
      title: "Cold Chain Transport",
      desc: "Strict refrigerated shipping logistics maintaining temperatures under 4°C for guaranteed freshness.",
      icon: <Truck className="about-service-icon" size={24} />
    },
    {
      title: "Direct Dairy Retail",
      desc: "Public walk-in outlets in P.Gannavaram and Pothavaram supplying fresh milk products daily.",
      icon: <ShoppingBag className="about-service-icon" size={24} />
    },
    {
      title: "Procurement Network",
      desc: "Direct tie-ups with cooperative milk societies and local dairy farmers in East Godavari.",
      icon: <Award className="about-service-icon" size={24} />
    },
    {
      title: "Quality Lab Assured",
      desc: "Advanced fat, SNF, and purity testing on every batch before distribution.",
      icon: <Activity className="about-service-icon" size={24} />
    },
    {
      title: "Bulk Event Bookings",
      desc: "Special catering orders of fresh milk, curd, paneer, and sweets for marriages and festivals.",
      icon: <Calendar className="about-service-icon" size={24} />
    }
  ];

  const productCategories = [
    "Fresh Milk",
    "Thick Curd",
    "Pure Ghee",
    "Fresh Paneer",
    "Table Butter",
    "Sweet Lassi",
    "Flavoured Milk",
    "Traditional Sweets"
  ];

  return (
    <div className="about-page-container">
      {/* Header bar */}
      <header className="about-header-nav">
        <div className="about-brand">
          <img src="/logo.png" alt="SLG Logo" className="about-logo" />
          <div className="about-brand-text">
            <span className="about-brand-name">SLG MILK DAIRYS</span>
            <span className="about-brand-sub">VISAKHA DAIRY PARTNER</span>
          </div>
        </div>
        <div className="about-nav-links">
          <Link to="/login" className="about-nav-link-btn">
            Portal Log In
          </Link>
        </div>
      </header>

      {/* Main card wrapper */}
      <main className="about-card-wrapper">
        {/* Banner Section */}
        <section className="about-hero-banner">
          <span className="about-hero-badge">Established 2000</span>
          <h1 className="about-hero-title">
            SLG MILK DAIRYS & Visakha Dairy Distributor
          </h1>
          <p className="about-hero-desc">
            SLG MILK DAIRYS is a premium distributor of Visakha Dairy, serving
            wholesale and retail milk and high-quality dairy items across the East
            Godavari district of Andhra Pradesh, India. Under the professional
            guidance of Yarramsetti Manikonda Swamy, we supply pure, fresh, and
            nutritious milk products to thousands of households and businesses
            every day.
          </p>
        </section>

        {/* Business Verification Details Panel */}
        <section className="about-verification-card" id="business-details">
          <div className="about-verification-header">
            <Shield size={32} />
            <div>
              <h3>Official Business Profile</h3>
              <p>Meta Verification Records & Contact Sheet</p>
            </div>
          </div>

          <div className="about-verification-grid">
            <div className="av-item">
              <span className="av-label">
                <Briefcase size={14} /> Legal Business Name
              </span>
              <span className="av-value">SLG MILK DAIRYS</span>
            </div>

            <div className="av-item">
              <span className="av-label">
                <CheckCircle size={14} /> Registered Admin
              </span>
              <span className="av-value">Yarramsetti Manikonda Swamy</span>
            </div>

            <div className="av-item">
              <span className="av-label">
                <Calendar size={14} /> Year of Foundation
              </span>
              <span className="av-value">2000</span>
            </div>

            <div className="av-item">
              <span className="av-label">
                <Mail size={14} /> Official Email
              </span>
              <span className="av-value">
                <a href={`mailto:${officialEmail}`}>{officialEmail}</a>
              </span>
            </div>

            <div className="av-item av-span-2">
              <span className="av-label">
                <Phone size={14} /> Verified Business Phones
              </span>
              <div className="av-phone-links">
                {verifiedPhones.map((phone, idx) => (
                  <a
                    key={idx}
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="av-phone-btn"
                  >
                    <Phone size={14} /> {phone}
                  </a>
                ))}
              </div>
            </div>

            <div className="av-item av-span-2">
              <span className="av-label">
                <MapPin size={14} /> Physical & Operating Addresses
              </span>
              <div className="av-locations-box">
                <div className="av-location-item">
                  <strong>Location 1 (Main Distribution Center):</strong>
                  <br />
                  Near State Bank of India (SBI), Opposite P.Gannavaram, East
                  Godavari District, Andhra Pradesh - 533240, India
                </div>
                <div className="av-location-item">
                  <strong>Location 2 (Retail Showroom & Storage):</strong>
                  <br />
                  Opposite Honda Showroom, Pothavaram, East Godavari District,
                  Andhra Pradesh - 533294, India
                </div>
              </div>
            </div>
          </div>

          <div className="av-note-banner">
            <Info size={20} className="about-service-icon" style={{ marginTop: "2px" }} />
            <span>
              <strong>Reviewer Note:</strong> This page presents the official registry details of
              SLG MILK DAIRYS for Meta Business Manager verification. These credentials
              fully align with our trade registration certificates, phone bills, and
              association contracts with Visakha Dairy.
            </span>
          </div>
        </section>

        {/* Services Section */}
        <section className="about-services-section">
          <h2 className="about-section-heading">Our Core Services</h2>
          <div className="about-services-grid">
            {services.map((svc, i) => (
              <div className="about-service-card" key={i}>
                <h4>
                  {svc.icon} {svc.title}
                </h4>
                <p>{svc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Products Section */}
        <section className="about-services-section">
          <h2 className="about-section-heading">Distributed Product Line</h2>
          <div className="about-products-grid">
            {productCategories.map((cat, i) => (
              <div className="about-product-tag" key={i}>
                <Heart size={20} color="var(--color-primary)" />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="about-footer">
        <p>&copy; 2026 SLG MILK DAIRYS. All Rights Reserved.</p>
        <p style={{ fontSize: "0.78rem", marginTop: "4px", color: "var(--color-text-secondary)" }}>
          Official Distributor of Visakha Dairy Co-operative Union.
        </p>
      </footer>
    </div>
  );
};

export default About;

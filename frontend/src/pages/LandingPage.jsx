import React, { useState, useEffect } from "react";
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
  PhoneCall,
  Send,
  Droplet,
  Disc,
  Sun,
  Box,
  Coffee,
  Smile,
  ChevronDown,
  Menu,
  X,
  Check
} from "lucide-react";
import "./LandingPage.css";

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [toastOpen, setToastOpen] = useState(false);

  // Scroll Header Effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Dynamic Active Section Highlight
      const sections = ["home", "about", "verification", "services", "products", "faq"];
      const scrollPosition = window.scrollY + 120; // Offset

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Form Submit Handler
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setToastOpen(true);
    e.target.reset();
    setTimeout(() => {
      setToastOpen(false);
    }, 4000);
  };

  const productsList = [
    {
      name: "Visakha Premium Gold Milk",
      desc: "High cream, rich pasteurized milk ideal for families, sweets makers, and tea shops. Available in 500ml and 1L packets.",
      category: "milk",
      icon: <Droplet className="lp-p-fallback-icon" size={64} />
    },
    {
      name: "Visakha Fresh Thick Curd",
      desc: "Rich, creamy, and hygienically fermented thick yogurt. Perfect digestive companion for meals. Available in cups, sachets, and buckets.",
      category: "milk",
      icon: <Disc className="lp-p-fallback-icon" size={64} />
    },
    {
      name: "Visakha Pure Danedar Ghee",
      desc: "Granular texture with traditional rich aroma. Prepared from fresh milk butter. Extremely healthy and pure. Available in bottles and tins.",
      category: "ghee",
      icon: <Sun className="lp-p-fallback-icon" size={64} />
    },
    {
      name: "Fresh Paneer (Cottage Cheese)",
      desc: "Soft, fresh, and high-protein paneer blocks. Melt-in-mouth texture for premium curries and recipes. Available in 200g, 500g, and 1kg.",
      category: "ghee",
      icon: <Box className="lp-p-fallback-icon" size={64} />
    },
    {
      name: "Sweet Lassi & Flavoured Milk",
      desc: "Refreshing sweet lassi, buttermilk, and delicious flavoured milk (Badam, Pista, Elaichi, Chocolate) served chilled.",
      category: "sweets",
      icon: <Coffee className="lp-p-fallback-icon" size={64} />
    },
    {
      name: "Visakha Premium Milk Sweets",
      desc: "Traditional sweets like Peda, Kova, and Gulab Jamun manufactured using pure, fresh dairy ingredients.",
      category: "sweets",
      icon: <Smile className="lp-p-fallback-icon" size={64} />
    }
  ];

  return (
    <div className="landing-page-root">
      {/* Header Navigation */}
      <header className={`lp-main-header ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-container lp-nav-container">
          <a href="#home" className="lp-brand-logo">
            <img src="/logo.png" alt="SLG Logo" className="lp-logo-img" />
            <div className="lp-brand-text">
              <span className="lp-brand-name">SLG MILK DAIRYS</span>
              <span className="lp-brand-sub">VISAKHA DAIRY PARTNER</span>
            </div>
          </a>

          <nav className={`lp-nav-menu ${menuOpen ? "open" : ""}`}>
            <a
              href="#home"
              className={`lp-nav-link ${activeSection === "home" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#about"
              className={`lp-nav-link ${activeSection === "about" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              About Us
            </a>
            <a
              href="#verification"
              className={`lp-nav-link ${activeSection === "verification" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Verification Details
            </a>
            <a
              href="#services"
              className={`lp-nav-link ${activeSection === "services" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Services
            </a>
            <a
              href="#products"
              className={`lp-nav-link ${activeSection === "products" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Products
            </a>
            <a
              href="#faq"
              className={`lp-nav-link ${activeSection === "faq" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              FAQs
            </a>
            <Link to="/login" className="lp-btn lp-btn-nav">
              Portal Log In
            </Link>
          </nav>

          <button
            className="lp-mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Navigation"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="lp-hero-section"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.7) 100%), url('/hero_bg.png')"
        }}
      >
        <div className="lp-container lp-hero-container">
          <div className="lp-hero-content">
            <span className="lp-badge lp-hero-badge">Established since 2005</span>
            <h1 className="lp-hero-title">Purity You Can Trust, Quality You Can Taste</h1>
            <p className="lp-hero-desc">
              SLG (Sri Lakshmi Ganapathi) MILK DAIRYS, in proud partnership with Visakha Dairy, delivers the finest
              wholesale milk and premium dairy products across East Godavari. Assured freshness
              from farm to table.
            </p>
            <div className="lp-hero-actions">
              <a href="#verification" className="lp-btn lp-btn-primary">
                Business Profile
              </a>
              <a href="#contact" className="lp-btn lp-btn-secondary">
                Get in Touch
              </a>
            </div>
          </div>
          <div className="lp-hero-card-wrapper">
            <div className="lp-glass-card">
              <div className="lp-card-icon">
                <Award size={24} />
              </div>
              <h3>Certified Partner</h3>
              <p>
                Proudly distributing products for <strong>Visakha Dairy</strong>, India's leading
                dairy co-operative union.
              </p>
            </div>
            <div className="lp-glass-card">
              <div className="lp-card-icon">
                <Truck size={24} />
              </div>
              <h3>Wholesale & Retail</h3>
              <p>
                Serving residential homes, hotels, restaurants, and retail partners daily with
                cold-chain delivery.
              </p>
            </div>
          </div>
        </div>
        <div className="lp-hero-wave">
          <svg
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.3,81,25.69,154.06,48.09,228.09,69.19,321.39,56.44Z"
              className="shape-fill"
            ></path>
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="lp-about-section lp-section-padding">
        <div className="lp-container">
          <div className="lp-section-header lp-text-center">
            <span className="lp-section-subtitle">Who We Are</span>
            <h2 className="lp-section-title">21 Years of Dairy Excellence</h2>
            <div className="lp-title-underline"></div>
          </div>

          <div className="lp-grid lp-grid-2">
            <div>
              <h3>Serving Purity to Families and Businesses</h3>
              <p>
                SLG (Sri Lakshmi Ganapathi) MILK DAIRYS (Visakha Dairy Partner) has been a cornerstone of the dairy supply
                chain in East Godavari, Andhra Pradesh, since the year 2005. Under the professional
                management of Manikonda Swamy, we run operations based on trust, purity, and absolute
                commitment to quality.
              </p>
              <p>
                We source fresh milk directly from hygienic farms, subjected to rigorous quality tests
                before cooling and packaging. As a premium distributor for Visakha Dairy, we offer a
                diverse catalog of dairy products ranging from standard pasteurized milk to premium
                ghee, paneer, and sweets.
              </p>

              <ul className="lp-about-features">
                <li>
                  <CheckCircle className="lp-feat-icon" size={20} />
                  <span>State-of-the-art cold storage facility keeping dairy fresh.</span>
                </li>
                <li>
                  <CheckCircle className="lp-feat-icon" size={20} />
                  <span>Direct partnership with Visakha Dairy for genuine products.</span>
                </li>
                <li>
                  <CheckCircle className="lp-feat-icon" size={20} />
                  <span>Strict quality testing for fat content, purity, and hygiene.</span>
                </li>
              </ul>
            </div>

            <div className="lp-about-stats-card">
              <div className="lp-stat-box">
                <span className="lp-stat-number">2005</span>
                <span className="lp-stat-label">Year Established</span>
              </div>
              <div className="lp-stat-box">
                <span className="lp-stat-number">10k+</span>
                <span className="lp-stat-label">Liters Daily Supply</span>
              </div>
              <div className="lp-stat-box">
                <span className="lp-stat-number">500+</span>
                <span className="lp-stat-label">Wholesale Customers</span>
              </div>
              <div className="lp-stat-box">
                <span className="lp-stat-number">100%</span>
                <span className="lp-stat-label">Purity Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Verification Information Section */}
      <section id="verification" className="lp-section-padding lp-bg-light">
        <div className="lp-container">
          <div className="lp-section-header lp-text-center">
            <span className="lp-section-subtitle">Official Records</span>
            <h2 className="lp-section-title">Business Verification Information</h2>
            <p className="lp-section-header-desc">
              This section lists the registered and official information for SLG MILK DAIRYS as
              referenced in official document uploads and Meta Business verification requests.
            </p>
            <div className="lp-title-underline"></div>
          </div>

          <div className="lp-verification-card">
            <div className="lp-verification-card-header">
              <div className="lp-cert-icon">
                <Shield size={28} />
              </div>
              <div>
                <h3 style={{ color: "#ffffff", fontSize: "1.5rem" }}>Official Business Profile</h3>
                <p style={{ color: "rgba(255,255,255,0.8)" }}>SLG MILK DAIRYS — Visakha Dairy Distributor</p>
              </div>
            </div>

            <div className="lp-verification-grid">
              <div className="lp-v-item">
                <div className="lp-v-label">
                  <Briefcase size={16} /> Legal Business Name
                </div>
                <div className="lp-v-value">SLG (Sri Lakshmi Ganapathi) MILK DAIRYS</div>
              </div>
              <div className="lp-v-item">
                <div className="lp-v-label">
                  <CheckCircle size={16} /> Authorized Admin / Operator
                </div>
                <div className="lp-v-value">Yarramsetti Manikonda Swamy</div>
              </div>
              <div className="lp-v-item">
                <div className="lp-v-label">
                  <Award size={16} /> Business Activity & NIC Code
                </div>
                <div className="lp-v-value">
                  Wholesale of raw milk & dairy products (NIC: 46302, Services)
                </div>
              </div>
              <div className="lp-v-item">
                <div className="lp-v-label">
                  <Calendar size={16} /> Date of Establishment
                </div>
                <div className="lp-v-value">January 1, 2005</div>
              </div>
              <div className="lp-v-item">
                <div className="lp-v-label">
                  <Shield size={16} /> Udyam Registration
                </div>
                <div className="lp-v-value">UDYAM-AP-03-0012683 (SRI LAKSHMI GANAPATHI MILK AND COOL DRINKS)</div>
              </div>
              <div className="lp-v-item">
                <div className="lp-v-label">
                  <Mail size={16} /> Official Correspondence Email
                </div>
                <div className="lp-v-value">
                  <a href="mailto:yerramsettidurgarao435@gmail.com">
                    yerramsettidurgarao435@gmail.com
                  </a>
                </div>
              </div>
              <div className="lp-v-item lp-v-span-2">
                <div className="lp-v-label">
                  <Phone size={16} /> Verified Business Contacts
                </div>
                <div className="lp-v-value lp-flex-phones">
                  <a href="tel:+918500005377" className="lp-phone-link">
                    <PhoneCall size={16} /> +91 85000 05377
                  </a>
                  <a href="tel:+919966675377" className="lp-phone-link">
                    <PhoneCall size={16} /> +91 99666 75377
                  </a>
                  <a href="tel:+918500935377" className="lp-phone-link">
                    <PhoneCall size={16} /> +91 85009 35377
                  </a>
                </div>
              </div>
              <div className="lp-v-item lp-v-span-2">
                <div className="lp-v-label">
                  <MapPin size={16} /> Registered & Physical Locations
                </div>
                <div className="lp-v-value lp-locations-list">
                  <div>
                    <strong>Official Registered Address (as per Udyam Certificate):</strong>
                    <br />
                    D NO 5-57/3, Main Road, Patha Gannavaram, P.Gannavaram, East Godavari District, Andhra Pradesh - 533240, India
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      borderTop: "1px solid var(--lp-border)",
                      paddingTop: "10px"
                    }}
                  >
                    <strong>Location 1 (Main Distribution Center):</strong>
                    <br />
                    Near State Bank of India (SBI), Opposite P.Gannavaram, East Godavari District,
                    Andhra Pradesh - 533240, India
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      borderTop: "1px solid var(--lp-border)",
                      paddingTop: "10px"
                    }}
                  >
                    <strong>Location 2 (Retail Showroom & Storage):</strong>
                    <br />
                    Opposite Honda Showroom, Pothavaram, East Godavari District, Andhra Pradesh -
                    533294, India
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-verification-footer-note">
              <Info size={24} />
              <span>
                Please use the above details to cross-reference our official business records during
                Meta Verification. For document uploads, refer to our Udyam Registration Certificate (UDYAM-AP-03-0012683 under the name SRI LAKSHMI GANAPATHI MILK AND COOL DRINKS), Partnership Agreement, Municipal
                Trade License, or GST filings showing the matching name, phone number, and address.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="lp-section-padding">
        <div className="lp-container">
          <div className="lp-section-header lp-text-center">
            <span className="lp-section-subtitle">What We Do</span>
            <h2 className="lp-section-title">Our Dedicated Dairy Services</h2>
            <div className="lp-title-underline"></div>
          </div>

          <div className="lp-grid lp-grid-3">
            <div className="lp-service-card">
              <div className="lp-service-icon">
                <Layers size={24} />
              </div>
              <h3>Wholesale Milk Supply</h3>
              <p>
                We supply premium Visakha Milk in bulk quantities to hotels, restaurants, sweet
                manufacturers, and retail shops with early morning delivery schedules.
              </p>
            </div>
            <div className="lp-service-card">
              <div className="lp-service-icon">
                <Truck size={24} />
              </div>
              <h3>Cold Chain Logistics</h3>
              <p>
                Equipped with cooling chambers and insulated logistics, we ensure the milk and dairy
                products remain under 4°C from procurement to final delivery.
              </p>
            </div>
            <div className="lp-service-card">
              <div className="lp-service-icon">
                <ShoppingBag size={24} />
              </div>
              <h3>Retail Outlet Stores</h3>
              <p>
                Our outlets at P.Gannavaram and Pothavaram offer direct-to-consumer sales for milk,
                curd, ghee, paneer, and delicious milk sweets.
              </p>
            </div>
            <div className="lp-service-card">
              <div className="lp-service-icon">
                <CheckCircle size={24} />
              </div>
              <h3>Farmer Procurement</h3>
              <p>
                We work directly with local farmers in East Godavari, facilitating prompt payments
                and supporting the rural dairy farming community.
              </p>
            </div>
            <div className="lp-service-card">
              <div className="lp-service-icon">
                <Shield size={24} />
              </div>
              <h3>Quality Testing Lab</h3>
              <p>
                Every batch of milk undergoes thorough chemical testing for fat, SNF (Solid-Not-Fat),
                and water adulteration prior to distribution.
              </p>
            </div>
            <div className="lp-service-card">
              <div className="lp-service-icon">
                <Calendar size={24} />
              </div>
              <h3>Events Bulk Booking</h3>
              <p>
                Planning a wedding or festival? We provide specialized bulk catering supply of fresh
                curd, milk, and paneer at special wholesale pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Catalog Section */}
      <section id="products" className="lp-section-padding lp-bg-light">
        <div className="lp-container">
          <div className="lp-section-header lp-text-center">
            <span className="lp-section-subtitle">Our Catalog</span>
            <h2 className="lp-section-title">Premium Visakha Dairy Products</h2>
            <p className="lp-section-header-desc">
              We offer the full range of fresh, healthy, and premium quality dairy foods.
            </p>
            <div className="lp-title-underline"></div>
          </div>

          <div className="lp-product-filters">
            <button
              className={`lp-filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All Products
            </button>
            <button
              className={`lp-filter-btn ${activeFilter === "milk" ? "active" : ""}`}
              onClick={() => setActiveFilter("milk")}
            >
              Milk & Curd
            </button>
            <button
              className={`lp-filter-btn ${activeFilter === "ghee" ? "active" : ""}`}
              onClick={() => setActiveFilter("ghee")}
            >
              Ghee & Butter
            </button>
            <button
              className={`lp-filter-btn ${activeFilter === "sweets" ? "active" : ""}`}
              onClick={() => setActiveFilter("sweets")}
            >
              Sweets & Lassi
            </button>
          </div>

          <div className="lp-grid lp-grid-3">
            {productsList
              .filter((prod) => activeFilter === "all" || prod.category === activeFilter)
              .map((product, index) => (
                <div className="lp-product-item-card" key={index}>
                  <div className="lp-p-img-box">
                    <div className="lp-p-category">{product.category}</div>
                    {product.icon}
                  </div>
                  <div className="lp-p-details">
                    <h4>{product.name}</h4>
                    <p>{product.desc}</p>
                    <span className="lp-p-availability">
                      <Check size={14} /> In Stock (Wholesale/Retail)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="lp-section-padding">
        <div className="lp-container">
          <div className="lp-section-header lp-text-center">
            <span className="lp-section-subtitle">Got Questions?</span>
            <h2 className="lp-section-title">Frequently Asked Questions</h2>
            <div className="lp-title-underline"></div>
          </div>

          <div className="lp-faq-container">
            {[
              {
                q: "Is SLG Milk Dairys an authorized Visakha Dairy distributor?",
                a: "Yes. SLG Milk Dairys has been an authorized distributor and franchise partner of Visakha Dairy (Sri Vijaya Visakha District Milk Producers Co-op Union Ltd.) since the year 2005. We distribute authentic, seal-packed Visakha Dairy products under strict cold chain compliance."
              },
              {
                q: "How can we verify the business identity for SLG MILK DAIRYS?",
                a: "Our official legal business entity name is SLG (Sri Lakshmi Ganapathi) MILK DAIRYS, registered under Udyam as SRI LAKSHMI GANAPATHI MILK AND COOL DRINKS. You can verify this using our official Udyam certificate (UDYAM-AP-03-0012683), partnership documentation, GST registration records, or municipal trade licenses. Our verified contact numbers are +91 85000 05377, +91 99666 75377, and +91 85009 35377, and our official email is yerramsettidurgarao435@gmail.com."
              },
              {
                q: "What geographic areas do you cover?",
                a: "We serve the entire East Godavari district in Andhra Pradesh, India. Our main distribution warehouse is located opposite SBI in P.Gannavaram, and our retail outlet is situated opposite the Honda Showroom in Pothavaram. We run daily shipping routes for wholesale orders to local retailers and catering partners."
              },
              {
                q: "How do you maintain the freshness of milk?",
                a: "We strictly adhere to standard cold chain protocols. Once the milk is procured from dairy cooperative societies, it is immediately routed to cooling centers and kept under 4°C. Our delivery fleets are equipped with insulated crates to prevent any temperature spikes, ensuring that the milk stays fresh and nutritious."
              }
            ].map((faq, i) => (
              <div className={`lp-faq-item ${activeFaq === i ? "active" : ""}`} key={i}>
                <button className="lp-faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown className="lp-faq-icon" />
                </button>
                <div className="lp-faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="lp-section-padding lp-bg-dark">
        <div className="lp-container">
          <div className="lp-section-header lp-text-center">
            <span className="lp-section-subtitle">Get In Touch</span>
            <h2 className="lp-section-title" style={{ color: "#ffffff" }}>Connect with SLG MILK DAIRYS</h2>
            <p className="lp-section-header-desc lp-text-muted">
              Have inquiries regarding wholesale milk supply, sweet catering, or business association? Reach out to us directly.
            </p>
            <div className="lp-title-underline"></div>
          </div>

          <div className="lp-grid lp-grid-2">
            <div className="lp-contact-info-wrapper">
              <h3>Contact Information</h3>
              <p className="lp-contact-intro">
                Feel free to call, email, or visit our facilities. Our manager, Manikonda Swamy,
                and team will assist you with any supply requirements.
              </p>

              <div className="lp-contact-details-list">
                <div className="lp-contact-detail-item">
                  <div className="lp-cd-icon">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4>Phone Numbers</h4>
                    <p>
                      <a href="tel:+919966675377" className="lp-text-light-link">
                        +91 99666 75377
                      </a>
                    </p>
                    <p>
                      <a href="tel:+918500935377" className="lp-text-light-link">
                        +91 85009 35377
                      </a>
                    </p>
                  </div>
                </div>

                <div className="lp-contact-detail-item">
                  <div className="lp-cd-icon">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4>Email Address</h4>
                    <p>
                      <a href="mailto:yerramsettidurgarao435@gmail.com" className="lp-text-light-link">
                        yerramsettidurgarao435@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="lp-contact-detail-item">
                  <div className="lp-cd-icon">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4>Primary Distribution Center</h4>
                    <p>
                      Near SBI, Opposite P.Gannavaram,
                      <br />
                      East Godavari District, Andhra Pradesh - 533240, India
                    </p>
                  </div>
                </div>

                <div className="lp-contact-detail-item">
                  <div className="lp-cd-icon">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4>Retail Showroom & Storage</h4>
                    <p>
                      Opposite Honda Showroom, Pothavaram,
                      <br />
                      East Godavari District, Andhra Pradesh - 533294, India
                    </p>
                  </div>
                </div>
              </div>

              <div className="lp-social-links-container">
                <h4>Follow Us</h4>
                <div className="lp-social-links">
                  <a
                    href="https://instagram.com/slgmilkdairys/"
                    target="_blank"
                    rel="noreferrer"
                    className="lp-social-btn"
                    aria-label="Instagram"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="lp-social-btn"
                    aria-label="Facebook"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="lp-contact-form-card">
              <h3>Send Us a Message</h3>
              <form onSubmit={handleContactSubmit} className="lp-contact-form">
                <div className="lp-form-row">
                  <div className="lp-form-group">
                    <label htmlFor="formName">Full Name</label>
                    <input
                      type="text"
                      id="formName"
                      className="lp-form-control"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="lp-form-group">
                    <label htmlFor="formPhone">Phone Number</label>
                    <input
                      type="tel"
                      id="formPhone"
                      className="lp-form-control"
                      placeholder="e.g. +91 99666 75377"
                      required
                    />
                  </div>
                </div>

                <div className="lp-form-group">
                  <label htmlFor="formEmail">Email Address</label>
                  <input
                    type="email"
                    id="formEmail"
                    className="lp-form-control"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="lp-form-group">
                  <label htmlFor="formSubject">Subject</label>
                  <select id="formSubject" className="lp-form-control">
                    <option value="Wholesale Inquiry">Wholesale Supply Inquiry</option>
                    <option value="Retail Booking">Retail Bulk Booking (Events)</option>
                    <option value="Partnership">Business Partnership</option>
                    <option value="General Support">General Feedback / Support</option>
                  </select>
                </div>

                <div className="lp-form-group">
                  <label htmlFor="formMessage">Message Details</label>
                  <textarea
                    id="formMessage"
                    rows="4"
                    className="lp-form-control"
                    placeholder="Tell us how we can help you..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="lp-btn lp-btn-primary lp-btn-block">
                  <span>Send Message</span>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-main-footer">
        <div className="lp-container lp-footer-content lp-text-center">
          <div className="lp-footer-logo">
            <img src="/logo.png" alt="SLG Logo" className="lp-footer-logo-img" />
            <h3>SLG (Sri Lakshmi Ganapathi) MILK DAIRYS</h3>
            <p>Wholesale Milk & Premium Dairy Products since 2005</p>
          </div>

          <div className="lp-footer-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#verification">Verification Details</a>
            <a href="#services">Services</a>
            <a href="#products">Products</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="lp-footer-bottom">
            <p>&copy; 2026 SLG MILK DAIRYS. All rights reserved.</p>
            <p className="lp-coop-disclaimer">
              Partnered with Visakha Dairy (Sri Vijaya Visakha District Milk Producers Mutually Aided
              Cooperative Union Ltd.)
            </p>
          </div>
        </div>
      </footer>

      {/* Toast Alert */}
      <div className={`lp-toast ${toastOpen ? "show" : ""}`}>
        <div className="lp-toast-content">
          <CheckCircle className="lp-toast-icon" size={24} />
          <div className="lp-toast-message">
            <h4>Success!</h4>
            <p>Your message has been sent successfully.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

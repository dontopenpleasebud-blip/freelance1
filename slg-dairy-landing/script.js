// Initialize Feather Icons
document.addEventListener("DOMContentLoaded", () => {
    if (typeof feather !== "undefined") {
        feather.replace();
    }

    // Sticky Header Scroll Event
    const header = document.querySelector(".main-header");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

    // Mobile Menu Toggle
    const mobileToggle = document.getElementById("mobileToggle");
    const navMenu = document.getElementById("navMenu");
    const navLinks = document.querySelectorAll(".nav-link");

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener("click", () => {
            navMenu.classList.toggle("open");
            const isOpen = navMenu.classList.contains("open");
            mobileToggle.innerHTML = isOpen 
                ? `<i data-feather="x"></i>` 
                : `<i data-feather="menu"></i>`;
            feather.replace();
        });

        // Close mobile menu on clicking nav links
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("open");
                mobileToggle.innerHTML = `<i data-feather="menu"></i>`;
                feather.replace();
            });
        });
    }

    // Active Navigation Link on Scroll
    const sections = document.querySelectorAll("section");
    window.addEventListener("scroll", () => {
        let currentSectionId = "";
        const scrollPosition = window.scrollY + 100; // Offset for header height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentSectionId}`) {
                link.classList.add("active");
            }
        });
    });

    // FAQ Accordion Toggle
    const faqQuestions = document.querySelectorAll(".faq-question");
    faqQuestions.forEach(question => {
        question.addEventListener("click", () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains("active");

            // Close all other FAQ items
            document.querySelectorAll(".faq-item").forEach(item => {
                item.classList.remove("active");
            });

            // Toggle current item
            if (!isActive) {
                faqItem.classList.add("active");
            }
        });
    });

    // Product Category Filtering
    const filterButtons = document.querySelectorAll(".filter-btn");
    const productCards = document.querySelectorAll(".product-item-card");

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove("active"));
            // Add active class to clicked button
            button.classList.add("active");

            const filterValue = button.getAttribute("data-filter");

            productCards.forEach(card => {
                const category = card.getAttribute("data-category");

                if (filterValue === "all" || category === filterValue) {
                    card.style.display = "flex";
                    // Brief fade-in animation
                    card.style.opacity = "0";
                    setTimeout(() => {
                        card.style.opacity = "1";
                        card.style.transition = "opacity 0.4s ease";
                    }, 50);
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    // Contact Form Submission & Success Toast
    const contactForm = document.getElementById("contactForm");
    const toast = document.getElementById("toast");

    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Simulate form submission success
            showToast();
            contactForm.reset();
        });
    }

    function showToast() {
        if (toast) {
            toast.classList.add("show");
            
            // Auto hide after 4 seconds
            setTimeout(() => {
                toast.classList.remove("show");
            }, 4000);
        }
    }
});

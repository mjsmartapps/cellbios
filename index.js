document.addEventListener("DOMContentLoaded", () => {
    // 1. Dynamic Year for Footer and Est Year Logic
    const currentYear = new Date().getFullYear();
    document.getElementById("year").textContent = currentYear;

    // 2. Navbar Scroll Effect & Mobile Menu Toggle
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if(hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            hamburger.classList.toggle('toggle');
        });
    }

    // Nav Links - Active State based on scroll position (ScrollSpy for SPA)
    const sections = document.querySelectorAll('.section-target');
    const navItems = document.querySelectorAll('.nav-item');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });

    // Close mobile menu on click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(navLinks.classList.contains('nav-active')) {
                navLinks.classList.remove('nav-active');
                hamburger.classList.remove('toggle');
            }
        });
    });

    // 3. Scroll Reveal Animations (Intersection Observer)
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => { revealOnScroll.observe(el); });

    // 4. Number Counter Animation for Impact Section
    const counters = document.querySelectorAll('.counter');
    let hasCounted = false;

    // Set dynamic Years of Excellence (Current Year - 2008)
    const yearsOfExcellence = currentYear - 2008;
    counters.forEach(c => {
        if(c.getAttribute('data-target') === "15") {
            c.setAttribute('data-target', yearsOfExcellence.toString());
        }
    });

    const counterObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasCounted) {
            hasCounted = true;
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const duration = 2000;
                const increment = target / (duration / 16);
                
                let current = 0;
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.innerText = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCounter();
            });
        }
    }, { threshold: 0.5 });

    const impactSection = document.querySelector('.impact-section');
    if (impactSection) { counterObserver.observe(impactSection); }

    // 5. Load Products (Acts as both Featured & Full Catalog in SPA)
    const allProductsGrid = document.getElementById('all-products-grid');
    
    if (allProductsGrid && typeof db !== 'undefined') {
        db.collection("products").get().then((querySnapshot) => {
            allProductsGrid.innerHTML = ''; 
            
            if (querySnapshot.empty) {
                injectDummyProducts();
                return;
            }

            querySnapshot.forEach((doc, index) => {
                const p = doc.data();
                const delayClass = index === 0 ? '' : (index === 1 ? 'delay-1' : 'delay-2');
                const pString = encodeURIComponent(JSON.stringify({...p, id: doc.id}));

                const productHTML = `
                    <div class="product-card reveal fade-up active ${delayClass}" onclick="openProductDetails('${pString}')">
                        <div class="img-container">
                            <img src="${p.imageUrl || 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80&w=600'}" alt="${p.name}" class="product-img">
                        </div>
                        <div class="product-info">
                            <span class="category-tag">${p.category}</span>
                            <h3>${p.name}</h3>
                            <p>${p.shortDescription}</p>
                            <span class="btn btn-outline btn-sm w-100" style="margin-top:auto;">View Specifications</span>
                        </div>
                    </div>
                `;
                allProductsGrid.innerHTML += productHTML;
            });
        }).catch((error) => {
            console.error("Error getting products: ", error);
            injectDummyProducts();
        });
    }

    // Helper: CellBios Real-World Dummy Data Fallback
    function injectDummyProducts() {
        if(!allProductsGrid) return;
        const dummies = [
            { id: "cb1", name: "Cryopreservation Bags", category: "Biotech Products", shortDescription: "Premium bags for the safe storage of stem cells & tissues.", fullDescription: "Industry-leading cryopreservation bags designed specifically for the rigorous demands of long-term stem cell and tissue storage. Built with advanced polymers ensuring cell viability under extreme low temperatures.", specs: "Application: Stem Cell Storage, Certification: ISO 13485", imageUrl: "https://images.unsplash.com/photo-1579154204601-e1588bc92458?auto=format&fit=crop&q=80&w=600" },
            { id: "cb2", name: "Cord Blood Processing Kits", category: "Biotech Products", shortDescription: "Complete closed-system kits for cord blood extraction.", fullDescription: "Sterile, closed-system processing kits designed to maximize stem cell recovery from umbilical cord blood. Trusted by top blood banks globally.", specs: "Type: Closed System, Sterility: Gamma Irradiated", imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600" },
            { id: "cb3", name: "Bioprocess 2D & 3D Bags", category: "Biotech Products", shortDescription: "Advanced bioprocessing storage and transfer solutions.", fullDescription: "Scalable 2D and 3D bioprocess bags for reliable media storage, transfer, and cell culture operations in pharmaceutical manufacturing.", specs: "Volume: 1L to 2000L, Material: Multi-layer film", imageUrl: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&q=80&w=600" },
            { id: "cb4", name: "Blood Bags & Components", category: "Medical Products", shortDescription: "High-quality systems for blood banking and transfusion.", fullDescription: "Medical-grade blood collection and separation bags ensuring maximum safety during blood banking, component separation, and clinical transfusions.", specs: "Type: Single/Double/Triple/Quad, Anticoagulant: CPDA-1/SAGM", imageUrl: "https://images.unsplash.com/photo-1615467617937-234b3dc04c55?auto=format&fit=crop&q=80&w=600" },
            { id: "cb5", name: "Infusion Fluid Bags", category: "Medical Products", shortDescription: "Sterile fluid transfer and IV therapy storage systems.", fullDescription: "Highly reliable infusion fluid bags manufactured in Class 10,000 cleanrooms to ensure absolutely sterile delivery of intravenous fluids.", specs: "Application: IV Therapy, Compliance: USP Class VI", imageUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=600" },
            { id: "cb6", name: "Custom OEM Bioprocess Bags", category: "Custom Solutions", shortDescription: "Client-specific OEM manufacturing for bioprocessing workflows.", fullDescription: "Tailor-made bioprocessing bags engineered to fit specific client manufacturing parameters, complete with custom port configurations and tubing.", specs: "Service: OEM Design, Environment: Class 10000 Cleanroom", imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=600" },
            { id: "cb7", name: "Urine Collection Bags", category: "Medical Products", shortDescription: "Medical-grade disposable drainage and collection solutions.", fullDescription: "Hygienic, leak-proof urine collection and drainage bags designed for patient comfort and accurate volume measurement in hospital settings.", specs: "Capacity: 2000ml, Feature: Anti-reflux valve", imageUrl: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&q=80&w=600" },
            { id: "cb8", name: "Cell Culture Storage Systems", category: "Biotech Products", shortDescription: "Reliable storage for advanced cell and gene therapies (CGT).", fullDescription: "Specialized storage systems preserving the critical integrity of sensitive cell cultures and gene therapy compounds during transit and archiving.", specs: "Application: Cell & Gene Therapy, Durability: High-impact resistant", imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600" },
            { id: "cb9", name: "OEM Medical Consumables", category: "Custom Solutions", shortDescription: "Tailored manufacturing of specialized medical disposable devices.", fullDescription: "End-to-end contract manufacturing for custom medical disposables, leveraging our advanced polymer sealing technologies and regulatory expertise.", specs: "Standard: ISO 13485, Production: Scalable Lots", imageUrl: "https://images.unsplash.com/photo-1574926053833-2a3b01859e98?auto=format&fit=crop&q=80&w=600" },
            { id: "cb10", name: "IV & Fluid Transfer Systems", category: "Medical Products", shortDescription: "Precision fluid management networks for hospitals.", fullDescription: "Comprehensive tubing and fluid transfer sets ensuring bubble-free, precise delivery of critical fluids in clinical and surgical environments.", specs: "Components: Tubing/Connectors/Filters, Sterilization: EtO", imageUrl: "https://images.unsplash.com/photo-1614935151651-0bea6508ab6b?auto=format&fit=crop&q=80&w=600" }
        ];
        
        allProductsGrid.innerHTML = '';
        dummies.forEach((p, i) => {
            const delay = i === 0 ? '' : (i === 1 ? 'delay-1' : 'delay-2');
            const pString = encodeURIComponent(JSON.stringify(p));

            allProductsGrid.innerHTML += `
                <div class="product-card reveal fade-up active ${delay}" onclick="openProductDetails('${pString}')">
                    <div class="img-container">
                        <img src="${p.imageUrl}" alt="${p.name}" class="product-img">
                    </div>
                    <div class="product-info">
                        <span class="category-tag">${p.category}</span>
                        <h3>${p.name}</h3>
                        <p>${p.shortDescription}</p>
                        <span class="btn btn-outline btn-sm w-100" style="margin-top:auto;">View Specifications</span>
                    </div>
                </div>
            `;
        });
    }

    // Search Filter Logic
    const searchInput = document.getElementById('search-product');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = allProductsGrid.querySelectorAll('.product-card');
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }

    // 6. Contact Form Secure Submission to Firebase
    const contactForm = document.getElementById('contact-form');
    if (contactForm && typeof db !== 'undefined') {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = contactForm.querySelector('button[type="submit"]');
            const statusLabel = document.getElementById('contact-status');
            
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;

            // Loading state
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
            btn.disabled = true;
            statusLabel.textContent = '';

            // Post to Firebase 'inquiries' collection
            db.collection("inquiries").add({
                name: name,
                email: email,
                subject: subject,
                message: message,
                status: 'Pending Review',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                btn.innerHTML = 'Submit Securely';
                btn.disabled = false;
                statusLabel.textContent = "Thank you! Your inquiry has been sent securely.";
                statusLabel.style.color = "var(--secondary-color)";
                contactForm.reset();
                
                // Clear success message after 5 seconds
                setTimeout(() => { statusLabel.textContent = ''; }, 5000);
            }).catch((error) => {
                console.error("Error adding inquiry: ", error);
                btn.innerHTML = 'Submit Securely';
                btn.disabled = false;
                statusLabel.textContent = "Error sending message. Please check connection and try again.";
                statusLabel.style.color = "red";
            });
        });
    }
});

// --- SPA View Switching Logic ---
window.openProductDetails = function(encodedProduct) {
    const product = JSON.parse(decodeURIComponent(encodedProduct));
    
    document.getElementById('main-view').style.display = 'none';
    const detailsView = document.getElementById('details-view');
    detailsView.style.display = 'block';
    
    window.scrollTo(0, 0);

    let specRows = '';
    if (product.specs || product.specifications) {
        const specString = product.specs || product.specifications;
        const specItems = specString.split(',').map(s => s.trim());
        specItems.forEach(item => {
            const parts = item.split(':');
            if (parts.length === 2) {
                specRows += `<tr><th>${parts[0].trim()}</th><td>${parts[1].trim()}</td></tr>`;
            }
        });
    }
    
    const container = document.getElementById('product-details-container');
    container.innerHTML = `
        <div class="product-detail-layout reveal fade-up active" style="opacity:1; visibility:visible; transform:none;">
            <div class="img-container" style="border-radius:16px; overflow:hidden;">
                <img src="${product.imageUrl || 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80&w=800'}" alt="${product.name}" class="product-detail-img" style="border:none; box-shadow:none;">
            </div>
            <div>
                <span class="category-tag" style="font-size: 0.9rem;">${product.category}</span>
                <h2 style="font-size: 2.2rem; margin-bottom: 20px;">${product.name}</h2>
                <p style="font-size: 1.1rem; color: var(--text-muted); line-height: 1.8;">${product.fullDescription || product.shortDescription}</p>
                
                ${specRows ? `
                <table class="spec-table mt-4">
                    ${specRows}
                    <tr><th>Quality Standard</th><td>ISO 13485 Certified, Class 10k Cleanroom</td></tr>
                </table>
                ` : '<p class="mt-4"><i>Technical specifications available upon request.</i></p>'}
                
                <div class="mt-4" style="display: flex; gap: 15px;">
                    <button class="btn btn-primary" onclick="alert('Added to inquiry cart.')">Request Quote</button>
                    <button class="btn btn-outline" onclick="window.location.hash='#contact'; closeDetails();">Contact Sales</button>
                </div>
            </div>
        </div>
    `;
};

window.closeDetails = function() {
    document.getElementById('details-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
};
document.addEventListener("DOMContentLoaded", () => {
    const auth = firebase.auth();
    
    // UI Elements
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Layout Elements
    const drawerToggle = document.getElementById('drawer-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const navLinks = document.querySelectorAll('.admin-menu a');
    const views = document.querySelectorAll('.admin-view');

    // Form Elements
    const formContainer = document.getElementById('product-form-container');
    const addBtn = document.getElementById('show-add-form-btn');
    const cancelBtn = document.getElementById('cancel-form-btn');
    const productForm = document.getElementById('product-form');
    const adminProductList = document.getElementById('admin-product-list');
    const adminInquiriesList = document.getElementById('admin-inquiries-list');

    // 1. Authentication State Observer
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            loadAdminProducts();
            loadAdminInquiries();
            updateAnalytics();
        } else {
            loginSection.style.display = 'flex';
            dashboardSection.style.display = 'none';
        }
    });

    // 2. Login Logic
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            const errorMsg = document.getElementById('login-error');
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
            submitBtn.disabled = true;

            auth.signInWithEmailAndPassword(email, password)
                .catch((error) => {
                    errorMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Access Denied: ${error.message}`;
                    submitBtn.innerHTML = 'Authenticate <i class="fa-solid fa-arrow-right-to-bracket ml-1"></i>';
                    submitBtn.disabled = false;
                });
        });
    }

    // 3. Logout Logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm("Securely terminate your session?")) {
                auth.signOut();
            }
        });
    }

    // 4. Drawer & Navigation Logic
    if (drawerToggle && sidebar) {
        drawerToggle.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                sidebar.classList.toggle('open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Update Active State
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Switch Views
            views.forEach(v => v.style.display = 'none');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';

            // Refresh Analytics if hitting the analytics tab
            if(targetId === 'view-analytics') {
                updateAnalytics();
            }

            // Close drawer on mobile after selection
            if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });

    // 5. Form Toggles
    if (addBtn) addBtn.addEventListener('click', () => {
        productForm.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('form-title').innerHTML = '<i class="fa-solid fa-plus" style="margin-right:8px;"></i> Add New Product';
        formContainer.style.display = 'block';
        
        // Scroll specifically within the main content div
        document.querySelector('.admin-main-content').scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
    });

    // 6. Save/Update Product
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = document.getElementById('prod-id').value;
            const productData = {
                name: document.getElementById('prod-name').value,
                category: document.getElementById('prod-category').value,
                shortDescription: document.getElementById('prod-short-desc').value,
                fullDescription: document.getElementById('prod-full-desc').value,
                specifications: document.getElementById('prod-specs').value,
                imageUrl: document.getElementById('prod-image').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const btn = document.getElementById('save-prod-btn');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
            btn.disabled = true;

            if (id) {
                // Update Existing
                db.collection("products").doc(id).update(productData).then(() => {
                    formContainer.style.display = 'none';
                    loadAdminProducts();
                    updateAnalytics();
                }).finally(() => { 
                    btn.textContent = 'Commit to Database'; 
                    btn.disabled = false; 
                });
            } else {
                // Add New Entry
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                db.collection("products").add(productData).then(() => {
                    formContainer.style.display = 'none';
                    loadAdminProducts();
                    updateAnalytics();
                }).finally(() => { 
                    btn.textContent = 'Commit to Database'; 
                    btn.disabled = false; 
                });
            }
        });
    }

    // 7. Load Real Products
    function loadAdminProducts() {
        if(!adminProductList) return;
        
        adminProductList.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--secondary-color);"></i><p class="mt-2 text-muted">Retrieving database entries...</p></td></tr>';

        db.collection("products").orderBy("createdAt", "desc").get().then((snapshot) => {
            adminProductList.innerHTML = '';
            
            if (snapshot.empty) {
                adminProductList.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding: 30px;">Database is currently empty. Add a new product to begin.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const p = doc.data();
                adminProductList.innerHTML += `
                    <tr>
                        <td>
                            <img src="${p.imageUrl || 'https://via.placeholder.com/60?text=No+Img'}" alt="Asset Preview">
                        </td>
                        <td>
                            <strong style="color: var(--primary-color); font-size: 1.05rem;">${p.name}</strong><br>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">${p.shortDescription}</span>
                        </td>
                        <td>
                            <span style="background: rgba(0, 180, 216, 0.1); color: var(--accent-color); padding: 4px 10px; border-radius: 50px; font-size: 0.8rem; font-weight: 600;">
                                ${p.category}
                            </span>
                        </td>
                        <td style="text-align: right;">
                            <button class="btn btn-outline btn-action" onclick="editProduct('${doc.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
                            <button class="btn btn-danger btn-action" onclick="deleteProduct('${doc.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
                        </td>
                    </tr>
                `;
            });
        }).catch(err => {
            adminProductList.innerHTML = `<tr><td colspan="4" class="text-center error-text">Error fetching data: ${err.message}</td></tr>`;
        });
    }

    // 8. Load Real Inquiries
    function loadAdminInquiries() {
        if(!adminInquiriesList) return;

        adminInquiriesList.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--secondary-color);"></i><p class="mt-2 text-muted">Retrieving secure inquiries...</p></td></tr>';

        db.collection("inquiries").orderBy("createdAt", "desc").get().then((snapshot) => {
            adminInquiriesList.innerHTML = '';

            if(snapshot.empty) {
                adminInquiriesList.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">No secure inquiries found in the database.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Format Date
                const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';
                
                // Shorten Inquiry ID for display
                const shortId = doc.id.substring(0, 8).toUpperCase();

                // Status Badge styling
                let badgeClass = 'badge-warning';
                if (data.status === 'Responded' || data.status === 'Resolved') badgeClass = 'badge-success';

                adminInquiriesList.innerHTML += `
                    <tr>
                        <td><span style="font-family: monospace; color: var(--text-muted); font-weight: 600;">#${shortId}</span></td>
                        <td>${dateStr}</td>
                        <td><strong>${data.name}</strong><br><span style="color:var(--text-muted); font-size:0.85rem;">${data.email}</span></td>
                        <td>${data.subject}</td>
                        <td><span class="badge ${badgeClass}">${data.status || 'Pending Review'}</span></td>
                        <td style="text-align: right;"><button class="btn btn-outline btn-sm" onclick="alert('Viewing Inquiry ID: ${doc.id}\\n\\nMessage: ${data.message}')">Read Thread</button></td>
                    </tr>
                `;
            });
        }).catch(err => {
            adminInquiriesList.innerHTML = `<tr><td colspan="6" class="text-center error-text">Error fetching inquiries: ${err.message}</td></tr>`;
        });
    }

    // 9. Update Live Analytics Numbers
    function updateAnalytics() {
        const assetStat = document.getElementById('stat-total-assets');
        const inquiryStat = document.getElementById('stat-active-inquiries');

        if(assetStat) {
            db.collection("products").get().then(snap => {
                assetStat.textContent = snap.size;
            });
        }

        if(inquiryStat) {
            db.collection("inquiries").get().then(snap => {
                inquiryStat.textContent = snap.size;
            });
        }
    }

    // Global Functions for inline onclick handlers
    window.editProduct = (id) => {
        db.collection("products").doc(id).get().then((doc) => {
            if (doc.exists) {
                const p = doc.data();
                document.getElementById('prod-id').value = doc.id;
                document.getElementById('prod-name').value = p.name;
                document.getElementById('prod-category').value = p.category;
                document.getElementById('prod-short-desc').value = p.shortDescription;
                document.getElementById('prod-full-desc').value = p.fullDescription || '';
                document.getElementById('prod-specs').value = p.specifications || p.specs || '';
                document.getElementById('prod-image').value = p.imageUrl || '';
                
                document.getElementById('form-title').innerHTML = '<i class="fa-solid fa-pen-to-square" style="margin-right:8px;"></i> Edit Product Details';
                formContainer.style.display = 'block';
                document.querySelector('.admin-main-content').scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    window.deleteProduct = (id) => {
        if(confirm("WARNING: Are you sure you want to permanently delete this catalog entry? This action cannot be undone.")) {
            db.collection("products").doc(id).delete().then(() => {
                loadAdminProducts();
                updateAnalytics();
            });
        }
    };
});
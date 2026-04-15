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
    
    // List Elements
    const adminProductList = document.getElementById('admin-product-list');
    const adminInquiriesList = document.getElementById('admin-inquiries-list');
    const adminOrdersList = document.getElementById('admin-orders-list');

    // --- Modal & Popup Notification Logic ---

    window.showPopup = function(message, type = 'success') {
        const popup = document.getElementById('custom-popup');
        const msgEl = document.getElementById('popup-message');
        msgEl.innerHTML = message;
        if (type === 'error') popup.classList.add('error');
        else popup.classList.remove('error');
        
        popup.classList.add('show');
        if (window.popupTimer) clearTimeout(window.popupTimer);
        window.popupTimer = setTimeout(closePopup, 3500);
    };

    window.closePopup = function() {
        const popup = document.getElementById('custom-popup');
        if (popup) popup.classList.remove('show');
    };

    window.openDataModal = function(title, content) {
        document.getElementById('data-modal-title').innerHTML = title;
        document.getElementById('data-modal-content').innerHTML = content;
        document.getElementById('data-modal').classList.add('show');
    };

    window.closeDataModal = function() {
        document.getElementById('data-modal').classList.remove('show');
    };

    window.showConfirm = function(msg, onConfirm) {
        document.getElementById('confirm-modal-msg').innerHTML = msg;
        document.getElementById('confirm-modal').classList.add('show');
        const btn = document.getElementById('confirm-modal-btn');
        
        // Remove previous listeners to prevent multiple triggers
        btn.replaceWith(btn.cloneNode(true));
        const newBtn = document.getElementById('confirm-modal-btn');
        
        newBtn.addEventListener('click', () => {
            closeConfirmModal();
            onConfirm();
        });
    };

    window.closeConfirmModal = function() {
        document.getElementById('confirm-modal').classList.remove('show');
    };

    // --- 1. Authentication State Observer ---
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            loadAdminProducts();
            loadAdminOrders();
            loadAdminInquiries();
            updateAnalytics();
        } else {
            loginSection.style.display = 'flex';
            dashboardSection.style.display = 'none';
        }
    });

    // --- 2. Login Logic ---
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

    // --- 3. Logout Logic ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showConfirm("Securely terminate your session?", () => {
                auth.signOut();
            });
        });
    }

    // --- 4. Drawer & Navigation Logic ---
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
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            views.forEach(v => v.style.display = 'none');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';

            if(targetId === 'view-analytics') {
                updateAnalytics();
            }

            if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });

    // --- 5. Form Toggles ---
    if (addBtn) addBtn.addEventListener('click', () => {
        productForm.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('form-title').innerHTML = '<i class="fa-solid fa-plus" style="margin-right:8px;"></i> Add New Product';
        formContainer.style.display = 'block';
        document.querySelector('.admin-main-content').scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
    });

    // --- 6. Save/Update Product ---
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
                db.collection("products").doc(id).update(productData).then(() => {
                    formContainer.style.display = 'none';
                    loadAdminProducts();
                    updateAnalytics();
                    showPopup("Product updated successfully.");
                }).finally(() => { 
                    btn.textContent = 'Commit to Database'; 
                    btn.disabled = false; 
                });
            } else {
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                db.collection("products").add(productData).then(() => {
                    formContainer.style.display = 'none';
                    loadAdminProducts();
                    updateAnalytics();
                    showPopup("New product added to catalog.");
                }).finally(() => { 
                    btn.textContent = 'Commit to Database'; 
                    btn.disabled = false; 
                });
            }
        });
    }

    // --- 7. Load Real Products ---
    function loadAdminProducts() {
        if(!adminProductList) return;
        adminProductList.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--secondary-color);"></i><p class="mt-2 text-muted">Retrieving database entries...</p></td></tr>';

        db.collection("products").get().then((snapshot) => {
            adminProductList.innerHTML = '';
            if (snapshot.empty) {
                adminProductList.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding: 30px;">Database is currently empty. Add a new product to begin.</td></tr>';
                return;
            }

            let products = [];
            snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
            products.sort((a, b) => {
                let tA = a.createdAt ? a.createdAt.toMillis() : 0;
                let tB = b.createdAt ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });

            products.forEach(p => {
                adminProductList.innerHTML += `
                    <tr>
                        <td><img src="${p.imageUrl || 'https://via.placeholder.com/60?text=No+Img'}" alt="Asset Preview"></td>
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
                            <button class="btn btn-outline btn-action" onclick="editProduct('${p.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
                            <button class="btn btn-danger btn-action" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
                        </td>
                    </tr>
                `;
            });
        }).catch(err => {
            adminProductList.innerHTML = `<tr><td colspan="4" class="text-center error-text">Error fetching data: ${err.message}</td></tr>`;
        });
    }

    // --- 8. Load Real Orders (Fix to load all un-indexed items safely) ---
    function loadAdminOrders() {
        if(!adminOrdersList) return;
        adminOrdersList.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--secondary-color);"></i><p class="mt-2 text-muted">Retrieving order requests...</p></td></tr>';

        db.collection("orders").get().then((snapshot) => {
            adminOrdersList.innerHTML = '';
            if(snapshot.empty) {
                adminOrdersList.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">No order requests found in the database.</td></tr>';
                return;
            }

            let orders = [];
            snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
            orders.sort((a, b) => {
                let tA = a.createdAt ? a.createdAt.toMillis() : 0;
                let tB = b.createdAt ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });

            orders.forEach(data => {
                const docId = data.id;
                // Serialize safely for JS encodeURIComponent payload
                let safeData = { ...data };
                safeData.createdAtStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';
                
                const shortId = docId.substring(0, 8).toUpperCase();
                let badgeClass = 'badge-warning';
                if (data.status === 'Completed' || data.status === 'Processed') badgeClass = 'badge-success';

                let itemsHtml = '0 items';
                if(data.cart && Array.isArray(data.cart)) {
                    const totalItems = data.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                    itemsHtml = `<b>${totalItems}</b> items`;
                }

                const encodedData = encodeURIComponent(JSON.stringify(safeData));

                adminOrdersList.innerHTML += `
                    <tr>
                        <td><span style="font-family: monospace; color: var(--text-muted); font-weight: 600;">#ORD-${shortId}</span></td>
                        <td>${safeData.createdAtStr}</td>
                        <td><strong>${data.name || 'Unknown'}</strong><br><span style="color:var(--text-muted); font-size:0.85rem;">${data.company || ''}</span></td>
                        <td>${itemsHtml}</td>
                        <td><span class="badge ${badgeClass}">${data.status || 'Pending'}</span></td>
                        <td style="text-align: right;">
                            <button class="btn btn-outline btn-sm btn-action" onclick="viewOrder('${encodedData}')" title="View Order"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn btn-danger btn-sm btn-action" onclick="deleteOrder('${docId}')" title="Delete Order"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }).catch(err => {
            adminOrdersList.innerHTML = `<tr><td colspan="6" class="text-center error-text">Error fetching orders: ${err.message}</td></tr>`;
        });
    }

    // --- 9. Load Real Inquiries ---
    function loadAdminInquiries() {
        if(!adminInquiriesList) return;
        adminInquiriesList.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--secondary-color);"></i><p class="mt-2 text-muted">Retrieving secure inquiries...</p></td></tr>';

        db.collection("inquiries").get().then((snapshot) => {
            adminInquiriesList.innerHTML = '';
            if(snapshot.empty) {
                adminInquiriesList.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">No secure inquiries found in the database.</td></tr>';
                return;
            }

            let inquiries = [];
            snapshot.forEach(doc => inquiries.push({ id: doc.id, ...doc.data() }));
            inquiries.sort((a, b) => {
                let tA = a.createdAt ? a.createdAt.toMillis() : 0;
                let tB = b.createdAt ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });

            inquiries.forEach(data => {
                const docId = data.id;
                let safeData = { ...data };
                safeData.createdAtStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';
                
                const shortId = docId.substring(0, 8).toUpperCase();
                let badgeClass = 'badge-warning';
                if (data.status === 'Responded' || data.status === 'Resolved') badgeClass = 'badge-success';

                const encodedData = encodeURIComponent(JSON.stringify(safeData));

                adminInquiriesList.innerHTML += `
                    <tr>
                        <td><span style="font-family: monospace; color: var(--text-muted); font-weight: 600;">#INQ-${shortId}</span></td>
                        <td>${safeData.createdAtStr}</td>
                        <td><strong>${data.name}</strong><br><span style="color:var(--text-muted); font-size:0.85rem;">${data.email}</span></td>
                        <td>${data.subject}</td>
                        <td><span class="badge ${badgeClass}">${data.status || 'Pending Review'}</span></td>
                        <td style="text-align: right;">
                            <button class="btn btn-outline btn-sm btn-action" onclick="viewInquiry('${encodedData}')" title="Read Inquiry"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn btn-danger btn-sm btn-action" onclick="deleteInquiry('${docId}')" title="Delete Inquiry"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }).catch(err => {
            adminInquiriesList.innerHTML = `<tr><td colspan="6" class="text-center error-text">Error fetching inquiries: ${err.message}</td></tr>`;
        });
    }

    // --- 10. Update Live Analytics Numbers ---
    function updateAnalytics() {
        const assetStat = document.getElementById('stat-total-assets');
        const inquiryStat = document.getElementById('stat-active-inquiries');
        const orderStat = document.getElementById('stat-active-orders');

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
        if(orderStat) {
            db.collection("orders").get().then(snap => {
                orderStat.textContent = snap.size;
            });
        }
    }

    // --- Global View/Action Functions ---
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
        showConfirm("WARNING: Are you sure you want to permanently delete this catalog entry? This action cannot be undone.", () => {
            db.collection("products").doc(id).delete().then(() => {
                showPopup("<i class='fa-solid fa-trash'></i> Product removed from catalog.");
                loadAdminProducts();
                updateAnalytics();
            });
        });
    };
    
    window.deleteInquiry = (id) => {
        showConfirm("Are you sure you want to permanently delete this inquiry? This action cannot be undone.", () => {
            db.collection("inquiries").doc(id).delete().then(() => {
                showPopup("<i class='fa-solid fa-trash'></i> Inquiry deleted successfully.");
                loadAdminInquiries();
                updateAnalytics();
            });
        });
    };
    
    window.deleteOrder = (id) => {
        showConfirm("Are you sure you want to permanently delete this order request? This action cannot be undone.", () => {
            db.collection("orders").doc(id).delete().then(() => {
                showPopup("<i class='fa-solid fa-trash'></i> Order request deleted.");
                loadAdminOrders();
                updateAnalytics();
            });
        });
    };
    
    window.viewOrder = (encodedData) => {
        const data = JSON.parse(decodeURIComponent(encodedData));
        
        let cartHtml = '<p class="text-muted">No items in cart.</p>';
        if(data.cart && Array.isArray(data.cart) && data.cart.length > 0) {
            cartHtml = '<ul style="list-style-type: none; padding: 0; margin: 0;">';
            data.cart.forEach(item => {
                cartHtml += `<li style="padding: 12px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                    <span><strong style="color:var(--primary-color);">${item.quantity}x</strong> ${item.name}</span>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">${item.category}</span>
                </li>`;
            });
            cartHtml += '</ul>';
        }

        const html = `
            <div style="font-size: 0.95rem;">
                <div style="background: var(--bg-light); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border-color);">
                    <p style="margin-bottom: 8px;"><strong>Client Name:</strong> ${data.name || 'N/A'}</p>
                    <p style="margin-bottom: 8px;"><strong>Institute / Company:</strong> ${data.company || 'N/A'}</p>
                    <p style="margin-bottom: 8px;"><strong>Email:</strong> <a href="mailto:${data.email}">${data.email || 'N/A'}</a></p>
                    <p style="margin-bottom: 8px;"><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
                    <p style="margin-bottom: 0;"><strong>Address:</strong> ${data.address || 'N/A'}</p>
                </div>
                <h4 style="margin-bottom: 15px; color: var(--primary-color); border-bottom: 2px solid var(--border-color); padding-bottom: 5px;">Requested Items</h4>
                ${cartHtml}
            </div>
        `;
        openDataModal(`<i class="fa-solid fa-cart-shopping logo-icon"></i> Order Request Details`, html);
    };

    window.viewInquiry = (encodedData) => {
        const data = JSON.parse(decodeURIComponent(encodedData));
        const html = `
            <div style="font-size: 0.95rem;">
                <div style="background: var(--bg-light); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border-color);">
                    <p style="margin-bottom: 8px;"><strong>Sender:</strong> ${data.name || 'N/A'}</p>
                    <p style="margin-bottom: 8px;"><strong>Email:</strong> <a href="mailto:${data.email}">${data.email || 'N/A'}</a></p>
                    <p style="margin-bottom: 0;"><strong>Subject:</strong> ${data.subject || 'N/A'}</p>
                </div>
                <h4 style="margin-bottom: 15px; color: var(--primary-color); border-bottom: 2px solid var(--border-color); padding-bottom: 5px;">Message</h4>
                <p style="white-space: pre-wrap; color: var(--text-dark); background: white; padding: 20px; border: 1px solid var(--border-color); border-radius: 8px; line-height: 1.6;">${data.message || 'No message content.'}</p>
            </div>
        `;
        openDataModal(`<i class="fa-solid fa-envelope logo-icon"></i> Inquiry Details`, html);
    };
});
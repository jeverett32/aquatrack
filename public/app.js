document.addEventListener('DOMContentLoaded', () => {

    // --- AWS Configuration (COMMENTED OUT FOR NOW) ---
    // const awsConfig = {
    //     region: 'YOUR_AWS_REGION', // e.g., 'us-east-1'
    //     cognito: {
    //         userPoolId: 'YOUR_COGNITO_USER_POOL_ID',
    //         clientId: 'YOUR_COGNITO_APP_CLIENT_ID',
    //         identityPoolId: 'YOUR_COGNITO_IDENTITY_POOL_ID'
    //     },
    //     dynamoDB: {
    //         wellProjectsTable: 'well_projects',
    //         savedProjectsTable: 'saved_projects'
    //     }
    // };

    // // Configure AWS SDK (Ensure AWS object exists from global script)
    // if (typeof AWS !== 'undefined') {
    //     AWS.config.update({ region: awsConfig.region });
    // } else {
    //     console.error("AWS SDK not loaded!");
    //     showMessage("Critical error: AWS SDK failed to load.", true);
    //     // return; // Don't return, let other parts of the app run
    // }

    // --- App State ---
    let map;
    let currentUser = null; 
    let isAdmin = false;
    const ADMIN_EMAIL = "admin@example.com"; // Dummy admin email
    let markers = [];
    // let dynamoDbClient; // Will not be initialized without AWS SDK

    // --- UI & NAVIGATION ---
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    const projectModal = document.getElementById('project-modal');
    const projectForm = document.getElementById('project-form');
    const modalTitle = document.getElementById('modal-title');


    function showPage(pageId) {
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        window.scrollTo(0, 0);

        if (pageId === 'map-page') {
            setTimeout(() => initMap(), 10); 
        } else if (pageId === 'dashboard') {
            loadDashboard(); // Will call dummy loadDashboard
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId) {
                showPage(pageId);
            }
        });
    });

    // --- CUSTOM MESSAGE BOX ---
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    function showMessage(message, isError = false) {
        messageText.textContent = message;
        messageBox.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
        messageBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
        setTimeout(() => messageBox.classList.add('hidden'), 3000);
    }

    // --- MAP INITIALIZATION ---
    function initMap() {
        // Ensure Leaflet (L) is loaded
        if (typeof L === 'undefined') {
             console.error("Leaflet library not loaded!");
             showMessage("Error: Map library failed to load.", true);
             return;
        }
        
        if (map && map.getContainer()._leaflet_id) { // Check if map is already initialized
            setTimeout(() => map.invalidateSize(), 10);
            return;
        }

        map = L.map('map', {
            minZoom: 3, maxZoom: 18,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0
        }).setView([10, 0], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            noWrap: true
        }).addTo(map);
        
        // Call dummy function for now
        fetchAndDisplayWells(); 
    }
    
    // --- Dummy Authentication Functions (No AWS) ---
    function checkSession() {
        console.log("Dummy checkSession: No AWS setup, assuming logged out.");
        updateUIForLoggedOutUser();
    }
    
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        console.log(`Dummy Register: Name: ${name}, Email: ${email}, Password: ${password}`);
        showMessage("Dummy Registration: Functionality disabled without AWS.", true);
        showPage('login');
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        console.log(`Dummy Login: Email: ${email}, Password: ${password}`);

        if (email === ADMIN_EMAIL && password === "password") { // Simple dummy admin login
            currentUser = { id: "dummy-admin-id", email: ADMIN_EMAIL, name: "Admin User" };
            isAdmin = true;
            showMessage("Dummy Login Successful (Admin User).");
            updateUIForLoggedInUser(currentUser);
            showPage('home');
        } else if (email === "user@example.com" && password === "password") { // Simple dummy user login
             currentUser = { id: "dummy-user-id", email: "user@example.com", name: "Regular User" };
             isAdmin = false;
             showMessage("Dummy Login Successful (Regular User).");
             updateUIForLoggedInUser(currentUser);
             showPage('home');
        }
        else {
            showMessage("Dummy Login Failed: Invalid credentials or AWS not set up.", true);
        }
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        console.log("Dummy Logout: User logged out.");
        currentUser = null;
        isAdmin = false;
        updateUIForLoggedOutUser();
        showMessage("Logged out successfully.");
        showPage('home');
    });

    function updateUIForLoggedInUser(user) {
        currentUser = user; // Set global current user
        isAdmin = user.email === ADMIN_EMAIL; // Set global admin status
        
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('user-menu').classList.remove('hidden');
        document.getElementById('dashboard-nav').classList.remove('hidden');
        if (isAdmin) {
            document.getElementById('add-project-btn').classList.remove('hidden');
        }
    }

    function updateUIForLoggedOutUser() {
        currentUser = null;
        isAdmin = false;

        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('user-menu').classList.add('hidden');
        document.getElementById('dashboard-nav').classList.add('hidden');
        document.getElementById('add-project-btn').classList.add('hidden');
        if (document.getElementById('dashboard')?.classList.contains('active')) {
            showPage('home');
        }
    }
    
    // --- Dummy Data and Functions (No AWS) ---
    let dummyProjects = [
        { id: "proj1", title: "Kenya Water Project", lat: 0.0236, lng: 37.9062, image: "https://via.placeholder.com/300x200?text=Kenya", status: "Funding", description: "Bringing clean water to a remote village in Kenya.", contribution: "Donate to our NGO partner." },
        { id: "proj2", title: "Uganda Borehole Initiative", lat: 1.3733, lng: 32.2903, image: "https://via.placeholder.com/300x200?text=Uganda", status: "In Progress", description: "Drilling new boreholes in rural Uganda.", contribution: "Volunteer on the ground." },
        { id: "proj3", title: "Ethiopia Sanitation Program", lat: 9.1450, lng: 40.4897, image: "https://via.placeholder.com/300x200?text=Ethiopia", status: "Complete", description: "Completed a sanitation and water access project.", contribution: "Spread the word about our success." },
         { id: "proj4", title: "Tanzania Well Repair", lat: -6.3690, lng: 34.8888, image: "https://via.placeholder.com/300x200?text=Tanzania", status: "Funding", description: "Repairing a broken well serving 500 people.", contribution: "Any amount helps fund the repairs." },
         { id: "proj5", title: "Rwanda Community Tap", lat: -1.9403, lng: 29.8739, image: "https://via.placeholder.com/300x200?text=Rwanda", status: "In Progress", description: "Installing a communal tap in a growing community.", contribution: "Local volunteers needed for distribution." },
    ];
    let dummySavedProjects = []; // Stores IDs of projects saved by the dummy user

    async function fetchAndDisplayWells() {
        console.log("Dummy fetchAndDisplayWells: Loading dummy data.");
        if (!map) { console.error("Map not initialized before fetching wells."); return; }

        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        dummyProjects.forEach(item => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lng);
            if (isNaN(lat) || isNaN(lng)) {
                console.warn(`Skipping project "${item.title}" due to invalid coordinates:`, item.lat, item.lng);
                return;
            }
            const marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(`<b>${item.title || 'Untitled'}</b><br>${item.status || 'No Status'}<br><a href="#" class="view-project-link" data-id="${item.id}">View Details</a>`);
            markers.push(marker);
        });
    }

    async function showProjectDetail(projectId) { 
        console.log(`Dummy showProjectDetail: Showing details for ${projectId}`);
        const project = dummyProjects.find(p => p.id === projectId);
        
        if (project) {
            let savedButtonHtml = '';
            if(currentUser){
                const isSaved = dummySavedProjects.includes(projectId);
                savedButtonHtml = `<button id="save-project-btn" data-id="${projectId}" class="${isSaved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-amber-500 hover:bg-amber-600'} text-white font-bold py-2 px-4 rounded transition">
                                        <i class="fas fa-star"></i> ${isSaved ? 'Unsave Project' : 'Save Project'}
                                    </button>`;
            }

            let adminButtonsHtml = '';
            if (isAdmin) {
                adminButtonsHtml = `
                    <button id="edit-project-detail-btn" data-id="${projectId}" class="bg-yellow-500 text-white font-bold py-2 px-4 rounded transition hover:bg-yellow-600">Edit</button>
                    <button id="delete-project-detail-btn" data-id="${projectId}" class="bg-red-500 text-white font-bold py-2 px-4 rounded transition hover:bg-red-600">Delete</button>
                `;
            }
            
            const projectDetailContainer = document.getElementById('project-detail');
            projectDetailContainer.innerHTML = `
                <div class="bg-white p-8 rounded-lg shadow-soft">
                    <img src="${project.image || 'https://via.placeholder.com/600x400?text=Image+Not+Found'}" alt="${project.title}" class="w-full h-96 object-cover rounded-lg mb-6">
                    <div class="flex justify-between items-start mb-4">
                            <h2 class="text-4xl font-bold text-teal-800">${project.title || 'Untitled Project'}</h2>
                            <span class="text-sm font-semibold px-3 py-1 rounded-full ${project.status === 'Complete' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}">${project.status || 'Unknown'}</span>
                    </div>
                    <p class="text-gray-700 text-lg mb-6">${project.description || 'No description available.'}</p>
                    <div class="bg-stone-50 p-6 rounded-lg border border-stone-200">
                        <h3 class="text-2xl font-bold mb-2 text-teal-700">How to Contribute</h3>
                        <p class="text-gray-700">${project.contribution || 'Information on contributions is not available.'}</p>
                    </div>
                    <div class="mt-6 flex items-center space-x-4">
                        ${savedButtonHtml}
                        ${adminButtonsHtml}
                    </div>
                </div>`;
            showPage('project-detail');

        } else {
            showMessage("Dummy Project not found.", true);
            showPage('map-page');
        }
    }

    async function loadDashboard() { 
        console.log("Dummy loadDashboard: Loading saved projects for current user.");
        const savedContainer = document.getElementById('saved-projects-container');
        const noSavedProjectsMsg = document.getElementById('no-saved-projects');

        savedContainer.innerHTML = ''; // Clear previous items

        if (!currentUser || dummySavedProjects.length === 0) {
            noSavedProjectsMsg.classList.remove('hidden');
            savedContainer.appendChild(noSavedProjectsMsg);
            return;
        }

        noSavedProjectsMsg.classList.add('hidden');

        dummySavedProjects.forEach(projectId => {
            const project = dummyProjects.find(p => p.id === projectId);
            if (project) {
                const card = document.createElement('div');
                card.className = "bg-white rounded-lg shadow-soft overflow-hidden";
                card.innerHTML = `
                    <img src="${project.image || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${project.title}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="text-xl font-bold text-teal-800">${project.title || 'Untitled'}</h3>
                        <p class="text-sm text-gray-500 mb-2">${project.status || 'Unknown'}</p>
                        <p class="text-gray-700 text-sm mb-4">${(project.description || '').substring(0, 100)}...</p>
                        <button class="view-project-link w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition" data-id="${project.id}">View Details</button>
                    </div>
                `;
                savedContainer.appendChild(card);
            }
        });
    }
    
    // --- Dummy Admin Functionality ---
    document.getElementById('add-project-btn').addEventListener('click', () => {
         if (!isAdmin) return showMessage("Access denied. Log in as admin@example.com / password.", true);
        projectForm.reset();
        document.getElementById('project-id').value = '';
        modalTitle.textContent = "Add New Project (Dummy)";
        projectModal.classList.remove('hidden');
    });
    
    document.getElementById('cancel-modal-btn').addEventListener('click', () => {
        projectModal.classList.add('hidden');
    });

    projectForm.addEventListener('submit', async (e) => {
         e.preventDefault();
         if (!isAdmin) return showMessage("Action not allowed. Log in as admin@example.com / password.", true);
         
         const id = document.getElementById('project-id').value || 'proj' + (dummyProjects.length + 1);
         const projectData = {
            id: id,
            title: document.getElementById('project-title').value,
            lat: parseFloat(document.getElementById('project-lat').value),
            lng: parseFloat(document.getElementById('project-lng').value),
            image: document.getElementById('project-image').value,
            status: document.getElementById('project-status').value,
            description: document.getElementById('project-description').value,
            contribution: document.getElementById('project-contribution').value,
         };

         if (isNaN(projectData.lat) || isNaN(projectData.lng)) {
              return showMessage("Latitude and Longitude must be valid numbers.", true);
         }

         const existingIndex = dummyProjects.findIndex(p => p.id === id);
         if (existingIndex !== -1) {
             dummyProjects[existingIndex] = projectData; // Update
             showMessage("Dummy Project updated successfully!");
         } else {
             dummyProjects.push(projectData); // Add
             showMessage("Dummy Project added successfully!");
         }
         
         console.log("Current dummyProjects:", dummyProjects);
         projectModal.classList.add('hidden');
         fetchAndDisplayWells(); // Refresh map with dummy data
         showPage('map-page');
    });
    
    async function openEditModal(projectId) {
         if (!isAdmin) return showMessage("Action not allowed. Log in as admin@example.com / password.", true);
        
        const project = dummyProjects.find(p => p.id === projectId);
        if (project) {
            document.getElementById('project-id').value = projectId;
            document.getElementById('project-title').value = project.title || '';
            document.getElementById('project-lat').value = project.lat || '';
            document.getElementById('project-lng').value = project.lng || '';
            document.getElementById('project-image').value = project.image || '';
            document.getElementById('project-status').value = project.status || 'Funding';
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-contribution').value = project.contribution || '';
            
            modalTitle.textContent = "Edit Project (Dummy)";
            projectModal.classList.remove('hidden');
        } else {
             showMessage("Dummy Project not found.", true);
        }
    }
    
    async function deleteProject(projectId) {
        if (!isAdmin) return showMessage("Action not allowed. Log in as admin@example.com / password.", true);

        if (confirm("Are you sure you want to delete this dummy project?")) {
            dummyProjects = dummyProjects.filter(p => p.id !== projectId);
            dummySavedProjects = dummySavedProjects.filter(id => id !== projectId); // Remove from saved too
            showMessage("Dummy Project deleted successfully.");
            console.log("Current dummyProjects:", dummyProjects);
            showPage('map-page');
            fetchAndDisplayWells();
        }
    }

    // --- GLOBAL EVENT LISTENERS (for dynamically added content) ---
    document.addEventListener('click', async (e) => {
        // View project button on cards (map popup or dashboard)
        if (e.target.matches('.view-project-link[data-id]')) {
            e.preventDefault();
            const projectId = e.target.dataset.id;
            showProjectDetail(projectId);
        }
        // Save project button on detail page
        if (e.target.matches('#save-project-btn')) {
            e.preventDefault();
            if (!currentUser) return showMessage("Please log in to save projects (dummy).", true);

            const projectId = e.target.dataset.id;
            const isCurrentlySaved = dummySavedProjects.includes(projectId);

            if (isCurrentlySaved) {
                dummySavedProjects = dummySavedProjects.filter(id => id !== projectId);
                showMessage("Dummy Project unsaved.");
                e.target.innerHTML = '<i class="fas fa-star"></i> Save Project';
                e.target.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
                e.target.classList.add('bg-amber-500', 'hover:bg-amber-600');
            } else {
                dummySavedProjects.push(projectId);
                showMessage("Dummy Project saved!");
                e.target.innerHTML = '<i class="fas fa-star"></i> Unsave Project';
                e.target.classList.remove('bg-amber-500', 'hover:bg-amber-600');
                e.target.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
            }
            console.log("Dummy Saved Projects:", dummySavedProjects);
        }
        // Admin buttons on detail page
        if (e.target.matches('#edit-project-detail-btn')) {
            openEditModal(e.target.dataset.id);
        }
        if (e.target.matches('#delete-project-detail-btn')) {
            deleteProject(e.target.dataset.id);
        }
    });

    // --- Initial Load ---
    checkSession(); // Will call dummy checkSession
    showPage('home'); // Show home page initially

}); // End DOMContentLoaded

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
    let allProjects = []; // New global variable to store fetched projects
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
    
    // --- Data and Functions ---

    async function fetchAndDisplayWells() {
        if (!map) { console.error("Map not initialized before fetching wells."); return; }

        // Clear existing markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        allProjects = []; // Clear previous projects

        try {
            const response = await fetch('/api/projects');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const projects = await response.json();
            allProjects = projects; // Store fetched projects globally

            allProjects.forEach(project => {
                const lat = parseFloat(project.projectlatitude);
                const lng = parseFloat(project.projectlongitude);

                if (isNaN(lat) || isNaN(lng)) {
                    console.warn(`Skipping project "${project.projectname}" due to invalid coordinates:`, project.projectlatitude, project.projectlongitude);
                    return;
                }

                const marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(`<b>${project.projecttitle || 'Untitled'}</b><br>${project.projectstatus || 'No Status'}<br><a href="#" class="view-project-link" data-id="${project.projectid}">View Details</a>`);
                markers.push(marker);
            });
        } catch (error) {
            console.error("Error fetching projects:", error);
            showMessage("Failed to load projects. Please try again later.", true);
        }
    }

    async function showProjectDetail(projectId) { 
        console.log(`Showing details for project ID: ${projectId}`);
        const project = allProjects.find(p => p.projectid === parseInt(projectId, 10));
        
        if (project) {
            let savedButtonHtml = '';
            if(currentUser){
                // This logic will be replaced by actual saved status from backend later
                savedButtonHtml = `<button id="save-project-btn" data-id="${projectId}" class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded transition">
                                        <i class="fas fa-star"></i> Save Project
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
                    <img src="${project.projectimageurl || 'https://via.placeholder.com/600x400?text=Image+Not+Found'}" alt="${project.projecttitle}" class="w-full h-96 object-cover rounded-lg mb-6">
                    <div class="flex justify-between items-start mb-4">
                            <h2 class="text-4xl font-bold text-teal-800">${project.projecttitle || 'Untitled Project'}</h2>
                            <span class="text-sm font-semibold px-3 py-1 rounded-full ${project.projectstatus === 'Complete' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}">${project.projectstatus || 'Unknown'}</span>
                    </div>
                    <p class="text-gray-700 text-lg mb-6">${project.projectdescription || 'No description available.'}</p>
                    <div class="bg-stone-50 p-6 rounded-lg border border-stone-200">
                        <h3 class="text-2xl font-bold mb-2 text-teal-700">How to Contribute</h3>
                        <p class="text-gray-700">${project.projectcontributions || 'Information on contributions is not available.'}</p>
                    </div>
                    <div class="mt-6 flex items-center space-x-4">
                        ${savedButtonHtml}
                        ${adminButtonsHtml}
                    </div>
                </div>`;
            showPage('project-detail');

        } else {
            showMessage("Project not found.", true);
            showPage('map-page');
        }
    }

    async function loadDashboard() { 
        console.log("loadDashboard: Functionality not yet implemented.");
        const savedContainer = document.getElementById('saved-projects-container');
        const noSavedProjectsMsg = document.getElementById('no-saved-projects');

        savedContainer.innerHTML = ''; // Clear previous items
        noSavedProjectsMsg.classList.remove('hidden');
        noSavedProjectsMsg.textContent = "Dashboard functionality is under construction. Please log in to view saved projects (coming soon!).";
        savedContainer.appendChild(noSavedProjectsMsg);

        showMessage("Dashboard functionality is not yet implemented.", true);
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
        
        const projectId = document.getElementById('project-id').value; // Will be empty for new projects
        const projectData = {
            projectTitle: document.getElementById('project-title').value,
            projectLatitude: parseFloat(document.getElementById('project-lat').value),
            projectLongitude: parseFloat(document.getElementById('project-lng').value),
            projectImageUrl: document.getElementById('project-image').value,
            projectStatus: document.getElementById('project-status').value,
            projectDescription: document.getElementById('project-description').value,
            projectContributions: document.getElementById('project-contribution').value,
        };

        if (isNaN(projectData.projectLatitude) || isNaN(projectData.projectLongitude)) {
            return showMessage("Latitude and Longitude must be valid numbers.", true);
        }

        const method = projectId ? 'PUT' : 'POST';
        const url = projectId ? `/api/projects/${projectId}` : '/api/projects';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token') // Assuming token is stored
                },
                body: JSON.stringify(projectData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            showMessage(`Project ${projectId ? 'updated' : 'added'} successfully: ${result.message || ''}`);
            projectModal.classList.add('hidden');
            fetchAndDisplayWells(); // Refresh map with new data
            showPage('map-page');
        } catch (error) {
            console.error(`Error ${projectId ? 'updating' : 'adding'} project:`, error);
            showMessage(`Failed to ${projectId ? 'update' : 'add'} project: ${error.message}`, true);
        }
    });
    
    async function openEditModal(projectId) {
        if (!isAdmin) return showMessage("Action not allowed. Log in as admin@example.com / password.", true);
        
        const project = allProjects.find(p => p.projectid === projectId);
        if (project) {
            document.getElementById('project-id').value = projectId;
            document.getElementById('project-title').value = project.projecttitle || '';
            document.getElementById('project-lat').value = project.projectlatitude || '';
            document.getElementById('project-lng').value = project.projectlongitude || '';
            document.getElementById('project-image').value = project.projectimageurl || '';
            document.getElementById('project-status').value = project.projectstatus || 'Funding';
            document.getElementById('project-description').value = project.projectdescription || '';
            document.getElementById('project-contribution').value = project.projectcontributions || '';
            
            modalTitle.textContent = "Edit Project";
            projectModal.classList.remove('hidden');
        } else {
            showMessage("Project not found.", true);
        }
    }
    
    async function deleteProject(projectId) {
        if (!isAdmin) return showMessage("Action not allowed. Log in as admin@example.com / password.", true);

        if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            try {
                const response = await fetch(`/api/projects/${projectId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token') // Assuming token is stored
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                showMessage("Project deleted successfully.");
                fetchAndDisplayWells(); // Refresh map
                showPage('map-page');
            } catch (error) {
                console.error("Error deleting project:", error);
                showMessage(`Failed to delete project: ${error.message}`, true);
            }
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
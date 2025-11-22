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
    let savedProjects = [];
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
            loadDashboard();
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
        
        fetchAndDisplayWells(); 
    }
    
    // --- Authentication & Session Management ---
    function checkSession() {
        const token = localStorage.getItem('token');
        if (token) {
            // Here you might want to decode the token to get user info, but for now, we'll just use the presence of a token
            // For simplicity, we assume a token means a valid, non-admin user.
            // A more robust solution would be to verify the token with the server or decode it on the client.
            const user = { name: 'User', email: '' }; // Dummy user object
            updateUIForLoggedInUser(user);
        } else {
            updateUIForLoggedOutUser();
        }
    }

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userFirstName = document.getElementById('register-name').value;
        const userLastName = 'user';
        const userEmail = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail, userFirstName, userLastName, password })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message || "Registration successful! Please log in.");
                showPage('login');
            } else {
                throw new Error(result.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Registration error:", error);
            showMessage(error.message, true);
        }
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userEmail = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail, password })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('token', result.token);
                // We'll treat any logged-in user as a non-admin user for this implementation
                const user = { name: result.userFirstName || 'User', email: userEmail };
                isAdmin = false; // Hardcode isAdmin to false as per new requirements
                currentUser = user;

                showMessage("Login Successful!");
                updateUIForLoggedInUser(user);
                showPage('home');
            } else {
                throw new Error(result.message || "Login failed.");
            }
        } catch (error) {
            console.error("Login error:", error);
            showMessage(error.message, true);
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        currentUser = null;
        isAdmin = false;
        updateUIForLoggedOutUser();
        showMessage("Logged out successfully.");
        showPage('home');
    });

    function updateUIForLoggedInUser(user) {
        currentUser = user;
        isAdmin = false; // No admin functionality in this version
        
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('user-menu').classList.remove('hidden');
        document.getElementById('dashboard-nav').classList.remove('hidden');
        document.getElementById('add-project-btn').classList.add('hidden'); // No admin functionality
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
                const lat = parseFloat(project.lat);
                const lng = parseFloat(project.lng);

                if (isNaN(lat) || isNaN(lng)) {
                    console.warn(`Skipping project "${project.title}" due to invalid coordinates:`, project.lat, project.lng);
                    return;
                }

                const marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(`<b>${project.title || 'Untitled'}</b><br>${project.status || 'No Status'}<br><a href="#" class="view-project-link" data-id="${project.id}">View Details</a>`);
                markers.push(marker);
            });
        } catch (error) {
            console.error("Error fetching projects:", error);
            showMessage("Failed to load projects. Please try again later.", true);
        }
    }

    async function showProjectDetail(projectId) { 
        console.log(`Showing details for project ID: ${projectId}`);
        const project = allProjects.find(p => p.id === projectId);
        
        if (project) {
            let savedButtonHtml = '';
            const token = localStorage.getItem('token');

            if (token) {
                const isSaved = savedProjects.some(saved => saved.id === project.id);
                savedButtonHtml = `<button id="save-project-btn" data-id="${project.id}" class="${isSaved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-amber-500 hover:bg-amber-600'} text-white font-bold py-2 px-4 rounded transition">
                                        <i class="fas fa-star"></i> ${isSaved ? 'Unsave Project' : 'Save Project'}
                                    </button>`;
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
                    </div>
                </div>`;
            showPage('project-detail');

        } else {
            showMessage("Project not found.", true);
            showPage('map-page');
        }
    }

    async function loadDashboard() { 
        console.log("Loading saved projects for current user.");
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage("Please log in to see your dashboard.", true);
            showPage('login');
            return;
        }

        const savedContainer = document.getElementById('saved-projects-container');
        savedContainer.innerHTML = ''; // Clear previous items

        try {
            const response = await fetch('/api/users/saved-projects', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showMessage("Session expired. Please log in again.", true);
                    localStorage.removeItem('token');
                    updateUIForLoggedOutUser();
                    showPage('login');
                }
                throw new Error("Failed to fetch saved projects.");
            }

            savedProjects = await response.json();
            console.log("Fetched saved projects:", savedProjects);

            if (savedProjects.length === 0) {
                savedContainer.innerHTML = `<p id="no-saved-projects" class="text-gray-500">You haven't saved any projects yet.</p>`;
            } else {
                savedProjects.forEach(project => {
                    const card = document.createElement('div');
                    card.className = "bg-white rounded-lg shadow-soft overflow-hidden";
                    card.innerHTML = `
                        <img src="${project.image || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${project.title}" class="w-full h-48 object-cover">
                        <div class="p-4">
                            <h3 class="text-xl font-bold text-teal-800">${project.title || 'Untitled'}</h3>
                            <p class="text-sm text-gray-500 mb-2">${project.status || 'Unknown'}</p>
                            <p class="text-gray-700 text-sm mb-4">${(project.description || '').substring(0, 100)}...</p>
                            <button class="unsave-project-btn w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition" data-id="${project.id}">Unsave</button>
                        </div>
                    `;
                    savedContainer.appendChild(card);
                });
            }
        } catch (error) {
            console.error("Full error object from loadDashboard:", error);
            showMessage(error.message, true);
        }
    }
    
    // --- GLOBAL EVENT LISTENERS (for dynamically added content) ---
    document.addEventListener('click', async (e) => {
        // View project button on cards or map popup
        if (e.target.matches('.view-project-link[data-id]')) {
            e.preventDefault();
            const projectId = e.target.dataset.id;
            await showProjectDetail(projectId);
        }

        // Save/Unsave project button on detail page
        if (e.target.matches('#save-project-btn')) {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) return showMessage("Please log in to save projects.", true);

            const projectId = e.target.dataset.id;
            const isCurrentlySaved = savedProjects.some(p => p.id === projectId);
            
            if (isCurrentlySaved) {
                // Unsave from detail view
                await unsaveProject(projectId, e.target);
            } else {
                // Save from detail view
                await saveProject(projectId, e.target);
            }
        }

        // Unsave button on dashboard card
        if (e.target.matches('.unsave-project-btn[data-id]')) {
            e.preventDefault();
            const projectId = e.target.dataset.id;
            await unsaveProject(projectId, e.target);
        }
    });

    async function saveProject(projectId, buttonElement) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/users/saved-projects', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token 
                },
                body: JSON.stringify({ projectId: projectId })
            });

            if (!response.ok) throw new Error('Failed to save project.');

            const savedProject = await response.json();
            savedProjects.push(savedProject); // Add to local list
            
            showMessage("Project saved!");
            if (buttonElement) { // Update button style if it exists
                buttonElement.innerHTML = '<i class="fas fa-star"></i> Unsave Project';
                buttonElement.classList.remove('bg-amber-500', 'hover:bg-amber-600');
                buttonElement.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
            }
        } catch (error) {
            console.error("Error saving project:", error);
            showMessage(error.message, true);
        }
    }

    async function unsaveProject(projectId, buttonElement) {
        const token = localStorage.getItem('token');
        if (!confirm("Are you sure you want to unsave this project?")) return;
        
        try {
            const response = await fetch(`/api/users/saved-projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (!response.ok) throw new Error('Failed to unsave project.');

            savedProjects = savedProjects.filter(p => p.id !== projectId); // Remove from local list
            showMessage("Project unsaved successfully.");

            // If on dashboard, reload it. If on detail page, update the button.
            if (buttonElement && buttonElement.closest('.page.active')?.id === 'dashboard') {
                loadDashboard();
            } else if (buttonElement) {
                buttonElement.innerHTML = '<i class="fas fa-star"></i> Save Project';
                buttonElement.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
                buttonElement.classList.add('bg-amber-500', 'hover:bg-amber-600');
            }
        } catch (error) {
            console.error("Error unsaving project:", error);
            showMessage(error.message, true);
        }
    }


    // --- Initial Load ---
    checkSession(); 
    showPage('home'); // Show home page initially

}); // End DOMContentLoaded
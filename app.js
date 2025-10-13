// This event listener ensures that the code inside it only runs
// after the entire HTML document has been loaded and is ready.
document.addEventListener('DOMContentLoaded', () => {

    // --- AWS Configuration ---
    // IMPORTANT: You must configure these values from your AWS account.
    // 1. Create a Cognito User Pool for authentication.
    // 2. Create a Cognito Identity Pool to grant temporary AWS credentials to users.
    // 3. Create two DynamoDB tables: 'well_projects' and 'saved_projects'.
    const awsConfig = {
        region: 'YOUR_AWS_REGION', // e.g., 'us-east-1'
        cognito: {
            userPoolId: 'YOUR_COGNITO_USER_POOL_ID',
            clientId: 'YOUR_COGNITO_APP_CLIENT_ID',
            identityPoolId: 'YOUR_COGNITO_IDENTITY_POOL_ID'
        },
        dynamoDB: {
            wellProjectsTable: 'well_projects',
            savedProjectsTable: 'saved_projects'
        }
    };

    // Configure AWS SDK
    AWS.config.update({ region: awsConfig.region });

    // --- App State ---
    let map;
    let currentUser = null; // Will store user info from Cognito
    let isAdmin = false;
    const ADMIN_EMAIL = "your-admin-email@example.com"; // Set your admin email here
    let markers = [];
    let dynamoDbClient;

    // --- UI & NAVIGATION ---
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');

    function showPage(pageId) {
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        window.scrollTo(0, 0);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId) {
                showPage(pageId);
                if (pageId === 'map-page') {
                    setTimeout(() => initMap(), 10);
                }
                if (pageId === 'dashboard') {
                    loadDashboard();
                }
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
        if (document.getElementById('map')._leaflet_id) {
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
    
    // --- AWS Authentication (Cognito) ---
    // This section requires the Amazon Cognito Identity SDK. 
    // The main AWS SDK (`aws-sdk.min.js`) does not include this by default.
    // For a real project, you'd add another script tag for the Cognito Identity SDK.
    // Since we can't add it here, this part of the code is conceptual.
    let userPool;
    try {
        userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: awsConfig.cognito.userPoolId,
            ClientId: awsConfig.cognito.clientId,
        });
    } catch (e) {
        console.warn("Amazon Cognito Identity SDK not found. Authentication will not work.");
        console.warn("To fix this, add the following script to your HTML head: <script src='https://raw.githubusercontent.com/aws/amazon-cognito-identity-js/master/dist/amazon-cognito-identity.min.js'></script>");
    }


    function getCognitoUser(email) {
        if (!userPool) return null;
        return new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });
    }
    
    // Check for a user session on load
    function checkSession() {
        if (!userPool) return updateUIForLoggedOutUser();
        const cognitoUser = userPool.getCurrentUser();

        if (cognitoUser != null) {
            cognitoUser.getSession((err, session) => {
                if (err) {
                    updateUIForLoggedOutUser();
                    return;
                }
                if (session.isValid()) {
                    cognitoUser.getUserAttributes((err, attributes) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        const userData = {
                            id: cognitoUser.getUsername(),
                            email: attributes.find(attr => attr.Name === 'email').Value,
                            name: attributes.find(attr => attr.Name === 'name').Value
                        };
                        setupAwsCredentials(session.getIdToken().getJwtToken());
                        updateUIForLoggedInUser(userData);
                    });
                } else {
                     updateUIForLoggedOutUser();
                }
            });
        } else {
             updateUIForLoggedOutUser();
        }
    }
    
    function setupAwsCredentials(idToken) {
        const logins = {};
        logins[`cognito-idp.${awsConfig.region}.amazonaws.com/${awsConfig.cognito.userPoolId}`] = idToken;
        
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: awsConfig.cognito.identityPoolId,
            Logins: logins
        });
        
        AWS.config.credentials.refresh(error => {
            if (error) {
                console.error("Credential refresh error:", error);
            } else {
                // Initialize DynamoDB client now that we have credentials
                dynamoDbClient = new AWS.DynamoDB.DocumentClient();
                // After logging in, try to load map data
                if(document.getElementById('map-page').classList.contains('active')) {
                    fetchAndDisplayWells();
                }
            }
        });
    }

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!userPool) {
            showMessage("Authentication service is not available.", true);
            return;
        }

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        const attributeList = [
            new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'name', Value: name }),
            new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email })
        ];

        userPool.signUp(email, password, attributeList, null, (err, result) => {
            if (err) {
                showMessage(err.message || JSON.stringify(err), true);
                return;
            }
            showMessage("Registration successful! Please log in.", false);
            showPage('login');
        });
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const cognitoUser = getCognitoUser(email);
        
        if (!cognitoUser) {
            showMessage("Authentication service is not available.", true);
            return;
        }

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password,
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (session) => {
                 cognitoUser.getUserAttributes((err, attributes) => {
                    if (err) { console.error(err); return; }
                     const userData = {
                        id: cognitoUser.getUsername(),
                        email: attributes.find(attr => attr.Name === 'email').Value,
                        name: attributes.find(attr => attr.Name === 'name').Value
                    };
                    setupAwsCredentials(session.getIdToken().getJwtToken());
                    updateUIForLoggedInUser(userData);
                    showMessage("Logged in successfully!");
                    showPage('home');
                });
            },
            onFailure: (err) => {
                showMessage(err.message || JSON.stringify(err), true);
            },
        });
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (!userPool) return;
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
        if(AWS.config.credentials) {
            AWS.config.credentials.clearCachedId();
        }
        updateUIForLoggedOutUser();
        showMessage("Logged out successfully.");
        showPage('home');
    });

    function updateUIForLoggedInUser(user) {
        currentUser = user;
        isAdmin = user.email === ADMIN_EMAIL;
        
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
        dynamoDbClient = null;

        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('user-menu').classList.add('hidden');
        document.getElementById('dashboard-nav').classList.add('hidden');
        document.getElementById('add-project-btn').classList.add('hidden');
        if (document.getElementById('dashboard')?.classList.contains('active')) {
            showPage('home');
        }
    }
    
    // --- AWS Database (DynamoDB) ---
    async function fetchAndDisplayWells() {
        if (!dynamoDbClient) {
             console.warn("DynamoDB client not ready. Must be logged in.");
             return;
        }
        
        const params = { TableName: awsConfig.dynamoDB.wellProjectsTable };
        
        try {
            const data = await dynamoDbClient.scan(params).promise();
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
            data.Items.forEach(item => {
                const marker = L.marker([parseFloat(item.lat), parseFloat(item.lng)]).addTo(map);
                marker.bindPopup(`<b>${item.title}</b><br>${item.status}<br><a href="#" class="view-project-link" data-id="${item.id}">View Details</a>`);
                markers.push(marker);
            });
        } catch(err) {
            console.error("Error scanning DynamoDB:", err);
            showMessage("Could not load well projects.", true);
        }
    }

    // The remaining database functions need to be fully implemented with DynamoDB logic.
    // This is a complex task. The following are stubs with console messages.
    async function showProjectDetail(projectId) { 
        if (!dynamoDbClient) { return showMessage("Please log in to view project details.", true); }
        console.log("TODO: Implement showProjectDetail with DynamoDB `get` for projectId:", projectId);
        showMessage("Functionality to show project detail is not fully implemented for AWS.", true);
    }
    async function loadDashboard() { 
        if (!dynamoDbClient || !currentUser) { return showMessage("Please log in to view the dashboard.", true); }
        console.log("TODO: Implement loadDashboard with DynamoDB `query` for userId:", currentUser.id);
        showMessage("Dashboard functionality is not fully implemented for AWS.", true);
    }
    async function toggleSaveProject(userId, projectId) { 
        if (!dynamoDbClient) { return showMessage("Please log in to save projects.", true); }
        console.log("TODO: Implement toggleSaveProject with DynamoDB `put` and `delete` for userId:", userId, "and projectId:", projectId);
        showMessage("Save project functionality is not fully implemented for AWS.", true);
    }
    // Admin functions also need to be rewritten for DynamoDB.
    
    
    // Initial Load
    checkSession();
    showPage('home');
});


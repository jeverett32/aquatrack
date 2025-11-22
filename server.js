const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// --- Middleware ---
// Parse JSON request bodies
app.use(express.json());
// Serve static files (CSS, client-side JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Dummy Data Store ---
// NOTE: This is for demonstration only. In a real app, use a database.
// To test login, use email: "test@example.com", password: "password"
const users = [
    { id: 'user1', userEmail: 'test@example.com', userFirstName: 'Test', userLastName: 'User', password: 'password' }
];
const projects = [
    { id: "proj1", projecttitle: "Kenya Water Project", projectlatitude: 0.0236, projectlongitude: 37.9062, projectimage: "https://via.placeholder.com/300x200?text=Kenya", projectstatus: "Funding", projectdescription: "Bringing clean water to a remote village in Kenya.", projectcontribution: "Donate to our NGO partner." },
    { id: "proj2", projecttitle: "Uganda Borehole Initiative", projectlatitude: 1.3733, projectlongitude: 32.2903, projectimage: "https://via.placeholder.com/300x200?text=Uganda", projectstatus: "In Progress", projectdescription: "Drilling new boreholes in rural Uganda.", projectcontribution: "Volunteer on the ground." },
    { id: "proj3", projecttitle: "Ethiopia Sanitation Program", projectlatitude: 9.1450, projectlongitude: 40.4897, projectimage: "https://via.placeholder.com/300x200?text=Ethiopia", projectstatus: "Complete", projectdescription: "Completed a sanitation and water access project.", projectcontribution: "Spread the word about our success." }
];
// Pre-save a project for our test user
const savedProjects = {
    'user1': ['proj2'] 
};


// --- API Routes ---

// Registration
app.post('/api/register', (req, res) => {
    const { userEmail, userFirstName, userLastName, password } = req.body;
    if (!userEmail || !password || !userFirstName) {
        return res.status(400).json({ message: "Email, first name, and password are required." });
    }
    if (users.find(u => u.userEmail === userEmail)) {
        return res.status(409).json({ message: "An account with this email already exists." });
    }
    const newUser = { id: `user${users.length + 1}`, userEmail, userFirstName, userLastName, password }; // In a real app, hash the password!
    users.push(newUser);
    console.log("Users:", users);
    res.status(201).json({ message: "User registered successfully!" });
});

// Login
app.post('/api/login', (req, res) => {
    const { userEmail, password } = req.body;
    const user = users.find(u => u.userEmail === userEmail && u.password === password);
    if (user) {
        // In a real app, generate a real JWT token.
        const dummyToken = `fake-jwt-for-${user.id}`;
        res.json({ token: dummyToken, userFirstName: user.userFirstName });
    } else {
        res.status(401).json({ message: "Invalid email or password." });
    }
});

// Get all projects
app.get('/api/projects', (req, res) => {
    res.json(projects);
});

// --- "Authenticated" Routes ---

// Middleware to "verify" our dummy token
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authorization token is missing or invalid." });
    }
    const token = authHeader.split(' ')[1];
    // In our dummy app, the token is "fake-jwt-for-userId"
    const userId = token.replace('fake-jwt-for-', '');
    const user = users.find(u => u.id === userId);

    if (user) {
        req.user = user; // Attach user to the request
        next();
    } else {
        res.status(401).json({ message: "Invalid token." });
    }
};

// Get saved projects for the logged-in user
app.get('/api/users/saved-projects', authMiddleware, (req, res) => {
    const userSaved = savedProjects[req.user.id] || [];
    const savedProjectDetails = projects.filter(p => userSaved.includes(p.id));
    res.json(savedProjectDetails);
});

// Save a project
app.post('/api/users/saved-projects', authMiddleware, (req, res) => {
    const { projectId } = req.body;
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found." });
    }

    if (!savedProjects[req.user.id]) {
        savedProjects[req.user.id] = [];
    }
    
    if (savedProjects[req.user.id].includes(projectId)) {
        return res.status(409).json({ message: "Project already saved." });
    }

    savedProjects[req.user.id].push(projectId);
    console.log("Saved Projects:", savedProjects);
    res.status(201).json(project); // Return the saved project
});

// Unsave a project
app.delete('/api/users/saved-projects/:projectId', authMiddleware, (req, res) => {
    const { projectId } = req.params;
    if (!savedProjects[req.user.id] || !savedProjects[req.user.id].includes(projectId)) {
        return res.status(404).json({ message: "Saved project not found." });
    }
    savedProjects[req.user.id] = savedProjects[req.user.id].filter(id => id !== projectId);
    console.log("Saved Projects:", savedProjects);
    res.json({ message: "Project unsaved successfully." });
});


// --- Page Route ---
// This should be one of the last routes
app.get('/', (req, res) => {
    res.render('index', { title: 'AquaTrack' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
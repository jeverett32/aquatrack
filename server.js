require('dotenv').config();
const express = require('express');
const path = require('path');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.set('view engine', 'ejs');

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Website is running!"));
const saltRounds = 10; // for bcrypt

// Create a new PostgreSQL connection pool
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "SuperSecretPassword",
        database: process.env.RDS_DATABASE || "aquatrack",
        port: process.env.RDS_PORT || 5433,
        ssl: process.env.RDS_SSL ? {rejectUnauthorized: false} : false
    }
});

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if no token, unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // if token is no longer valid
        req.user = user;
        next();
    });
};

const isManager = (req, res, next) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied. Manager role required.' });
    }
    next();
};

// Serve static files (CSS, client-side JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for the main page
app.get('/', (req, res) => {
    // Render the index.ejs file from the 'views' folder
    res.render('index', { title: 'AquaTrack' }); // Pass data to EJS if needed
});

// --- API Routes ---

// Get all well projects
app.get('/api/projects', async (req, res) => {
    try {
        const query = `
            SELECT
                p.ProjectID,
                p.ProjectTitle,
                p.ProjectLatitude,
                p.ProjectLongitude,
                pr.PartnerName,
                pr.PartnerWebsiteUrl
            FROM Well_Projects p
            LEFT JOIN Partners pr ON p.PartnerID = pr.PartnerID;
        `;
        const result = await knex.raw(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Create a new well project (Managers only)
app.post('/api/projects', authenticateToken, isManager, async (req, res) => {
    const { partnerId, projectTitle, projectLatitude, projectLongitude } = req.body;

    if (!projectTitle || !projectLatitude || !projectLongitude) {
        return res.status(400).json({ message: 'Project title, latitude, and longitude are required.' });
    }

    try {
        const query = `
            INSERT INTO Well_Projects (PartnerID, ProjectTitle, ProjectLatitude, ProjectLongitude)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [partnerId, projectTitle, projectLatitude, projectLongitude];
        const result = await knex.raw(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Update a well project (Managers only)
app.put('/api/projects/:id', authenticateToken, isManager, async (req, res) => {
    const projectId = req.params.id;
    const { partnerId, projectTitle, projectLatitude, projectLongitude } = req.body;

    if (!projectTitle || !projectLatitude || !projectLongitude) {
        return res.status(400).json({ message: 'Project title, latitude, and longitude are required.' });
    }

    try {
        const query = `
            UPDATE Well_Projects
            SET PartnerID = $1, ProjectTitle = $2, ProjectLatitude = $3, ProjectLongitude = $4
            WHERE ProjectID = $5
            RETURNING *;
        `;
        const values = [partnerId, projectTitle, projectLatitude, projectLongitude, projectId];
        const result = await knex.raw(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Delete a well project (Managers only)
app.delete('/api/projects/:id', authenticateToken, isManager, async (req, res) => {
    const projectId = req.params.id;

    try {
        const result = await knex('Well_Projects').where('ProjectID', projectId).del().returning('*');

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        res.status(200).json({ message: 'Project deleted successfully.' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- User-specific Routes ---

// Get all projects saved by the current user
app.get('/api/users/saved-projects', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const query = `
            SELECT p.* FROM Well_Projects p
            JOIN Saved_Projects sp ON p.ProjectID = sp.ProjectID
            WHERE sp.UserID = $1;
        `;
        const result = await knex.raw(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching saved projects:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Save a project for the current user
app.post('/api/users/saved-projects', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { projectId } = req.body;
    try {
        const query = 'INSERT INTO Saved_Projects (UserID, ProjectID) VALUES ($1, $2) RETURNING *;';
        const result = await knex.raw(query, [userId, projectId]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ message: 'Project already saved.' });
        }
        console.error('Error saving project:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Unsave a project for the current user
app.delete('/api/users/saved-projects/:projectId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { projectId } = req.params;
    try {
        const query = 'DELETE FROM Saved_Projects WHERE UserID = $1 AND ProjectID = $2 RETURNING *;';
        const result = await knex.raw(query, [userId, projectId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Saved project not found.' });
        }
        res.status(200).json({ message: 'Project unsaved successfully.' });
    } catch (err) {
        console.error('Error unsaving project:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// User Registration
app.post('/api/register', async (req, res) => {
    const { userEmail, userFirstName, userLastName, password } = req.body;

    if (!userEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUserQuery = `
            INSERT INTO Users (UserEmail, UserFirstName, UserLastName, PasswordHash)
            VALUES ($1, $2, $3, $4)
            RETURNING UserID, UserEmail, UserRole;
        `;
        const values = [userEmail, userFirstName, userLastName, hashedPassword];
        
        const result = await knex.raw(newUserQuery, values);
        res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });

    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { userEmail, password } = req.body;

    if (!userEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const userQuery = 'SELECT * FROM Users WHERE UserEmail = $1';
        const result = await knex.raw(userQuery, [userEmail]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordhash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // User is authenticated, create a JWT
        const payload = {
            userId: user.userid,
            email: user.useremail,
            role: user.userrole
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Logged in successfully!', token });

    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// Start the server
app.listen(port, async () => {
    console.log(`Server listening at http://localhost:${port}`);
    // Test the database connection
    try {
        await knex.raw('select 1+1 as result');
        console.log('Database connected successfully!');
    } catch (err) {
        console.error('Error connecting to the database:', err.stack);
    }
});
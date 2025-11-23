require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.set('view engine', 'ejs');

const port = process.env.PORT || 3000;
const saltRounds = 10; // for bcrypt

// Create a new PostgreSQL connection pool
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "Butterfingers24.",
        database: process.env.RDS_DATABASE || "aquatrack",
        port: process.env.RDS_PORT || 5433,
        ssl: { rejectUnauthorized: false }
    }
});

// --- Middleware ---
// Parse JSON request bodies
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Serve static files (CSS, client-side JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));


// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if no token, unauthorized

    const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
    jwt.verify(token, jwtSecret, (err, user) => {
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


// --- Page Route ---
app.get('/', (req, res) => {
    res.render('index', { title: 'AquaTrack' });
});

// --- API Routes ---

// Get all well projects
app.get('/api/projects', async (req, res) => {
    try {
        // Note: Schema only shows projectid, partnerid, projecttitle, projectlatitude, projectlongitude.
        // Missing: status, image, contribution, description.
        const query = `
            SELECT
                p.projectid as id,
                p.projecttitle as title,
                p.projectlatitude as lat,
                p.projectlongitude as lng,
                pr.partnername as partnerName,
                pr.partnerwebsiteurl as partnerWebsiteUrl
            FROM well_projects p
            LEFT JOIN partners pr ON p.partnerid = pr.partnerid;
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
    // Note: Only inserting fields present in the schema.
    const { partnerId, title, lat, lng } = req.body;

    if (!title || !lat || !lng) {
        return res.status(400).json({ message: 'Project title, latitude, and longitude are required.' });
    }

    try {
        const result = await knex('well_projects').insert({
            partnerid: partnerId,
            projecttitle: title,
            projectlatitude: lat,
            projectlongitude: lng
        }).returning('*');
        res.status(201).json(result[0]);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Update a well project (Managers only)
app.put('/api/projects/:id', authenticateToken, isManager, async (req, res) => {
    const projectId = req.params.id;
    const { partnerId, title, lat, lng } = req.body;

    if (!title || !lat || !lng) {
        return res.status(400).json({ message: 'Project title, latitude, and longitude are required.' });
    }

    try {
        const result = await knex('well_projects').where('projectid', projectId).update({
            partnerid: partnerId,
            projecttitle: title,
            projectlatitude: lat,
            projectlongitude: lng
        }).returning('*');

        if (result.length === 0) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        res.json(result[0]);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Delete a well project (Managers only)
app.delete('/api/projects/:id', authenticateToken, isManager, async (req, res) => {
    const projectId = req.params.id;

    try {
        const numDeleted = await knex('well_projects').where('projectid', projectId).del();

        if (numDeleted === 0) {
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
    const userId = req.user.id;
    try {
        const query = `
            SELECT
                p.projectid as id,
                p.projecttitle as title,
                p.projectlatitude as lat,
                p.projectlongitude as lng,
                pr.partnername as partnerName,
                pr.partnerwebsiteurl as partnerWebsiteUrl
            FROM well_projects p
            JOIN saved_projects sp ON p.projectid = sp.projectid
            LEFT JOIN partners pr ON p.partnerid = pr.partnerid
            WHERE sp.userid = $1;
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
    const userId = req.user.id;
    const { projectId } = req.body;
    try {
        const result = await knex('saved_projects').insert({
            userid: userId,
            projectid: projectId
        }).returning('*');
        res.status(201).json(result[0]);
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
    const userId = req.user.id;
    const { projectId } = req.params;
    try {
        const numDeleted = await knex('saved_projects').where({ userid: userId, projectid: projectId }).del();
        if (numDeleted === 0) {
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
        const [newUser] = await knex('users').insert({
            useremail: userEmail,
            userfirstname: userFirstName,
            userlastname: userLastName,
            passwordhash: hashedPassword,
            userrole: 'user'
        }).returning(['userid', 'useremail']);

        res.status(201).json({ message: 'User registered successfully!', user: newUser });

    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    console.log('Login request received:', req.body);
    const { userEmail, password } = req.body;

    if (!userEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await knex('users').where({ useremail: userEmail }).first();

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordhash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = {
            id: user.userid,
            email: user.useremail,
            role: user.userrole
        };
        console.log('JWT Payload:', payload);

        const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
        if (!process.env.JWT_SECRET) {
            console.warn('WARNING: JWT_SECRET is not defined in environment variables. Using default key.');
        }

        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

        res.json({
            message: 'Logged in successfully!',
            token,
            user: {
                id: user.userid,
                email: user.useremail,
                firstName: user.userfirstname,
                lastName: user.userlastname,
                role: user.userrole
            }
        });

    } catch (err) {
        console.error('Error during login:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
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
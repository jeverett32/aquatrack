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
        ssl: process.env.RDS_HOSTNAME && process.env.RDS_HOSTNAME !== 'localhost' ? { rejectUnauthorized: false } : false
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

    if (token == null) {
        console.log('No token provided');
        return res.sendStatus(401);
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.sendStatus(403);
        }
        req.user = user;
        console.log('Authenticated user:', user.email, 'Role:', user.role);
        next();
    });
};

const isManager = (req, res, next) => {
    console.log('Checking manager role. User role:', req.user.role);
    if (req.user.role !== 'manager') {
        console.log('Access denied - not a manager');
        return res.status(403).json({ message: 'Access denied. Manager role required.' });
    }
    console.log('Manager access granted');
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
                p.partnerid as partnerid,
                p.projecttitle as title,
                p.projectlatitude as lat,
                p.projectlongitude as lng,
                pr.partnername as partnername,
                pr.partnerwebsiteurl as partnerwebsiteurl
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
    console.log('Fetching saved projects for user ID:', userId);
    try {
        const query = `
            SELECT
                p.projectid as id,
                p.partnerid as partnerid,
                p.projecttitle as title,
                p.projectlatitude as lat,
                p.projectlongitude as lng,
                pr.partnername as partnername,
                pr.partnerwebsiteurl as partnerwebsiteurl
            FROM well_projects p
            JOIN saved_projects sp ON p.projectid = sp.projectid
            LEFT JOIN partners pr ON p.partnerid = pr.partnerid
            WHERE sp.userid = ?;
        `;
        const result = await knex.raw(query, [userId]);
        console.log('Saved projects query result:', result.rows.length, 'projects');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching saved projects:', err.message);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

// Save a project for the current user
app.post('/api/users/saved-projects', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { projectId } = req.body;
    console.log('Save project request - userId:', userId, 'projectId:', projectId);
    
    try {
        await knex('saved_projects').insert({
            userid: userId,
            projectid: projectId
        });
        
        console.log('Inserted into saved_projects table successfully');
        
        // Return the full project details
        const query = `
            SELECT
                p.projectid as id,
                p.partnerid as partnerid,
                p.projecttitle as title,
                p.projectlatitude as lat,
                p.projectlongitude as lng,
                pr.partnername as partnername,
                pr.partnerwebsiteurl as partnerwebsiteurl
            FROM well_projects p
            LEFT JOIN partners pr ON p.partnerid = pr.partnerid
            WHERE p.projectid = ?;
        `;
        const result = await knex.raw(query, [projectId]);
        console.log('Retrieved project details:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            console.log('Project already saved');
            return res.status(409).json({ message: 'Project already saved.' });
        }
        console.error('Error saving project:', err.message);
        console.error('Error code:', err.code);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
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

// Logout route (client-side token removal, but this confirms logout)
app.post('/api/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logged out successfully!' });
});

// --- Manager-only Routes ---

// Test endpoint to verify manager routes are loaded
app.get('/api/test-manager-routes', (req, res) => {
    res.json({ 
        message: 'Manager routes are loaded!',
        availableRoutes: [
            'GET /api/partners',
            'POST /api/partners',
            'PUT /api/partners/:id',
            'DELETE /api/partners/:id',
            'GET /api/users',
            'POST /api/users',
            'PUT /api/users/:id',
            'DELETE /api/users/:id',
            'GET /api/admin/projects'
        ]
    });
});

// Get all partners (Managers only)
app.get('/api/partners', authenticateToken, isManager, async (req, res) => {
    try {
        console.log('Fetching all partners from database...');
        const partners = await knex('partners').select('*');
        console.log('Partners fetched:', partners.length);
        res.json(partners);
    } catch (err) {
        console.error('Error fetching partners:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

// Create a new partner (Managers only)
app.post('/api/partners', authenticateToken, isManager, async (req, res) => {
    const { name, website } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Partner name is required.' });
    }

    try {
        const result = await knex('partners').insert({
            partnername: name,
            partnerwebsiteurl: website || null
        }).returning('*');
        res.status(201).json(result[0]);
    } catch (err) {
        console.error('Error creating partner:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Update a partner (Managers only)
app.put('/api/partners/:id', authenticateToken, isManager, async (req, res) => {
    const partnerId = req.params.id;
    const { name, website } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Partner name is required.' });
    }

    try {
        const result = await knex('partners').where('partnerid', partnerId).update({
            partnername: name,
            partnerwebsiteurl: website || null
        }).returning('*');

        if (result.length === 0) {
            return res.status(404).json({ message: 'Partner not found.' });
        }

        res.json(result[0]);
    } catch (err) {
        console.error('Error updating partner:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Delete a partner (Managers only)
app.delete('/api/partners/:id', authenticateToken, isManager, async (req, res) => {
    const partnerId = req.params.id;

    try {
        const numDeleted = await knex('partners').where('partnerid', partnerId).del();

        if (numDeleted === 0) {
            return res.status(404).json({ message: 'Partner not found.' });
        }

        res.status(200).json({ message: 'Partner deleted successfully.' });
    } catch (err) {
        console.error('Error deleting partner:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Get all users (Managers only)
app.get('/api/users', authenticateToken, isManager, async (req, res) => {
    try {
        console.log('Fetching all users from database...');
        const users = await knex('users').select('userid', 'useremail', 'userfirstname', 'userlastname', 'userrole');
        console.log('Users fetched:', users.length);
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

// Create a new user (Managers only)
app.post('/api/users', authenticateToken, isManager, async (req, res) => {
    const { email, firstName, lastName, password, role } = req.body;

    if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const existingUser = await knex('users').where('useremail', email).first();
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await knex('users').insert({
            useremail: email,
            userfirstname: firstName,
            userlastname: lastName,
            passwordhash: hashedPassword,
            userrole: role || 'user'
        }).returning(['userid', 'useremail', 'userfirstname', 'userlastname', 'userrole']);

        res.status(201).json(result[0]);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Update a user (Managers only)
app.put('/api/users/:id', authenticateToken, isManager, async (req, res) => {
    const userId = req.params.id;
    const { email, firstName, lastName, password, role } = req.body;

    if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: 'Email, first name, and last name are required.' });
    }

    try {
        const updateData = {
            useremail: email,
            userfirstname: firstName,
            userlastname: lastName,
            userrole: role || 'user'
        };

        if (password && password.trim() !== '') {
            updateData.passwordhash = await bcrypt.hash(password, saltRounds);
        }

        const result = await knex('users').where('userid', userId).update(updateData).returning(['userid', 'useremail', 'userfirstname', 'userlastname', 'userrole']);

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(result[0]);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Delete a user (Managers only)
app.delete('/api/users/:id', authenticateToken, isManager, async (req, res) => {
    const userId = req.params.id;

    try {
        const numDeleted = await knex('users').where('userid', userId).del();

        if (numDeleted === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Get all well projects (Managers only - includes all details)
app.get('/api/admin/projects', authenticateToken, isManager, async (req, res) => {
    try {
        console.log('Fetching all projects for admin from database...');
        const query = `
            SELECT
                p.projectid as id,
                p.partnerid as partnerid,
                p.projecttitle as title,
                p.projectlatitude as lat,
                p.projectlongitude as lng,
                pr.partnername as partnername,
                pr.partnerwebsiteurl as partnerwebsiteurl
            FROM well_projects p
            LEFT JOIN partners pr ON p.partnerid = pr.partnerid
            ORDER BY p.projectid DESC;
        `;
        const result = await knex.raw(query);
        console.log('Projects fetched:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching projects for admin:', err);
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
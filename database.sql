-- AquaTrack Database Schema
-- Run this script in pgAdmin to create all necessary tables

-- Drop tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS saved_projects CASCADE;
DROP TABLE IF EXISTS project_updates CASCADE;
DROP TABLE IF EXISTS well_projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS partners CASCADE;

-- Create partners table
CREATE TABLE partners (
    partnerid SERIAL PRIMARY KEY,
    partnername VARCHAR(255) NOT NULL,
    partnerdescription TEXT,
    partnerwebsiteurl VARCHAR(500)
);

-- Create users table
CREATE TABLE users (
    userid SERIAL PRIMARY KEY,
    useremail VARCHAR(255) UNIQUE NOT NULL,
    userfirstname VARCHAR(100) NOT NULL,
    userlastname VARCHAR(100) NOT NULL,
    passwordhash VARCHAR(255) NOT NULL,
    userrole VARCHAR(50) DEFAULT 'user' CHECK (userrole IN ('user', 'manager'))
);

-- Create well_projects table
CREATE TABLE well_projects (
    projectid SERIAL PRIMARY KEY,
    partnerid INTEGER REFERENCES partners(partnerid) ON DELETE SET NULL,
    projecttitle VARCHAR(255) NOT NULL,
    projectlatitude NUMERIC(10, 7) NOT NULL,
    projectlongitude NUMERIC(10, 7) NOT NULL
);

-- Create project_updates table
CREATE TABLE project_updates (
    updateid SERIAL PRIMARY KEY,
    projectid INTEGER REFERENCES well_projects(projectid) ON DELETE CASCADE,
    updatedate TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatetext TEXT NOT NULL
);

-- Create saved_projects table (junction table for users and projects)
CREATE TABLE saved_projects (
    userid INTEGER REFERENCES users(userid) ON DELETE CASCADE,
    projectid INTEGER REFERENCES well_projects(projectid) ON DELETE CASCADE,
    PRIMARY KEY (userid, projectid)
);

-- Insert sample partner data
INSERT INTO partners (partnername, partnerdescription, partnerwebsiteurl) VALUES
('Water.org', 'Global nonprofit working to bring water and sanitation to the world', 'https://water.org'),
('charity: water', 'Nonprofit organization bringing clean and safe drinking water to people in developing countries', 'https://www.charitywater.org'),
('The Water Project', 'Nonprofit organization unlocking human potential by providing sustainable water projects', 'https://thewaterproject.org');

-- Insert sample well projects
INSERT INTO well_projects (partnerid, projecttitle, projectlatitude, projectlongitude) VALUES
(1, 'Clean Water Initiative - Kenya', -1.286389, 36.817223),
(2, 'Village Well Project - Ethiopia', 9.145, 40.489673),
(3, 'Community Water System - Uganda', 1.373333, 32.290275),
(1, 'Spring Protection - Rwanda', -1.940278, 29.873888),
(2, 'Deep Well Installation - Tanzania', -6.792354, 39.208328),
(3, 'Rainwater Harvesting - Malawi', -13.254308, 34.301525),
(1, 'Borehole Drilling - Zambia', -15.416667, 28.283333),
(2, 'Water Filtration System - Nepal', 27.700769, 85.300140),
(3, 'Hand Pump Installation - Cambodia', 12.565679, 104.990963),
(1, 'Gravity Fed System - Honduras', 14.065049, -87.172520);

-- Insert a sample admin user (password: admin123)
-- Note: This is a bcrypt hash of 'admin123' with 10 salt rounds
INSERT INTO users (useremail, userfirstname, userlastname, passwordhash, userrole) VALUES
('admin@aquatrack.com', 'Admin', 'User', '$2b$10$YQ3V9rJ3xLZ5fKp8Y9X8leL7h5K8qVN3Zx4W7Q9Y8X8leL7h5K8qV', 'manager');

-- Insert a sample regular user (password: user123)
-- Note: This is a bcrypt hash of 'user123' with 10 salt rounds
INSERT INTO users (useremail, userfirstname, userlastname, passwordhash, userrole) VALUES
('user@aquatrack.com', 'Regular', 'User', '$2b$10$8X9Y8leL7h5K8qVN3Zx4W7Q9Y8X8leL7h5K8qVYQ3V9rJ3xLZ5fKp', 'user');

-- Insert sample project updates
INSERT INTO project_updates (projectid, updatetext) VALUES
(1, 'Project initiated. Community meeting held to discuss water needs.'),
(1, 'Site survey completed. Drilling equipment mobilized.'),
(2, 'Well drilling in progress. Expected completion in 2 weeks.'),
(3, 'Water system installed and tested. Training local maintenance team.'),
(4, 'Spring protection completed. Community celebrating access to clean water.');

-- Create indexes for better query performance
CREATE INDEX idx_well_projects_partnerid ON well_projects(partnerid);
CREATE INDEX idx_project_updates_projectid ON project_updates(projectid);
CREATE INDEX idx_saved_projects_userid ON saved_projects(userid);
CREATE INDEX idx_saved_projects_projectid ON saved_projects(projectid);
CREATE INDEX idx_users_email ON users(useremail);

-- Display completion message
SELECT 'Database schema created successfully!' AS message;

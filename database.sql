-- This script contains the SQL commands to set up the database schema for the AquaTrack project.
-- Execute this script in your PostgreSQL database.

-- Table: Users
-- Stores user information, including credentials and roles.
CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    UserEmail VARCHAR(255) UNIQUE NOT NULL,
    UserFirstName VARCHAR(100),
    UserLastName VARCHAR(100),
    PasswordHash VARCHAR(255) NOT NULL,
    UserRole VARCHAR(50) NOT NULL DEFAULT 'user' -- 'user' or 'manager'
);

-- Table: Partners
-- Stores information about partner organizations involved in the well projects.
CREATE TABLE Partners (
    PartnerID SERIAL PRIMARY KEY,
    PartnerName VARCHAR(255) NOT NULL,
    PartnerDescription TEXT,
    PartnerWebsiteUrl VARCHAR(255)
);

-- Table: Well_Projects
-- Stores the core information for each well project.
CREATE TABLE Well_Projects (
    ProjectID SERIAL PRIMARY KEY,
    PartnerID INT,
    ProjectTitle VARCHAR(255) NOT NULL,
    ProjectLatitude DECIMAL(9, 6) NOT NULL,
    ProjectLongitude DECIMAL(9, 6) NOT NULL,
    FOREIGN KEY (PartnerID) REFERENCES Partners(PartnerID)
);

-- Table: Project_Updates
-- Stores periodic updates for each well project.
CREATE TABLE Project_Updates (
    UpdateID SERIAL PRIMARY KEY,
    ProjectID INT NOT NULL,
    UpdateDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdateText TEXT NOT NULL,
    FOREIGN KEY (ProjectID) REFERENCES Well_Projects(ProjectID) ON DELETE CASCADE
);

-- Table: Saved_Projects
-- A join table to track which users have saved which projects.
CREATE TABLE Saved_Projects (
    UserID INT NOT NULL,
    ProjectID INT NOT NULL,
    PRIMARY KEY (UserID, ProjectID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ProjectID) REFERENCES Well_Projects(ProjectID) ON DELETE CASCADE
);

-- You can add some sample data below for testing if you wish.
-- Example:
-- INSERT INTO Partners (PartnerName) VALUES ('Default Partner');

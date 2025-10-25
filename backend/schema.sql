-- Database schema for Just Doe It application
-- This file contains the table definitions for the application

CREATE TABLE locations (
    id UUID PRIMARY KEY,
    coordinates POINT NOT NULL, -- geographic coordinates (latitude, longitude)
    name VARCHAR(255) NOT NULL,
    shortLoc VARCHAR(100) NOT NULL, -- short location identifier
    summary TEXT
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    locationid UUID NOT NULL,
    inputTime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- duration in minutes
    rating DECIMAL(3,1) NOT NULL, -- steps of 0.5, e.g., 1.0, 1.5, 2.0, etc.
    cleanliness INTEGER NOT NULL CHECK (cleanliness >= 1 AND cleanliness <= 10),
    comment TEXT,
    outletAvailability BOOLEAN NOT NULL,
    collaborators UUID[] -- array of UUIDs for collaborators
);

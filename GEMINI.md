# AquaTrack Project Plan & Instructions

This document outlines the complete plan for finishing the AquaTrack project. The backend API and database schema are now complete. The `server.js` file contains all necessary API endpoints, and the `database.sql` file has the commands to set up your PostgreSQL database.

**Your Role:** When you start a session, tell the Gemini agent who you are (e.g., "I am Sarah, let's work on my tasks") and refer to this document for your goals.

---

## John Everett (Backend & Cloud Lead)

**Status:** All backend API development is **COMPLETE**.

Your final task is to deploy the application to the cloud.

### Final Task: Deployment (Week 6)

**Goal:** Deploy the application and database to AWS, meeting the requirements of `skillcheck4.txt`.

**Instructions:**

1.  **Set up the Database:**
    *   Provision a PostgreSQL database on AWS RDS.
    *   Connect to the RDS instance and run the script from `database.sql` to create all the necessary tables.

2.  **Deploy the Application:**
    *   Deploy this Node.js application to AWS Elastic Beanstalk.
    *   In the Elastic Beanstalk configuration, set the environment variables for the database (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_PORT`) and for the JWT (`JWT_SECRET`). The database host will now be your AWS RDS endpoint URL.

3.  **Finalize `skillcheck4.txt` Requirements:**
    *   Point a custom DNS record (e.g., a subdomain from is404.net) to your Elastic Beanstalk application.
    *   Ensure your application has an HTTPS certificate. Elastic Beanstalk can be configured with a load balancer to handle this.

4.  **Prepare for Submission:**
    *   Create at least two users in your deployed application's database: one with the default `'user'` role and one that you manually update in the database to have the `'manager'` role.
    *   Record a short video demonstrating all application features: public map viewing, user registration, user login, saving/unsaving projects, and admin functions (add/edit/delete projects).
    *   Prepare your submission notes with the URL and the login credentials for both the 'user' and 'manager' accounts.

---

## Cole Latour (Frontend Lead - Public)

**Status:** The static frontend shell is ready. The backend API is now available to be connected.

Your tasks are to bring the public-facing parts of the site to life. All your work will primarily be in `public/app.js` and `public/style.css`.

### Task 1: Implement the Interactive Map

**Goal:** Display all well projects from the database on the map.

**Instructions:**

1.  In `public/app.js`, write a function that executes when the map page loads.
2.  Inside this function, use the `fetch()` API to make a `GET` request to the `/api/projects` endpoint.
3.  Once you receive the JSON array of projects, loop through it. For each project object, use its `projectlatitude` and `projectlongitude` properties to create and place a marker on the Leaflet map.
4.  It's recommended to store the project data from the fetch request in a global array so you can access it easily for the next task.

### Task 2: Implement the Project Detail View

**Goal:** When a user clicks a map marker, show them detailed information about that project.

**Instructions:**

1.  In `public/app.js`, add a click event listener to the map markers you created in Task 1.
2.  When a marker is clicked, find the corresponding project's data (from the array you saved in the previous task).
3.  Dynamically populate the HTML of the `#project-detail` section with the project's information (title, partner name, etc.).
4.  Use your page-switching logic to hide the other sections and display the `#project-detail` section.

### Task 3: Final Polish & Bug Fixing

**Goal:** Ensure all public components are responsive and bug-free.

**Instructions:**

1.  Review the styling and layout of the Homepage, Map, and Project Detail views.
2.  Clean up any UI/UX issues and ensure the site looks professional on both desktop and mobile screen sizes.
3.  Work with Chase to fix any bugs he has logged related to the public-facing components.

---

## Sarah Peck (Frontend Developer - User Features)

**Status:** The static HTML/CSS for your components is ready. The backend API is now available to be connected.

Your tasks are to implement all user-specific functionality. All your work will primarily be in `public/app.js`.

### Task 1: Implement User Login & Registration

**Goal:** Allow users to register for an account and log in.

**Instructions:**

1.  **Registration:**
    *   Add a "submit" event listener to the registration form.
    *   In the listener, make a `POST` request with `fetch()` to `/api/register`. The body of the request should be a JSON object with `userEmail`, `userFirstName`, `userLastName`, and `password`.
    *   Handle the response: show a success message or display an error if the email is already taken.
2.  **Login:**
    *   Add a "submit" event listener to the login form.
    *   Make a `POST` request to `/api/login` with the `userEmail` and `password`.
    *   **Crucially:** On a successful login, the API will send back a `token`. You **must** save this token to the browser's `localStorage` using `localStorage.setItem('token', response.token);`.
    *   After login, update the UI (e.g., show the dashboard button, hide login/register).

### Task 2: Implement the User Dashboard

**Goal:** Create the dashboard where users see their saved projects.

**Instructions:**

1.  When the user navigates to the dashboard, make a `GET` request to `/api/users/saved-projects`.
2.  You **must** include the authentication token in this request. Create a header object: `headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }`.
3.  When you get the list of saved projects back, dynamically create the HTML to display them in the `#dashboard` section.
4.  For each project you display, make sure to add an "Unsave" button.

### Task 3: Implement Save/Unsave Functionality

**Goal:** Allow users to save and unsave projects.

**Instructions:**

1.  **Saving:**
    *   In the `#project-detail` view, add a "Save Project" button. Make sure this button is only visible if the user is logged in (i.e., if a token exists in `localStorage`).
    *   When the button is clicked, make a `POST` request to `/api/users/saved-projects`. The body should be a JSON object containing the `projectId`.
    *   Remember to include the `Authorization` header with the token, just like in the previous task.
2.  **Unsaving:**
    *   Add a click listener to the "Unsave" buttons on the dashboard.
    *   When clicked, get the `projectId` for that project.
    *   Make a `DELETE` request to `/api/users/saved-projects/:projectId` (e.g., `/api/users/saved-projects/5`).
    *   You must include the `Authorization` header with the token. On success, remove the project from the view.

---

## Chase Fisher (Database & QA Lead)

**Status:** The database schema is designed and the backend API is ready.

Your tasks are to connect the admin UI to the backend and then perform quality assurance testing on the entire application.

### Task 1: Implement Admin Frontend Features

**Goal:** Allow managers to add, edit, and delete projects using the admin modal.

**Instructions:**

1.  Your first step is to ensure the admin buttons and modal are only visible to managers. After a user logs in, you can check their role by decoding the JWT stored in `localStorage`. A user with the role `'manager'` should be able to see the admin controls.
2.  **Add Project:** Wire the form in the `#project-modal` to make a `POST` request to `/api/projects`. The request body should contain the project data. You **must** include the manager's token in the `Authorization` header.
3.  **Edit Project:** Wire the modal (when in "edit" mode) to make a `PUT` request to `/api/projects/:id`. This also requires the manager's token in the header.
4.  **Delete Project:** Wire the delete confirmation to make a `DELETE` request to `/api/projects/:id`. This also requires the manager's token.

### Task 2: Quality Assurance (QA)

**Goal:** Test the entire application to find, log, and help resolve bugs.

**Instructions:**

1.  Create a testing plan that covers all user stories:
    *   A guest visiting the site.
    *   A new user registering.
    *   A registered user logging in, saving a project, viewing their dashboard, and unsaving a project.
    *   A manager logging in and adding, editing, and deleting a project.
2.  Thoroughly test every button, form, and link.
3.  Verify that all API connections work as expected and that errors are handled gracefully.
4.  Test for visual/CSS bugs and responsiveness issues on different screen sizes.
5.  Keep a clear log of all bugs you find so the team can address them before the deadline.

# AquaTrack

A website featuring an interactive map for tracking potential water well locations and projects in underdeveloped countries. This project is managed and developed with the assistance of the Gemini CLI.

## Project Setup

This project is designed to be completed using the Gemini CLI. The CLI will guide each team member through their assigned tasks.

### 1. Install the Gemini CLI

To install the Gemini CLI, run the following command in your terminal:

```bash
npm install -g @google/gemini-cli
```

Ensure it is correctly configured and you are authenticated.

### 2. Local Development Setup

Before running the application locally, you need to install the necessary Node.js dependencies.

1.  Open your terminal or command prompt.
2.  Navigate to the root directory of this project (`aquatrack`).
3.  Run the following command to install all dependencies:

    ```bash
    npm install
    ```

### 3. Start a Development Session

Once the Gemini CLI is installed, you can begin your work on the project.

1.  Open your terminal or command prompt.
2.  Navigate to the root directory of this project (`aquatrack`).
3.  Start an interactive session with the Gemini CLI by running the following command:

    ```bash
    gemini
    ```

### 3. Completing Your Tasks

1.  At the beginning of each session, introduce yourself to the Gemini agent (e.g., "I am [Your Name]").
2.  The agent has access to the project plan and will provide you with your assigned tasks.
3.  Use natural language to instruct the agent on what you want to do. The agent will use its tools to help you write code, test features, and complete your portion of the assignment.
4.  Refer to the `GEMINI.md` file in the project context for a detailed breakdown of all roles and tasks.

#### Git Workflow

To ensure a smooth collaborative development process, please follow these Git guidelines:

1.  **Create a New Branch:** Before starting any new task or feature, always create a new branch from the `main` branch. Use a descriptive name for your branch (e.g., `feature/user-login`, `bugfix/map-marker-issue`).

    ```bash
    git checkout main
    git pull origin main
    git checkout -b your-branch-name
    ```

2.  **Commit Your Changes:** Make regular, small, and descriptive commits as you work.

    ```bash
    git add .
    git commit -m "feat: Add user login functionality"
    ```

3.  **Push Your Branch:** Once you've completed your task or reached a logical stopping point, push your branch to the remote repository.

    ```bash
    git push origin your-branch-name
    ```

4.  **Create a Merge Request (Pull Request):** After pushing your branch, go to your Git hosting service (e.g., GitHub, GitLab, Bitbucket) and create a merge request (or pull request) from your branch into the `main` branch. Provide a clear description of your changes and any relevant context.

## Team Roles & Tasks

*   **John Everett (Backend & Cloud Lead):** Responsible for deploying the application and database to AWS.
*   **Cole Latour (Frontend Lead - Public):** Responsible for the public-facing interactive map and project detail views.
*   **Sarah Peck (Frontend Developer - User Features):** Responsible for user registration, login, and the user dashboard.
*   **Chase Fisher (Database & QA Lead):** Responsible for connecting the admin UI to the backend and quality assurance.

Good luck!
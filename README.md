A Project Management Platform using PostgreSQL, Express JS, React JS and node JS. In this project management application you can manage the projects within an organization, create task in the projects and assign task to team members.

User can create multiple organizations and within an organization you can invite and manage the team members also. I have also integrated the email notifications in the project, whenever a new task is assigned then user will receive the email for that, and they will receive another reminder email also on due date of the task.

For user authentication and organization management I have used clerk, and to manage the background jobs like email notification and clerk webhooks management we have used Inngest in this full stack project.



Features
Multiple Workspaces: Allow multiple workspaces to be created, each with its own set of projects, tasks, and members.
Project Management: Manage projects, tasks, and team members.
Analytics: View project analytics, including progress, completion rate, and team size.
Task Management: Assign tasks to team members, set due dates, and track task status.
User Management: Invite team members, manage user roles, and view user activity.

 Tech Stack
Framework: ReactJS
Styling: Tailwind CSS
UI Components: Lucide React for icons
State Management: Redux Toolkit

Getting Started
First, install the dependencies. We recommend using npm for this project.

npm install
Then, run the development server:

npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
Open http://localhost:5173 with your browser to see the result.

You can start editing the page by modifying src/App.jsx. The page auto-updates as you edit the file.


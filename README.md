# LearnFlow — Personal Learning & Productivity Hub

LearnFlow is a comprehensive productivity and learning management application designed to help you manage tasks, track courses and certificates, save resources, and stay organized. It also features an integrated AI assistant to help you control everything and boost your productivity.

## 🚀 Features

- **Task Management**: Keep track of your daily tasks with a Kanban board (`@dnd-kit`).
- **Calendar & Scheduling**: View and schedule tasks or learning sessions using an interactive calendar (`@fullcalendar`).
- **Course & Certificate Tracking**: Log and manage your ongoing courses and earned certificates.
- **Resource Hub**: Save and organize useful links and learning resources.
- **AI Assistant**: Integrated Google Generative AI to provide smart insights and help manage your tasks.
- **Authentication**: Secure passwordless/magic link authentication powered by NextAuth.js and Resend/Nodemailer.

## 💻 Tech Stack

This project is built with a modern web development stack, utilizing the following technologies:

### Core Framework & Language
- **[Next.js](https://nextjs.org/)** (v15/16 App Router) - React framework for building fast and scalable web applications.
- **[TypeScript](https://www.typescriptlang.org/)** - Strongly typed programming language that builds on JavaScript.

### UI & Styling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development.
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI components for building high-quality design systems.
- **[Lucide React](https://lucide.dev/)** - Beautiful & consistent icon set.
- **[Recharts](https://recharts.org/)** - A composable charting library built on React components.

### State Management & Data Fetching
- **[Zustand](https://zustand-demo.pmnd.rs/)** - A small, fast, and scalable bearbones state-management solution.
- **[React Query](https://tanstack.com/query/latest)** - Powerful asynchronous state management for React.

### Database & ORM
- **[Prisma](https://www.prisma.io/)** - Next-generation Node.js and TypeScript ORM.
- **[PostgreSQL](https://www.postgresql.org/)** - Powerful, open-source object-relational database system (accessed via `pg` and `@prisma/adapter-pg`).

### Authentication
- **[NextAuth.js (Auth.js)](https://authjs.dev/)** - Authentication for Next.js, configured with `@auth/prisma-adapter`.
- **Nodemailer** - Used for sending magic-link emails for secure passwordless logins.

### Forms & Validation
- **[React Hook Form](https://react-hook-form.com/)** - Performant, flexible, and extensible forms with easy-to-use validation.
- **[Zod](https://zod.dev/)** - TypeScript-first schema declaration and validation library.

### Advanced Features
- **[@google/generative-ai](https://ai.google.dev/)** - Integration with Google's Gemini models for AI assistance.
- **[@dnd-kit](https://dndkit.com/)** - A lightweight, modular, performant, accessible drag & drop toolkit for React (used for the Kanban board).
- **[FullCalendar](https://fullcalendar.io/)** - Full-sized drag & drop event calendar.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database (local or cloud-hosted)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd todo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add the necessary environment variables (Database URL, NextAuth Secret, Email server config, Google AI API Key, etc.).

4. **Initialize the Database:**
   Push the Prisma schema to your PostgreSQL database and generate the Prisma Client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to see the application running.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is private and intended for personal/internal use.

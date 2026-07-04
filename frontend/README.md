# Ember Frontend

The frontend interface for the Ember AI conversational agent. Built with **Next.js**, **TailwindCSS**, and **Framer Motion**, it provides a responsive, dynamic, and visually engaging experience.

## Key Features

- **Project-Centric Workspace**: Dynamic routing (`projects/[id]/page.tsx`) to manage isolated project sessions seamlessly.
- **Interactive Memory Dashboard**: Visualize the agent's memory using a Canvas-based workspace (`flower/dashboard/page.tsx`).
- **Dynamic Data Visualization**: Uses `react-force-graph-2d` to render interactive knowledge graphs.
- **Rich UI Animations**: Integrated with Framer Motion for smooth entry effects, micro-animations, and a custom interactive cursor (`custom-cursor.tsx`).
- **Modern Tech Stack**: React, Next.js, and TailwindCSS for a highly optimized and performant user interface.

## Installation & Setup

1. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```
2. Configure the environment variables by creating `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Ensure `NEXT_PUBLIC_API_URL` points to your backend instance, typically `http://localhost:8080`)*
3. Start the development server:
   ```bash
   pnpm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to start chatting with Ember.

## Key Components
- `app/projects/[id]`: Dynamic routing for project-scoped chat sessions.
- `app/flower/dashboard`: The interactive memory and knowledge map dashboard.
- `components/`: Reusable UI components including the `project-sidebar`, `feature-showcase`, and `custom-cursor`.

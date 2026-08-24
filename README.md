<div align="center">
  <h1>🍔 Campuscorner: Meal Management System</h1>
  <p>A comprehensive, modern solution for managing university and campus dining services.</p>
  <p>
    <a href="https://campuscornerr.com"><strong>🌐 View Live Application</strong></a>
  </p>
</div>

---

## 🌟 Overview

**Campuscorner** is a full-stack, role-based Meal Management Application tailored for college cafeterias and hostel messes. It bridges the gap between students, cafeteria staff, and administration by providing a seamless interface for meal subscriptions, QR-based check-ins, daily menus, feedback polls, and support tickets.

## ✨ Key Features

### 👨‍🎓 For Students
*   **Dashboard:** View daily menus, active meal plans, and announcements.
*   **QR Meal Pass:** Instant QR code generation for quick check-ins at the dining hall.
*   **Subscriptions:** Purchase and renew meal plans seamlessly via Razorpay integration.
*   **Polls & Feedback:** Participate in admin-created polls to decide the next big meal or provide feedback.
*   **Coupons:** Redeem special promotional coupons for discounts on meal plans.
*   **Helpdesk:** Raise support tickets for queries and converse directly with the administration.

### 🧑‍🍳 For Staff
*   **QR Scanner:** Built-in scanner to verify student meal passes instantly and log meal redemptions (Breakfast, Lunch, Dinner).
*   **Real-time Logs:** Track served meals dynamically to prevent duplicate redemptions.

### 👑 For Administrators
*   **Comprehensive Dashboard:** High-level metrics on active students, daily meals served, and revenue.
*   **Menu & Announcement Management:** Update daily food menus and broadcast announcements to all students.
*   **User Management:** Complete control over student and staff profiles.
*   **Subscription & Payment Tracking:** Monitor all active meal plans, payment statuses, and Razorpay transactions.
*   **Polling System:** Create and manage polls to gauge student preferences.
*   **Ticket Management:** Resolve student issues efficiently through a dedicated ticket resolution interface.

---

## 🛠️ Technology Stack

**Frontend Architecture:**
*   **Core:** React 18, TypeScript, Vite
*   **Styling:** TailwindCSS for rapid, responsive UI design.
*   **Routing:** React Router DOM (v7)
*   **State & Forms:** React Hook Form, Zod (for robust validation)
*   **Visuals & Charts:** Framer Motion (animations), Recharts (data visualization), Lucide React (icons)
*   **QR Processing:** `qrcode` (generation) & `jsqr` (scanning)

**Backend & Database:**
*   **BaaS:** Supabase (PostgreSQL Database, Authentication, and Row Level Security)
*   **Payments:** Razorpay Integration

---

## 📂 Project Structure

```text
Campuscorner/
├── meal-MM/                      # Main Frontend Vite Project
│   ├── src/
│   │   ├── components/           # Reusable UI elements, layouts, and feature components (polls, tickets, coupons)
│   │   ├── contexts/             # Global states (e.g., AuthContext)
│   │   ├── hooks/                # Custom React hooks (e.g., usePolls)
│   │   ├── lib/                  # Service files for Supabase, Coupons, Polls, and Ticket logic
│   │   ├── pages/                # Route components separated by roles (admin, staff, student, auth)
│   │   ├── types/                # TypeScript interfaces (including Razorpay types)
│   │   ├── App.tsx               # Main application router
│   │   └── main.tsx              # React DOM entry point
│   ├── supabase/                 # Supabase configuration and edge functions (if any)
│   ├── create_tables.sql         # SQL schema definitions for the entire database
│   ├── seed_database.sql         # Dummy data for quick development testing
│   ├── package.json              # Project dependencies
│   └── vite.config.ts            # Vite bundler configuration
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   Supabase Account & Project
*   Razorpay Account (for payments)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mayur-web9/CampusCornerr.git
    cd CampusCornerr/meal-MM
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the `meal-MM` directory with your Supabase keys:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup:**
    Run the SQL commands provided in `meal-MM/create_tables.sql` inside your Supabase SQL editor to scaffold the required tables, RLS policies, and triggers.

5.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

---

## 🛡️ Security & Roles
The application leverages Supabase **Row Level Security (RLS)** ensuring that:
*   Students can only view their own meal logs, tickets, and subscriptions.
*   Staff can only access scanning tools and logging functionality.
*   Admins have elevated privileges to manage the overarching system data. 

---
*Developed with ❤️ for better campus dining experiences.*

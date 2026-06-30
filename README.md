# 🌍 Community Hero

A full-stack MERN application that enables citizens to report, track, and manage community issues efficiently. Users can securely report problems, upload images, monitor issue status, and manage their reports through an intuitive dashboard.

---

## 🚀 Live Demo

👉 **https://community-hero-22737963725.asia-southeast1.run.app/**

---

## 📌 Overview

Community Hero is designed to bridge the gap between citizens and local authorities by providing a centralized platform for reporting and tracking public issues such as:

- 🛣️ Potholes
- 🗑️ Garbage Collection
- 💧 Water Leakage
- 💡 Broken Street Lights
- 🚧 Road Damage
- 🌳 Public Infrastructure Issues

The platform allows users to create reports, upload supporting images, and monitor the progress of each issue.

---

# ✨ Features

- 🔐 Secure JWT Authentication
- 👤 User Registration & Login
- 📝 Report Community Issues
- 📷 Image Upload Support
- 📍 Track Issue Status
- 📂 View Issue Details
- 👤 User Profile Management
- 📊 Personal Dashboard
- ⚡ RESTful APIs
- 📱 Responsive UI

---

# 🛠 Tech Stack

## Frontend

- React.js
- TypeScript
- Vite
- React Router DOM
- Axios
- CSS

## Backend

- Node.js
- Express.js
- TypeScript
- JWT Authentication
- Multer
- Cloudinary

## Database

- MongoDB Atlas
- Mongoose

## Deployment

- Google Cloud Run
- Render
- GitHub

---

# 📂 Project Structure

```text
community-hero/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── routes/
│   └── assets/
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.ts
│   └── tsconfig.json
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Shuvam-cmd/community-hero.git
```

```bash
cd community-hero
```

---

## Backend Setup

```bash
cd server
npm install
npm run dev
```

---

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `server` folder.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_gemini_api_key
```

---

# 📡 API Endpoints

## Authentication

```
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
```

## Issues

```
GET    /api/issues
POST   /api/issues
GET    /api/issues/:id
PUT    /api/issues/:id
DELETE /api/issues/:id
```

---

# 📸 Screenshots

Add screenshots of:

- Home Page
- Login Page
- Register Page
- Dashboard
- Report Issue Page
- Issue Details Page

---

# 🎯 Future Enhancements

- 🛡️ Admin Dashboard
- 📧 Email Notifications
- 🗺️ Google Maps Integration
- 🤖 AI-Based Issue Categorization
- 📈 Analytics Dashboard
- 🔔 Push Notifications
- 💬 Real-Time Updates

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Shuvam**

- GitHub: https://github.com/Shuvam-cmd

---

## ⭐ Support

If you found this project helpful, please consider giving it a **⭐ Star** on GitHub. It helps others discover the project and motivates future improvements.

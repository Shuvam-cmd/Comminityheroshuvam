# 🌍 Community Hero

A full-stack MERN application that empowers citizens to report, track, and manage community issues such as potholes, garbage, water leakage, broken street lights, and road damage. The platform provides secure authentication, image uploads, and an intuitive dashboard for efficient issue management.

---

## 🚀 Live Demo

**Frontend:** Coming Soon

**Backend:** https://community-hero-3.onrender.com

---

## 📖 Features

- 🔐 Secure User Authentication (JWT)
- 👤 User Registration & Login
- 📝 Report Community Issues
- 📷 Upload Issue Images
- 📍 Track Reported Issues
- 📊 User Dashboard
- 👤 Manage User Profile
- 📱 Responsive Design
- ☁️ Cloud Image Storage
- ⚡ RESTful API Architecture

---

## 🛠️ Tech Stack

### Frontend

- React.js
- TypeScript
- Vite
- React Router DOM
- Axios
- CSS

### Backend

- Node.js
- Express.js
- TypeScript
- JWT Authentication
- Multer
- Cloudinary

### Database

- MongoDB Atlas
- Mongoose

### Deployment

- Render
- GitHub

---

## 📂 Project Structure

```text
community-hero/
│
├── client/
│   ├── src/
│   ├── pages/
│   ├── components/
│   ├── routes/
│   └── assets/
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.ts
│
└── README.md
```

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/Shuvam-cmd/community-hero.git
```

Move into the project directory:

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

## 🔑 Environment Variables

Create a `.env` file inside the `server` folder and add:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_api_key
```

---

## 📡 API Endpoints

### Authentication

```
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
```

### Issues

```
GET /api/issues
POST /api/issues
GET /api/issues/:id
PUT /api/issues/:id
DELETE /api/issues/:id
```

---

## 📸 Screenshots

> Add screenshots of:
- Home Page
- Login Page
- Dashboard
- Report Issue Page
- Issue Details

---

## 🎯 Future Enhancements

- Admin Dashboard
- Email Notifications
- Google Maps Integration
- AI-powered Issue Categorization
- Push Notifications
- Issue Analytics
- Real-time Updates

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Shuvam**

- GitHub: https://github.com/Shuvam-cmd
- LinkedIn: *(Add your LinkedIn profile)*

---

⭐ If you found this project useful, don't forget to star the repository!

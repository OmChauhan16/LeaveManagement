# Leave Management System

A simple Leave Management System with **React frontend** and **Node.js + Express backend**.  
It supports user registration, login, leave request submission with category, date range, reason, and file upload.

---

## 🚀 Features
- User registration and login (with email verification)
- JWT authentication
- Leave request form (Category, Start Date, End Date, Reason, Attachment)
- Admin dashboard for managing leave requests
- MySQL database integration

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd leave-management-system
```

### 2. Setup Backend
```bash
cd backend
npm install
```

#### Environment Variables (`.env`)
```
# Server
PORT=4000
JWT_SECRET=hgvghy76757!@$iuy
JWT_EXPIRES=1h
FRONTEND_URL=http://localhost:5173


# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=leave_management

# Admin seeding (only for initial seeding)
SEED_ADMIN_NAME=Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=admin123

# Nodemailer / SMTP (for sending invites)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=omc5246@gmail.com
SMTP_PASS=lbiv vbsr cmqr tuxh
FROM_EMAIL="omc5246@gmail.com"

```

#### Run backend
```bash
npm run dev
```



### 3. Setup Frontend
```bash
cd frontend
npm install
```

#### Environment Variables (`.env`)
```
VITE_API_URL=http://localhost:4000/api
```

#### Run frontend
```bash
npm run dev
```

### 4. Setup Database (phpMyAdmin)
- Open phpMyAdmin (`http://localhost/phpmyadmin`)
- Create a database named `leave_management`
- Import the given schema.sql file:


#### Initial Seeding for Admin
```bash
node scripts/seedAdmin.js
```



## ▶️ Run the Application
1. Start backend (`localhost:4000`)
2. Start frontend (`localhost:3000`)


---

## 📌 Assumptions
- Only admin has access to approve/reject leave requests.
- File uploads are stored locally in backend's `/uploads` folder.

---

✅ Now your Leave Management System is ready!

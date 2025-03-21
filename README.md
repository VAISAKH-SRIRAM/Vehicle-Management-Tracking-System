# Vehicle-Management-Tracking-System

**Vehicle-Management-Tracking-System** is a real-time vehicle tracking and monitoring system built using **Flask, SQLAlchemy, Flask-Login, Flask-SocketIO, and Leaflet.js** for mapping. It provides live GPS tracking, geofencing, trip history, and detailed reports for fleet management.

## 📌 Features

✅ **Live GPS Tracking** - Monitor vehicles in real-time with accurate location updates.\
✅ **Geofencing** - Create virtual boundaries and receive alerts when vehicles enter or exit.\
✅ **Trip History** - View past trips with detailed logs and playback functionality.\
✅ **Admin Panel** - Assign drivers, update vehicle details, and manage fleet operations.\
✅ **Alerts & Notifications** - Get notified about important events (e.g., overspeeding, entry/exit from geofences).\
✅ **Reports & Analytics** - Generate reports on vehicle usage, driver behavior, and trip efficiency.\
✅ **Secure Authentication** - Role-based access control for admins, managers, and drivers.

## 🏗️ Tech Stack

- **Backend**: Flask, Odoo, SQLAlchemy, Flask-Login, Flask-SocketIO
- **Frontend**: React.js, Tailwind CSS, Leaflet.js
- **Database**: PostgreSQL
- **Hardware Integration**: Teltonika FMC920 GPS Tracker

## 🚀 Installation Guide

### **1️⃣ Prerequisites**

Ensure you have the following installed:

- Python 3.8+
- PostgreSQL
- Node.js & npm
- Redis (for SocketIO real-time communication)

### **2️⃣ Backend Setup (Flask & Odoo)**

```bash
# Clone the repository
git clone https://github.com/yourusername/Vehicle-Management-Tracking-System.git
cd Vehicle-Management-Tracking-System/backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate   # On Windows, use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (create a .env file)
cp .env.example .env

# Run the backend server
python app.py
```

### **3️⃣ Frontend Setup (React & Tailwind CSS)**

```bash
cd ../frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

### **4️⃣ Database Migration**

```bash
flask db upgrade
```

## 🗺️ Live Tracking & Map Integration

We use **Leaflet.js** for interactive maps. The system fetches real-time data from **Teltonika FMC920** GPS trackers and updates the vehicle’s position dynamically.

## 🛠️ Admin Panel Features

- Assign drivers to vehicles
- Update vehicle details
- Filter vehicles by status (Active, Idle, Offline)
- Search drivers efficiently

## 📄 API Endpoints

| Method | Endpoint          | Description            |
| ------ | ----------------- | ---------------------- |
| GET    | /api/vehicles     | Get all vehicles       |
| GET    | /api/vehicle/{id} | Get vehicle by ID      |
| POST   | /api/vehicle      | Add a new vehicle      |
| PUT    | /api/vehicle/{id} | Update vehicle details |
| DELETE | /api/vehicle/{id} | Remove a vehicle       |
| GET    | /api/trips        | Get trip history       |

## 👥 Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch`.
3. Commit your changes: `git commit -m 'Add new feature'`.
4. Push the branch: `git push origin feature-branch`.
5. Submit a pull request.

## 📜 License

This project is licensed under the ** Apache_2.0_License**.

---



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

- **Backend**: Flask,SQLAlchemy, Flask-Login, Flask-SocketIO
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

This project is licensed under the APACHE 2.0 LICENSE.

---
![Screenshot from 2025-03-21 12-11-30](https://github.com/user-attachments/assets/2c5d11e5-19bf-4894-91b3-94bbf6123d83)

![Screenshot from 2025-03-21 11-33-08](https://github.com/user-attachments/assets/c2bf0227-5b75-49e0-9c7e-28443af7f1f6)

![Screenshot from 2025-03-21 12-10-57](https://github.com/user-attachments/assets/97fe5bb3-024e-45c7-a129-b436f38a5230)

![Screenshot from 2025-03-21 12-10-59](https://github.com/user-attachments/assets/48437195-31fd-4648-94e7-0edd53cb5937)

![Screenshot from 2025-03-21 12-11-03](https://github.com/user-attachments/assets/79c19f25-1b9a-447c-9a0b-2f407219c1f1)



















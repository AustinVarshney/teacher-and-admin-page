# SLMS - Admin and Teacher Pages

A comprehensive School Learning Management System (SLMS) featuring dedicated admin and teacher interfaces built with React and TypeScript.

## 🚀 Features

### 👨‍💼 Admin Dashboard

- **Student Management**: View, edit, and manage student information
- **Staff Management**: Handle teaching and non-teaching staff details
- **Fee Management**: Track student fees with monthly calendar view
- **Transfer Certificate**: Process and forward TC requests to teachers
- **School Events**: Manage upcoming events and activities
- **Inbox**: Communication system for school-wide messages

### 👨‍🏫 Teacher Dashboard

- **Profile Management**: Personal and professional information
- **Class Management**: View assigned classes and schedules
- **Student Queries**: Respond to student questions and concerns
- **Video Lectures**: Upload and manage educational content
- **Leave Requests**: Approve/reject student leave applications
- **Results Management**: Upload and manage student academic results
- **Student Information**: Class-wise student details and performance

### 🎓 Student Interface

- **Login System**: PAN-based authentication
- **Dashboard**: Comprehensive student information display

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router DOM
- **Styling**: CSS3 with modern design principles
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Project Structure

```
src/
├── pages/
│   ├── admin/
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── StudentDetailView.tsx
│   │   └── *.css
│   ├── teacher/
│   │   ├── TeacherLogin.tsx
│   │   ├── TeacherDashboard.tsx
│   │   └── *.css
│   └── student/
│       ├── StudentLogin.tsx
│       ├── StudentDashboard.tsx
│       └── *.css
├── types/
│   ├── admin.ts
│   ├── teacher.ts
│   └── react-router-dom.d.ts
├── App.tsx
└── main.tsx
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/admin-and-teacher-page.git
   cd admin-and-teacher-page
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 🔐 Demo Credentials

### Admin Login

- **Email**: `admin@slms.com`
- **Password**: `admin123`

### Teacher Login

- **Email**: `teacher@slms.com`
- **Password**: `teacher123`

### Student Login

- **PAN**: `1234567890`
- **Password**: `student123`

## 🌐 Routes

- **Student**: `/` (Login) → `/student/dashboard`
- **Admin**: `/admin` (Login) → `/admin/dashboard`
- **Teacher**: `/teacher` (Login) → `/teacher/dashboard`

## 🎨 Design Features

- **Responsive Design**: Works on all device sizes
- **Modern UI**: Clean and intuitive interface
- **Color-coded Elements**: Easy identification of different sections
- **Interactive Components**: Hover effects and smooth transitions
- **Professional Layout**: Suitable for educational institutions

## 🔧 Customization

The system is designed to be easily customizable:

- **Colors**: Modify CSS variables for brand colors
- **Data**: Replace mock data with real API endpoints
- **Features**: Add new modules as needed
- **Styling**: Customize CSS for different themes

## 📱 Responsive Design

- **Desktop**: Full-featured dashboard with sidebars
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Mobile-first responsive design

## 🚀 Future Enhancements

- [ ] Real-time notifications
- [ ] File upload system
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Offline capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Bhomik Varshney**

- GitHub: [@bhomik-varshney](https://github.com/bhomik-varshney)

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for the fast build tool
- TypeScript for type safety
- Modern CSS for beautiful styling

---

**Note**: This is a frontend-only implementation with mock data. For production use, integrate with backend APIs and implement proper authentication and data persistence.

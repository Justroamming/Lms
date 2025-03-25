const fetchData = async (url) => {
    try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonData = await response.json();
        const data = jsonData.data || [];
        console.log(`Data from ${url}:`, data);
        return data;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return [];
    }
};


const initializeData = async () => {
    try {
        console.log("Fetching user data...");

        const [admins, teachers, students, scores] = await Promise.all([
            fetchData('https://localhost:7231/Auths/GetAllAdmins'),
            fetchData('https://localhost:7231/Auths/GetAllTeachers'),
            fetchData('https://localhost:7231/Auths/GetAllStudents'),
            fetchData('https://localhost:7231/Auths/GetAllGrades')
        ]);

        window.admins = admins || [];
        window.teachers = teachers || [];
        window.students = students || [];
        window.scores = scores || [];

        console.log("Admins:", window.admins);
        console.log("Teachers:", window.teachers);
        console.log("Students:", window.students);
        console.log("Scores:", window.scores);

    } catch (error) {
        console.error('Error initializing data:', error);
    }
};


const login = async (email, password, role) => {
    const users = window[`${role}s`] || [];

    console.log(`Logging in as ${role}. Available users:`, users);

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log("User not found!");
        return false;
    }

   
    if (user.password !== password) {
        console.log("Incorrect password!");
        return false;
    }

    sessionStorage.setItem('currentUser', JSON.stringify({ ...user, role }));
    return true;
};

const getCurrentUser = () => JSON.parse(sessionStorage.getItem('currentUser'));

const logout = () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
};

const checkAuth = (role) => getCurrentUser()?.role === role;

// Hàm cập nhật thông tin người dùng hiện tại và làm mới giao diện
const updateCurrentUser = (userData) => {
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Kiểm tra nếu đang ở trang teacher-dashboard và đã có instance của TeacherNavigation
    if (window.navigationInstance && typeof window.navigationInstance.displayTeacherName === 'function') {
        window.navigationInstance.displayTeacherName();
    }
};

document.addEventListener('DOMContentLoaded', initializeData);

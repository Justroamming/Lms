class TeacherDashboard {
    constructor() {
        const currentUser = sessionStorage.getItem('currentUser');
        this.teacher = JSON.parse(currentUser);
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            // Fetch teacher data from API
            const response = await fetch(`https://localhost:7231/DashboardTeachers/GetTeacherById?id=${this.teacher.teacherId}`);
            const teacher = await response.json();
            const teacherData = teacher.data;
            console.log('Fetched teacher data:', teacherData);

            // If teacher is an array, take the first element
            const teacherDataInfo = Array.isArray(teacherData) ? teacherData[0] : teacherData;
            console.log('Teacher info to use:', teacherDataInfo);

            const welcomeElement = document.getElementById('teacherNameWelcome');
            const headerElement = document.getElementById('teacherName');
            
            if (welcomeElement) {
                welcomeElement.textContent = teacherData.lastName +" "+ teacherData.firstName || 'Giáo viên';
            }
            if (headerElement) {
                headerElement.textContent =  teacherData.lastName +" " +teacherData.firstName  || 'Giáo viên';
            }

       //     const data = await DataService.fetchDashboardData();
         //   this.updateDashboardView(data);
            
            // Update time
            this.updateDateTime();
            setInterval(() => this.updateDateTime(), 60000);
            
            // Listen for update events
            document.addEventListener('dashboard-data-updated', (event) => {
                this.updateDashboardView(event.detail);
            });
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            console.error('Error details:', error.message);
        }
    }

    updateDashboardView(data) {
        // Update teacher name
        const welcomeElement = document.getElementById('teacherNameWelcome');
        const headerElement = document.getElementById('teacherName');
        
        if (welcomeElement) welcomeElement.textContent = data.teacher.fullName;
        if (headerElement) headerElement.textContent = data.teacher.fullName;

        // Update statistics
        const { statistics } = data;
        const totalStudentsElement = document.getElementById('totalStudents');
        const averageElement = document.getElementById('averageScore');
        const passRateElement = document.getElementById('passRate');

        if (totalStudentsElement) totalStudentsElement.textContent = statistics.totalStudents;
        if (averageElement) averageElement.textContent = statistics.averageScore;
        if (passRateElement) passRateElement.textContent = `${statistics.passRate}%`;

        // Update recent scores
        this.updateRecentScores(data.recentScores);
        
        // Update schedule
        this.updateSchedule(data.schedule);
    }

    updateDateTime() {
        const dateElement = document.getElementById('currentDateTime');
        if (dateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            dateElement.textContent = now.toLocaleDateString('vi-VN', options);
        }
    }

    updateRecentScores(scores) {
        const recentScoresContainer = document.getElementById('recentScores');
        if (recentScoresContainer) {
            recentScoresContainer.innerHTML = scores.map(score => `
                <div class="score-item">
                    <div class="score-info">
                        <div class="score-student">${score.studentName}</div>
                        <div class="score-details">
                            ${score.subject} - ${score.type} - ${new Date(score.date).toLocaleDateString('vi-VN')}
                        </div>
                    </div>
                    <div class="score-value">${score.score}</div>
                </div>
            `).join('');
        }
    }

    async updateSchedule() {
        try {
            const response = await fetch(`https://localhost:7231/ScheduleTeachers/GetOneTeacherSchedule?id=${this.teacher.teacherId}`);
            const schedule = await response.json();
    
            if (!Array.isArray(schedule) || schedule.length === 0) {
                document.getElementById('todaySchedule').innerHTML = "<p>Không có lịch dạy.</p>";
                return;
            }
    
            const scheduleContainer = document.getElementById('todaySchedule');
            scheduleContainer.innerHTML = ""; // Clear previous content
    

                if (schedule) {
                    scheduleContainer.innerHTML += `
                        <table class="table-container">
                            <thead>
                                <tr>
                                    <th>Lịch dạy hôm nay</th>
                                    <th>Giảng viên</th>
                                    <th>Lớp</th>
                                    <th>Thời gian</th>
                                    <th>Địa điểm</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${schedule.subjectName}</td>
                                    <td>${schedule.teacherName}</td>
                                    <td>${schedule.cohortName}</td>
                                    <td>${schedule.startTime} - ${schedule.endTime}</td>
                                    <td>${schedule.location}</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    // Move to next week
                    currentDate.setDate(currentDate.getDate() + 7);
                    weeksCount++;
                } else {
                    // If no lessons are found, move forward by 7 days and check again
                    currentDate.setDate(currentDate.getDate() + 7);
                    weeksCount++;
                }
            
    
        } catch (error) {
            console.error("Lỗi khi tải lịch giảng dạy:", error);
        }
    }
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TeacherDashboard();
});

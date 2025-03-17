class StudentProfile extends BaseComponent {
    constructor() {
        super();
        this.student = JSON.parse(sessionStorage.getItem('currentUser'));
    
        if (!this.student) {
            console.error('Không tìm thấy thông tin học sinh');
            return;
        }
        this.setupModalHandlers();
    
        this.init();
        this.setupEventListeners();
    }

    async init() {
        await this.loadProfile();
        await this.loadAcademicInfo();
        
    }

    async loadProfile() {
        try {
           
            const cohortResponse = await fetch(`https://localhost:7231/ProfileStudents/GetCohortById?id=${this.student.cohortId}`);
            const cohort= await cohortResponse.json();
            const cohortData = cohort.data;

            const profileContent = `
                 <div class="profile-header">
            <div class="profile-avatar">
                <i class="fas fa-user-graduate"></i>
            </div>
            <h2 id="studentFullName">${this.student.lastName + " " +this.student.firstName}</h2>
            <p id="studentId">${this.student.studentId}</p>
            <div class="profile-status">
                <span class="status-badge active">
                    <i class="fas fa-check-circle"></i>Đang học
                </span>
            </div>
        </div>

                    <div class="profile-info">
                        <div class="info-section">
                            <h3><i class="fas fa-info-circle"></i> Thông tin cơ bản</h3>
                            <div class="info-grid">
                                <div class="info-group">
                                    <label>Họ :</label>
                                    <span id="studentLastNameInfo">${this.student.lastName}</span>
                                </div>
                                <div class="info-group">
                                    <label>Tên:</label>
                                    <span id="studentFirstNameInfo">${this.student.firstName}</span>
                                </div>
                                <div class="info-group">
                                    <label>Lớp:</label>
                                    <span id="studentClass">${cohortData.cohortName}</span>
                                </div>
                                <div class="info-group">
                                    <label>Mã học sinh:</label>
                                    <span id="studentId">${this.student.studentId}</span>
                                </div>
                                <div class="info-group">
                                    <label>Giới tính:</label>
                                    <span id="studentGender">${this.student.gender}</span>
                                </div>
                                <div class="info-group">
                                    <label>Ngày sinh:</label>
                                    <span id="studentDob">${this.student.dateOfBirth}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-info">
                        <div class="info-section">
                            <h3><i class="fas fa-info-circle"></i> Địa chỉ liên hệ</h3>
                            <div class="info-grid">
                                <div class="info-group">
                                    <label>Address: </label>
                                    <span id="studentAddress">${this.student.address}</span>
                                </div>
                                
                            </div>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-section personal-info">
                            <h3><i class="fas fa-info-circle"></i> Thông tin liên hệ</h3>
                            <div class="info-content two-columns">
                                <div class="info-item">
                                    <label><i class="fas fa-envelope"></i> Email:</label>
                                    <span id="studentEmail">${this.student.email || 'Chưa cập nhật'}</span>
                                </div>
                                <div class="info-item">
                                    <label><i class="fas fa-phone"></i> SĐT:</label>
                                    <span id="studentPhone">${this.student.phoneNumber || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="info-section ">
                            <h3><i class="fas fa-graduation-cap"></i> Thông tin học tập</h3>
                            <div class="info-content two-columns">
                                <div class="info-item">
                                    <label><i class="fas fa-star"></i> Điểm TB năm:</label>
                                    <span id="gpaYear" class="highlight">0.0</span>
                                </div>
                                <div class="info-item">
                                    <label><i class="fas fa-medal"></i> Xếp loại:</label>
                                    <span id="academicRank" class="highlight">-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-actions">
                        <button class="btn btn-secondary" id="changePasswordBtn">
                            <i class="fas fa-key"></i> Đổi mật khẩu
                        </button>
                        <button class="btn btn-info" id="printProfileBtn">
                            <i class="fas fa-print"></i> In hồ sơ
                        </button>
                    </div>
                </div>
            `;

            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer) {
                profileContainer.innerHTML = profileContent;
                document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.changePassword());
                document.getElementById('printProfileBtn')?.addEventListener('click', () => this.printProfile());
            }

            await this.loadAcademicInfo();
        } catch (error) {
            console.error('Lỗi khi load thông tin profile:', error);
        }
    }

    async loadAcademicInfo() {
        try {
             const response = await fetch(`https://localhost:7231/ProfileStudents/GetStudentOverallAverageScore?id=${this.student.studentId}`);
            if (!response.ok) throw new Error('Lỗi khi tải thống kê');
    
            const statsArray = await response.json();
    
            if (!Array.isArray(statsArray) || statsArray.length === 0) {
                console.error('Dữ liệu thống kê không hợp lệ');
                return;
            }
    
            const stats = statsArray[0];

            const gpa = stats.overallAverageScore ? parseFloat(stats.overallAverageScore).toFixed(2) : '0.00';

            const elements = {
                gpaYear: document.getElementById('gpaYear'),
                academicRank: document.getElementById('academicRank'),
                conductRank: document.getElementById('conductRank')
            };

            if (elements.gpaYear) elements.gpaYear.textContent = gpa;
            if (elements.academicRank) elements.academicRank.textContent = this.getAcademicRank(gpa);
            if (elements.conductRank) elements.conductRank.textContent = this.getConductRank(gpa);
        } catch (error) {
            console.error('Lỗi khi load thông tin học tập:', error);
        }
    }

    setupEventListeners() {
        const editProfileBtn = document.getElementById('editProfileBtn');
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.editProfile());
        }
        
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.changePassword());
        }
    }

    changePassword() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
        }
    }

    async savePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
    
        const isValid = await this.validatePassword(currentPassword, newPassword, confirmPassword);
        if (!isValid) {
            return alert('Mật khẩu không hợp lệ');
        }
    
        try {
            const response = await fetch(`https://localhost:7231/ProfileStudents/UpdateStudentPassword?id=${this.student.studentId || ""}&password=${confirmPassword}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
    
            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
                this.showToast('Đổi mật khẩu thành công!', 'success');
            } else {
                throw new Error('Failed to update password');
            }
        } catch (error) {
            this.showToast('Lỗi khi đổi mật khẩu!', 'error');
            console.error('Lỗi:', error);
        }
    }
    

    async printProfile() {
        try {
            const cohortResponse = await fetch(`https://localhost:7231/ProfileStudents/GetCohortById?id=${this.student.cohortId}`);
            const cohort= await cohortResponse.json();
            const cohortData = cohort.data;


            const printContent = `
                <div class="print-profile" style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="text-align: center; color: #333;">HỒ SƠ HỌC SINH</h2>
                    <div style="margin: 20px 0;">
                        <h3 style="color: #2196F3;">Thông tin cá nhân</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Họ:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.student.lastName || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tên:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.student.firstName || ''}</td>
                               
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Mã học sinh:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.student.studentId || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Lớp:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ cohortData.cohortName || ''}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Giới tính:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.student.gender || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày sinh:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ this.student.dateOfBirth || ''}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="color: #2196F3;">Thông tin liên hệ</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.student.email || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Số điện thoại:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.student.phoneNumber || ''}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="color: #2196F3;">Địa chỉ liên hệ</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Địa chỉ:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.student.address || ''}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="color: #2196F3;">Kết quả học tập</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Điểm trung bình :</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${document.getElementById('gpaYear')?.textContent || ''}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Xếp loại:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${document.getElementById('academicRank')?.textContent || ''}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Hồ sơ học sinh - ${this.student.lastName} ${this.student.firstName}</title>
                    </head>
                    <body>
                        ${printContent}
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                }
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Lỗi khi in hồ sơ:', error);
            this.showToast('Có lỗi xảy ra khi in hồ sơ!', 'error');
        }
    }

   

    getAcademicRank(gpa) {
        if (gpa >= 9.0) return 'Xuất sắc';
        if (gpa >= 8.0) return 'Giỏi';
        if (gpa >= 7.0) return 'Khá';
        if (gpa >= 4.0) return 'Trung bình';
        return 'Yếu';
    }

    getConductRank(gpa) {
        if (gpa >= 8.0) return 'Tốt';
        if (gpa >= 7.0) return 'Khá';
        if (gpa >= 4.0) return 'Trung bình';
        return 'Yếu';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    }

    async validatePassword(current, newPass, confirm) {
        const studentresponse = await fetch(`https://localhost:7231/ProfileStudents/GetStudentById?id=${this.student.studentId}`);
        const student = await studentresponse.json();
        const studentdata=student.data
        if (current !== studentdata.password) {
            this.showToast('Mật khẩu hiện tại không đúng!', 'error');
            return false;
        }
        if (newPass.length < 6) {
            this.showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
            return false;
        }
        if (newPass !== confirm) {
            this.showToast('Mật khẩu mới không khớp!', 'error');
            return false;
        }
        return true;
    }

    showToast(message, type) {
        console.log("showToast() called with:", message, type);
        
        const toastContainer = document.getElementById("toastContainer"); 
        if (!toastContainer) {
            console.error("Không tìm thấy phần tử #toastcontainer trong DOM!");
            return;
        }
    
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerText = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
            console.log("Toast removed");
        }, 5000);
    }
    
    

    setupModalHandlers() {
        document.body.addEventListener('show.bs.modal', function () {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
        });

        document.body.addEventListener('hidden.bs.modal', function () {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
            setTimeout(() => {
                document.body.style.overflow = 'auto';
            }, 100);
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
    }
    window.navigationInstance = new Navigation();
    
});
document.addEventListener("DOMContentLoaded", () => {
    window.studentProfile = new StudentProfile();
});

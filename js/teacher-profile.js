class TeacherProfile  {
    constructor() {
       
        this.teacher = JSON.parse(sessionStorage.getItem('currentUser'));
    
        if (!this.teacher) {
            console.error('Không tìm thấy thông tin giáo viên');
            return;
        }
        this.setupModalHandlers();
    
        this.init();
        this.setupEventListeners();
    }

    async init() {
        await this.loadProfile();

        
    }

    async loadProfile() {
        try {
           
          
            const profileContent = `
                 <div class="profile-header">
            <div class="profile-avatar">
                <i class="fas fa-user-graduate"></i>
            </div>
            <h2 id="teacherFullName">${this.teacher.lastName + " " +this.teacher.firstName}</h2>
            <p id="teacherId">${this.teacher.teacherId}</p>
           
        </div>

                    <div class="profile-info">
                        <div class="info-section">
                            <h3><i class="fas fa-info-circle"></i> Thông tin cơ bản</h3>
                            <div class="info-grid">
                                <div class="info-group">
                                    <label>Họ :</label>
                                    <span id="teacherLastNameInfo">${this.teacher.lastName}</span>
                                </div>

                                <div class="info-group">
                                    <label>Tên:</label>
                                    <span id="teacherFirstNameInfo">${this.teacher.firstName}</span>
                                </div>
                                
                                <div class="info-group">
                                    <label>Mã giáo viên:</label>
                                    <span id="teacherId">${this.teacher.teacherId}</span>
                                </div>

                                <div class="info-group">
                                    <label>Giới tính:</label>
                                    <span id="teacherGender">${this.teacher.gender}</span>
                                </div>

                                <div class="info-group">
                                    <label>Ngày sinh:</label>
                                    <span id="teacherDob">${this.teacher.dateOfBirth}</span>
                                </div>

                                <div class="info-group">
                                    <label>Địa chỉ: </label>
                                    <span id="teacherAddress">${this.teacher.address}</span>
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
                                    <span id="teacherEmail">${this.teacher.email || 'Chưa cập nhật'}</span>
                                </div>
                                <div class="info-item">
                                    <label><i class="fas fa-phone"></i> SĐT:</label>
                                    <span id="teacherPhone">${this.teacher.phoneNumber || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                       

                    <div class="profile-actions">
                        <button class="btn btn-secondary" id="changePasswordBtn"">
                            <i class="fas fa-key"></i> Đổi mật khẩu
                        </button>
                        <button class="btn btn-info" id="printProfileBtn">
                            <i class="fas fa-print"></i> In hồ sơ
                        </button>
                    </div>
                

                    
            `;

            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer) {
                profileContainer.innerHTML = profileContent;
                document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.changePassword());
                document.getElementById('printProfileBtn')?.addEventListener('click', () => this.printProfile());
            }

            
        } catch (error) {
            console.error('Lỗi khi load thông tin profile:', error);
        }
    }


    setupEventListeners() {
       
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        
       
        
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
            const response = await fetch(`https://localhost:7231/ProfileTeachers/UpdateTeacherPassword?id=${this.teacher.teacherId || ""}&password=${confirmPassword}`, {
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
            


            const printContent = `
                <div class="print-profile" style="padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="text-align: center; color: #333;">HỒ SƠ GIÁO VIÊN</h2>
                    <div style="margin: 20px 0;">
                        <h3 style="color: #2196F3;">Thông tin cá nhân</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Họ:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.teacher.lastName || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tên:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.teacher.firstName || ''}</td>
                               
                            </tr>
                            
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Giới tính:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.teacher.gender || ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày sinh:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ this.teacher.dateOfBirth || ''}</td>
                            </tr>
                            <tr>
                                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.teacher.email || ''}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Mã giáo viên:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.teacher.teacherId || ''}</td>
                               
                            </tr>
                        </table>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="color: #2196F3;">Thông tin liên hệ</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                          
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Số điện thoại:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.teacher.phoneNumber || ''}</td>
                                   <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Địa chỉ:</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${this.teacher.address || ''}</td>
                            </tr>
                        
                            </tr>
                        </table>
                    </div>

                         

                    
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Hồ sơ giáo viên- ${this.teacher.lastName} ${this.teacher.firstName}</title>
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

    
    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    }
   

    async validatePassword(current, newPass, confirm) {
        const teacherresponse = await fetch(`https://localhost:7231/ProfileTeachers/GetTeacherById?id=${this.teacher.teacherId}`);
        const teacher = await teacherresponse.json();
        const teacherdata=teacher.data
        if (current !== teacherdata.password) {
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
    if (!user || user.role !== 'teacher') {
        window.location.href = 'login.html';
    }
    window.navigationInstance = new TeacherNavigation();
    
});
document.addEventListener("DOMContentLoaded", () => {
    
    window.teacherProfile = new TeacherProfile();


});

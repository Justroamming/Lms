document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('https://your-api-endpoint.com/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const student = await response.json();
            // Lưu thông tin học sinh vào localStorage
            localStorage.setItem('currentStudent', JSON.stringify(student));
            window.location.href = 'student-dashboard.html';
        } else {
            alert('Email, mật khẩu hoặc không đúng!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Đã xảy ra lỗi, vui lòng thử lại sau!');
    }
});
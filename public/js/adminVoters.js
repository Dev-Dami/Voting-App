document.addEventListener('DOMContentLoaded', function() {
    // Reset password functionality
    const resetPasswordButtons = document.querySelectorAll('.reset-password-btn');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const cancelResetModalBtn = document.getElementById('cancel-reset-modal-btn');
    const newResetPasswordInput = document.getElementById('newResetPassword');
    const confirmResetPasswordInput = document.getElementById('confirmResetPassword');

    resetPasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            resetPasswordForm.action = `/admin/students/update-password/${studentId}`;
            resetPasswordModal.classList.remove('hidden');
        });
    });

    // Close modal when cancel button is clicked
    if (cancelResetModalBtn) {
        cancelResetModalBtn.addEventListener('click', function() {
            resetPasswordModal.classList.add('hidden');
            resetPasswordForm.reset();
        });
    }

    // Close modal when clicking outside the modal content
    resetPasswordModal.addEventListener('click', function(e) {
        if (e.target === resetPasswordModal) {
            resetPasswordModal.classList.add('hidden');
            resetPasswordForm.reset();
        }
    });

    // Validate passwords match before submitting
    resetPasswordForm.addEventListener('submit', function(e) {
        const newPassword = newResetPasswordInput.value;
        const confirmPassword = confirmResetPasswordInput.value;

        if (newPassword !== confirmPassword) {
            e.preventDefault();
            alert('Passwords do not match!');
            return false;
        }
        
        if (newPassword.length < 6) {
            e.preventDefault();
            alert('Password must be at least 6 characters long!');
            return false;
        }
    });
});
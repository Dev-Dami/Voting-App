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

    // Student search functionality
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const studentRows = document.querySelectorAll('.student-row');
    const studentCountElement = document.getElementById('studentCount');

    function filterStudents() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilterValue = statusFilter.value;

        let visibleCount = 0;

        studentRows.forEach(row => {
            const studentId = row.getAttribute('data-student-name').toLowerCase();
            const hasVoted = row.querySelector('.bg-green-100') !== null; // Green means voted
            
            let matchesSearch = true;
            let matchesStatus = true;

            // Check if student ID matches search term
            if (searchTerm && !studentId.includes(searchTerm)) {
                matchesSearch = false;
            }

            // Check if status matches filter
            if (statusFilterValue === 'voted' && !hasVoted) {
                matchesStatus = false;
            } else if (statusFilterValue === 'not-voted' && hasVoted) {
                matchesStatus = false;
            }

            if (matchesSearch && matchesStatus) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Update student count
        studentCountElement.textContent = visibleCount;
    }

    // Add event listeners for search and filter
    searchInput.addEventListener('input', filterStudents);
    statusFilter.addEventListener('change', filterStudents);

    // Click on student name to go to details page
    const studentClickableElements = document.querySelectorAll('.student-clickable');
    studentClickableElements.forEach(element => {
        element.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            window.location.href = `/admin/student/${studentId}`;
        });
    });
});
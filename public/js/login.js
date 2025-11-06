document.addEventListener('DOMContentLoaded', function() {
    const issueModal = document.getElementById('issueModal');
    const issueForm = document.getElementById('issueForm');
    const cancelIssueModalBtn = document.getElementById('cancel-issue-modal-btn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    // Open modal when forgot password link is clicked
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            issueModal.classList.remove('hidden');
        });
    }

    // Close modal when cancel button is clicked
    if (cancelIssueModalBtn) {
        cancelIssueModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            issueModal.classList.add('hidden');
            issueForm.reset();
        });
    }

    // Close modal when clicking on the backdrop
    window.addEventListener('click', function(event) {
        if (event.target === issueModal) {
            issueModal.classList.add('hidden');
            issueForm.reset();
        }
    });
});
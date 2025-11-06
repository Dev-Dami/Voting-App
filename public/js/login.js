document.addEventListener('DOMContentLoaded', function() {
    const issueFormContainer = document.getElementById('issueFormContainer');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const cancelIssueBtn = document.getElementById('cancel-issue-btn');

    // Show issue form when link is clicked
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            issueFormContainer.classList.remove('hidden');
        });
    }

    // Hide issue form when cancel button is clicked
    if (cancelIssueBtn) {
        cancelIssueBtn.addEventListener('click', function(e) {
            e.preventDefault();
            issueFormContainer.classList.add('hidden');
            // Reset form fields
            const form = issueFormContainer.querySelector('form');
            if (form) {
                form.reset();
            }
        });
    }
});
document.addEventListener("DOMContentLoaded", function () {
  const voteForm = document.getElementById("voteForm");
  const reviewVoteBtn = document.getElementById("reviewVoteBtn");
  const slideOutPanel = document.getElementById("slideOutPanel");
  const overlay = document.getElementById("overlay");
  const closePanelBtn = document.getElementById("closePanelBtn");
  const cancelReviewBtn = document.getElementById("cancelReviewBtn");
  const confirmVoteBtn = document.getElementById("confirmVoteBtn");
  const voteSummary = document.getElementById("voteSummary");
  const notification = document.getElementById("notification");

  let submitClicked = false;
  let timeoutDuration = 2000; // initial 2 seconds

  function showNotification(message) {
    notification.textContent = message;
    notification.classList.add("show");

    setTimeout(() => {
      notification.classList.remove("show");
    }, 2000);
  }

  function openPanel() {
    slideOutPanel.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closePanel() {
    slideOutPanel.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  reviewVoteBtn.addEventListener("click", function () {
    const allPositions = JSON.parse(voteForm.dataset.positions);
    let allVoted = true;
    const selections = {};

    allPositions.forEach((position) => {
      const inputName = position.replace(/\s+/g, "_").toLowerCase();
      const selectedRadio = voteForm.querySelector(
        `input[name="${inputName}"]:checked`,
      );

      if (!selectedRadio) {
        allVoted = false;
      } else {
        // Store both name and image from the radio input
        const candidateName = selectedRadio.dataset.candidateName;
        const candidateImage = selectedRadio
          .closest("label")
          .querySelector("img").src;
        selections[position] = {
          name: candidateName,
          image: candidateImage,
        };
      }
    });

    if (!allVoted) {
      alert("Please select a candidate for every position before reviewing.");
      return;
    }

    voteSummary.innerHTML = "";
    for (const position in selections) {
      const candidate = selections[position];
      const summaryItem = document.createElement("div");
      summaryItem.className =
        "bg-gray-50 rounded-lg p-4 border border-gray-200";

      summaryItem.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <img src="${candidate.image}" alt="${candidate.name}" class="w-12 h-12 rounded-full object-cover">
            <div>
              <h4 class="font-semibold text-gray-800">${position}</h4>
              <p class="text-gray-600 mt-1">${candidate.name}</p>
            </div>
          </div>
          <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      `;

      voteSummary.appendChild(summaryItem);
    }

    openPanel();
  });

  closePanelBtn.addEventListener("click", closePanel);
  cancelReviewBtn.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);

  confirmVoteBtn.addEventListener("click", function () {
    // Prevent multiple clicks
    if (confirmVoteBtn.disabled) {
      return;
    }

    // Disable the button and provide user feedback
    confirmVoteBtn.disabled = true;
    confirmVoteBtn.classList.add("opacity-70", "cursor-not-allowed");
    confirmVoteBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
        `;

    showNotification("Submitting your vote...");

    // Submit the form
    voteForm.submit();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && slideOutPanel.classList.contains("open")) {
      closePanel();
    }
  });
});

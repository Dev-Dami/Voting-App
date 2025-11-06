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
        selections[position] = selectedRadio.dataset.candidateName;
      }
    });

    if (!allVoted) {
      alert("Please select a candidate for every position before reviewing.");
      return;
    }

    voteSummary.innerHTML = "";
    for (const position in selections) {
      const summaryItem = document.createElement("div");
      summaryItem.className =
        "bg-gray-50 rounded-lg p-4 border border-gray-200";
      summaryItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-semibold text-gray-800">${position}</h4>
                        <p class="text-gray-600 mt-1">${selections[position]}</p>
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
    if (submitClicked) {
      showNotification(
        `Vote already submitted! Please wait ${timeoutDuration / 1000}s...`,
      );
      timeoutDuration += 2000;
      return;
    }

    submitClicked = true;
    confirmVoteBtn.disabled = true;
    confirmVoteBtn.classList.add("opacity-70", "cursor-not-allowed");
    showNotification("Submitting your vote...");

    setTimeout(() => {
      submitClicked = false;
      confirmVoteBtn.disabled = false;
      confirmVoteBtn.classList.remove("opacity-70", "cursor-not-allowed");
    }, timeoutDuration);

    voteForm.submit();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && slideOutPanel.classList.contains("open")) {
      closePanel();
    }
  });
});

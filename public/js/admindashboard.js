const positionSelect = document.getElementById("positionSelect");
const customInput = document.getElementById("customPositionInput");

positionSelect.addEventListener("change", function () {
  if (this.value === "Custom") {
    customInput.classList.remove("hidden");
    customInput.required = true;
  } else {
    customInput.classList.add("hidden");
    customInput.required = false;
  }
});

// Set default end time for election start
const electionEndTimeInput = document.getElementById("electionEndTime");
if (electionEndTimeInput) {
  const now = new Date();
  now.setHours(now.getHours() + 24); // Default to 24 hours from now
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  electionEndTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Election Timer
const electionStatus = "<%= election.status %>";
const electionEndTime = "<%= election.endTime %>";
const countdownElement = document.getElementById("countdown");

if (electionStatus === "running" && electionEndTime && countdownElement) {
  const endTime = new Date(electionEndTime).getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = endTime - now;

    if (distance < 0) {
      countdownElement.textContent = "00:00:00";
      clearInterval(timerInterval);
      // Optionally, refresh the page or update status via AJAX
      return;
    }

    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdownElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  updateTimer(); // Initial call
  const timerInterval = setInterval(updateTimer, 1000);
}

// Socket.IO for real-time vote updates
const socket = io();

socket.on("voteUpdate", (data) => {
  const voteCountElement = document.getElementById(`votes-${data.candidateId}`);
  if (voteCountElement) {
    voteCountElement.textContent = data.votes;
  }
});

// Socket.IO for real-time vote logs
socket.on("newVoteLog", (newLogs) => {
  const voteLogsTableBody = document.getElementById("voteLogsTableBody");
  if (voteLogsTableBody) {
    newLogs.forEach((log) => {
      const row = document.createElement("tr");
      row.classList.add("border-b", "hover:bg-gray-50", "transition");

      const studentIdCell = document.createElement("td");
      studentIdCell.classList.add("p-3");
      studentIdCell.textContent = log.studentId
        ? log.studentId.studentId
        : "Unknown";

      const candidateNameCell = document.createElement("td");
      candidateNameCell.classList.add("p-3", "font-medium");
      candidateNameCell.textContent = log.candidateId
        ? log.candidateId.name
        : "Deleted Candidate";

      const positionCell = document.createElement("td");
      positionCell.classList.add("p-3");
      positionCell.textContent = log.position;

      const dateCell = document.createElement("td");
      dateCell.classList.add("p-3", "text-sm", "text-gray-500");
      dateCell.textContent = log.createdAt
        ? new Date(log.createdAt).toLocaleString()
        : "N/A";

      row.appendChild(studentIdCell);
      row.appendChild(candidateNameCell);
      row.appendChild(positionCell);
      row.appendChild(dateCell);

      voteLogsTableBody.prepend(row); // Add to the top
    });
  }
});

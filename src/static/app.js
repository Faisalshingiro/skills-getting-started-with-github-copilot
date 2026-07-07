document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activitiesState = {};

  function clearActivityOptions() {
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
  }

  function renderActivities(activities) {
    activitiesState = activities;
    activitiesList.innerHTML = "";
    clearActivityOptions();

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participants = details.participants || [];
      const participantsMarkup = participants.length
        ? `<div class="participants-list">${participants
            .map(
              (participant) => `
                <div class="participant-row">
                  <span class="participant-name">${participant}</span>
                  <button type="button" class="participant-remove-btn" data-activity="${name}" data-participant="${participant}" aria-label="Remove ${participant}">
                    ✕
                  </button>
                </div>`
            )
            .join("")}</div>`
        : `<p class="participants-empty">No participants yet.</p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <h5>Participants</h5>
          ${participantsMarkup}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      renderActivities(activities);
      return activities;
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
      return activitiesState;
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        const updatedActivity = activitiesState[activity] || { participants: [] };
        const updatedParticipants = [...(updatedActivity.participants || []), email];
        activitiesState = {
          ...activitiesState,
          [activity]: {
            ...updatedActivity,
            participants: updatedParticipants,
          },
        };
        renderActivities(activitiesState);
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove-btn");
    if (!removeButton) {
      return;
    }

    const activity = removeButton.dataset.activity;
    const participant = removeButton.dataset.participant;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(participant)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        const updatedActivity = activitiesState[activity] || { participants: [] };
        const updatedParticipants = (updatedActivity.participants || []).filter(
          (registeredParticipant) => registeredParticipant !== participant
        );
        activitiesState = {
          ...activitiesState,
          [activity]: {
            ...updatedActivity,
            participants: updatedParticipants,
          },
        };
        renderActivities(activitiesState);
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Unable to unregister participant", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

async function renderGitTracker() {
  const logContainer = document.getElementById("git-log-container");

  try {
    const response = await fetch("./github-data.json");
    if (!response.ok) throw new Error("Matrix database offline");

    const events = await response.json();
    if (!Array.isArray(events)) throw new Error("Invalid structure format");

    if (events.length > 0) {
      logContainer.innerHTML = "";

      const recentSet = events.slice(0, 10);

      for (let i = 0; i < recentSet.length; i++) {
        const entry = recentSet[i];

        const logLink = document.createElement("a");
        logLink.href = `https://github.com/minichest/${entry.repo}/commit/${entry.sha}`;
        logLink.className = "log-link";
        logLink.target = "_blank";
        logLink.rel = "noopener noreferrer";

        const logRow = document.createElement("p");
        logRow.className = "data-field log-row";
        logRow.textContent = `LOG ${i + 1} - "${entry.message}"`;

        logLink.appendChild(logRow);
        logContainer.append(logLink);
      }
    } else {
      logContainer.innerHTML = `<p class="data-field">[IDLE] STANDBY // NO RECENT LOG SETS FOUND</p>`;
    }

  } catch (error) {
    console.error("Set sync failure:", error);
    logContainer.innerHTML = `<p class="status-tag error">[CRITICAL] MATRIX LOG UNRESOLVED</p>`;
  }
}

window.addEventListener("DOMContentLoaded", renderGitTracker);   
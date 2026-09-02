async function renderGitTracker() {
  const logContainer = document.getElementById("git-log-container");

  try {
    const response = await fetch("./github-data.json");
    if (!response.ok) throw new Error("Matrix database offline");

    const events = await response.json();
    if (!Array.isArray(events)) throw new Error("Invalid structure format");

    // 1. Filter out all active PushEvents from your data stream
    const pushEvents = events.filter(event => event.type === "PushEvent");

    if (pushEvents.length > 0) {
      // 2. Clear out your default loading text layout
      logContainer.innerHTML = "";

      // 3. Take the last 4 push events to create a clean set display
      const recentSet = pushEvents.slice(0, 10);

      // 4. Loop through the set and compile their tracking logs asynchronously
      for (let i = 0; i < recentSet.length; i++) {
        const currentPush = recentSet[i];
        const repoPath = currentPush.repo.name;
        const commitHash = currentPush.payload.head;

        // Fetch each corresponding handwritten description string name
        const commitResponse = await fetch(`https://api.github.com/repos/${repoPath}/commits/${commitHash}`, {
           headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer GITHUB_TOKEN_PLACEHOLDER",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });
        
        let commitMessage = "Matrix system update.";
        if (commitResponse.ok) {
          const commitDetails = await commitResponse.json();
          commitMessage = commitDetails.commit.message;
        }

        const logLink = document.createElement("a")
        logLink.href = `https://github.com/${repoPath}/commit/${commitHash}`;
        logLink.className = "log-link"
        logLink.target = "_blank";
        logLink.rel = "noopener noreferrer";

        logContainer.append(logLink)

        // 5. Append each commit element onto the screen list row by row
        const logRow = document.createElement("p");
        logRow.className = "data-field log-row";
        logRow.innerHTML = `LOG ${i + 1} - "${commitMessage}"`;
        
        logLink.appendChild(logRow);
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
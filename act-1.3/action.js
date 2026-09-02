async function renderGitTracker() {
  const statusContainer = document.getElementById("git-status");

  try {
    const response = await fetch("./github-data.json");
    
    if (!response.ok) {
      throw new Error(`System Error: Data file status ${response.status}`);
    }

    const events = await response.json();

    if (!Array.isArray(events)) {
        throw new Error(events.message || "Invalid API response structure");
    }

    const pushEvents = events.filter(event => event.type === "PushEvent");


    if (pushEvents.length > 0) {
      const latestPush = pushEvents[0]; 
      const repoName = latestPush.repo.name.split("/")[1];
      const commitMessage = latestPush.payload.commits[0].message;
      
      const eventDate = new Date(latestPush.created_at);
      const timeAgo = formatTimeAgo(eventDate);

      statusContainer.innerHTML = `
        <p><span class="status-tag active">[ONLINE]</span> CONNECTION STABLE</p>
        <p class="data-field">CORE.REPO // <span class="highlight">${repoName.toUpperCase()}</span></p>
        <p class="data-field">LAST.LOG  // "${commitMessage}"</p>
        <p class="timestamp">SYNCED: ${timeAgo}</p>
      `;
    } else {
      statusContainer.innerHTML = `
        <p><span class="status-tag idle">[IDLE]</span> NO RECENT DATA PUSHES DETECTED</p>
      `;
    }

  } catch (error) {
    console.error("Tracker link broken:", error);
    statusContainer.innerHTML = `
      <p><span class="status-tag error">[CRITICAL]</span> DATA EXTRACTION FAILED</p>
      <p class="timestamp">VERIFY SITE DISPATCH PIPELINES</p>
    `;
  }
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);

  if (interval >= 1) return `${interval}y ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval}mo ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  return "just now";
}

window.addEventListener("DOMContentLoaded", renderGitTracker);

const reservedPaths = new Set([
  'directory', 'videos', 'moderator', 'settings', 'search', 'p', 'popout', 
  'creator-dashboard', 'subs', 'prime', 'turbo', 'store', 'jobs', 'press', 
  'advertising', 'legal', 'security', 'downloads', 'help', 'team', 'about',
  'blog', 'partner', 'broadcast', 'community'
]);

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;

  chrome.storage.local.get('autoRedirect', (data) => {
    if (!data.autoRedirect) return;

    try {
      const url = new URL(details.url);
      const isTwitch = url.hostname === 'twitch.tv' || url.hostname === 'www.twitch.tv';
      if (!isTwitch) return;

      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        const potentialChannel = pathParts[0].toLowerCase();

        if (/^[a-zA-Z0-9_]{4,25}$/.test(potentialChannel) && !reservedPaths.has(potentialChannel)) {
          const channelName = pathParts[0];
          const coolTwitchUrl = `https://api.roaringiron.com/cooltwitch/?channel=${channelName}`;
          chrome.tabs.update(details.tabId, { url: coolTwitchUrl });
        }
      }
    } catch (e) {
      console.error("Erro no redirecionamento automático:", e);
    }
  });
}, { url: [{ hostContains: 'twitch.tv' }] });
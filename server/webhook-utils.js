// Discord webhook utility

// Track recent webhooks to prevent duplicates
const recentWebhooks = new Map();
const WEBHOOK_COOLDOWN_MS = 5000; // 5 seconds cooldown

// Track pending webhook batches by player ID
const pendingPlayerWebhooks = new Map();
const WEBHOOK_BATCH_DELAY_MS = 2000; // 2 seconds to batch webhook messages

/**
 * Queue a webhook notification for batching
 * @param {string} webhookUrl - Discord webhook URL 
 * @param {object} data - Player and tier data
 * @returns {Promise<void>}
 */
export async function queueWebhookNotification(webhookUrl, data) {
  if (!webhookUrl) {
    console.error('No webhook URL provided');
    return;
  }
  
  // Use player ID as the key for batching
  const playerId = data.playerId;
  if (!playerId) {
    console.error('No player ID provided for webhook batching');
    // Fall back to immediate sending if no player ID
    return sendDiscordWebhook(webhookUrl, data);
  }
  
  // Store the webhook data
  pendingPlayerWebhooks.set(playerId, {
    webhookUrl,
    data: {
      username: data.username,
      avatarUrl: data.avatarUrl,
      combatTitle: data.combatTitle,
      tiers: data.tiers,
      timestamp: Date.now()
    },
    timeoutId: null
  });
  
  // Clear any existing timeout for this player
  const existingTimeout = pendingPlayerWebhooks.get(playerId)?.timeoutId;
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  // Set a new timeout to send the webhook after the batch delay
  const timeoutId = setTimeout(() => {
    const pendingWebhook = pendingPlayerWebhooks.get(playerId);
    if (pendingWebhook) {
      sendDiscordWebhook(pendingWebhook.webhookUrl, pendingWebhook.data);
      pendingPlayerWebhooks.delete(playerId);
    }
  }, WEBHOOK_BATCH_DELAY_MS);
  
  // Update the timeout ID in the map
  const pendingWebhook = pendingPlayerWebhooks.get(playerId);
  pendingPlayerWebhooks.set(playerId, {
    ...pendingWebhook,
    timeoutId
  });
}

/**
 * Send data to a Discord webhook
 * @param {string} webhookUrl - Discord webhook URL
 * @param {object} data - Data to send to the webhook
 * @param {string} data.username - Player username
 * @param {string} data.avatarUrl - Player avatar URL
 * @param {string} data.combatTitle - Player combat title
 * @param {object} data.tiers - Player tier data
 * @returns {Promise<boolean>} - Success status
 */
export async function sendDiscordWebhook(webhookUrl, data) {
  if (!webhookUrl) {
    console.error('No webhook URL provided');
    return false;
  }
  
  // Validate webhook URL format
  if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    console.error('Invalid Discord webhook URL format');
    return false;
  }
  
  // Ensure URL is valid before attempting to fetch
  try {
    // This will throw an error if the URL is invalid
    new URL(webhookUrl);
  } catch (error) {
    console.error('Invalid webhook URL:', error.message);
    return false;
  }
  
  try {
    // Ensure data.tiers is an array
    const tiers = Array.isArray(data.tiers) ? data.tiers : [];
    
    // Create embed fields for each tier - only show tiers that exist
    let fields = [];
    if (tiers.length > 0) {
      fields = tiers.map(tier => {
        return {
          name: `${tier.category.charAt(0).toUpperCase() + tier.category.slice(1)} Tier`,
          value: `**${tier.tier}**`,
          inline: true
        };
      });
    }
    
    // If no tiers are available, don't send a webhook at all
    if (fields.length === 0) {
      console.log('No tiers to report in webhook, skipping');
      return false;
    }
    
    // Create a unique key for this webhook based on username only (not tier data)
    // This allows us to avoid duplicates while still showing tier updates
    const webhookKey = `${data.username}`;
    
    // Check if we've sent this exact webhook recently
    const lastSent = recentWebhooks.get(webhookKey);
    const now = Date.now();
    
    if (lastSent && (now - lastSent) < WEBHOOK_COOLDOWN_MS) {
      console.log(`Webhook for ${data.username} was sent recently, skipping duplicate`);
      return false;
    }
    
    // Update the last sent time for this webhook key
    recentWebhooks.set(webhookKey, now);
    
    // Clean up old entries from the Map to prevent memory leaks
    for (const [key, timestamp] of recentWebhooks.entries()) {
      if (now - timestamp > 30000) { // Remove entries older than 30 seconds
        recentWebhooks.delete(key);
      }
    }
    
    // Get tier color based on first tier (or default to gray)
    const tierColors = {
      'SS': 14423100, // Pink
      'S': 15277667,  // Orange
      'A': 16737095,  // Yellow
      'B': 4312575,   // Light blue
      'C': 3066993,   // Green
      'D': 9807270,   // Purple
      'E': 10197915   // Gray
    };
    
    const color = tiers.length > 0 ? (tierColors[tiers[0]?.tier] || 10197915) : 10197915; // Default to gray if no tiers
    
    // Construct webhook payload
    const payload = {
      username: "Blox Fruits Tier List",
      avatar_url: "https://styles.redditmedia.com/t5_3plfp/styles/communityIcon_fkqevnorvsm61.png",
      embeds: [
        {
          title: `${data.username} | ${data.combatTitle}`,
          thumbnail: {
            url: data.avatarUrl
          },
          color: color,
          fields: fields,
          footer: {
            text: "Blox Fruits PVP Tier List"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    // Send the webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    console.log(`Webhook sent successfully for ${data.username}`);
    return true;
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    return false;
  }
}
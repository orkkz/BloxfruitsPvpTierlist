// Discord webhook utility

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
    
    return true;
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    return false;
  }
}
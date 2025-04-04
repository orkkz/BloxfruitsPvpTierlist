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
  
  try {
    // Create embed fields for each tier
    const fields = data.tiers.map(tier => {
      return {
        name: `${tier.category.charAt(0).toUpperCase() + tier.category.slice(1)} Tier`,
        value: `**${tier.tier}**`,
        inline: true
      };
    });
    
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
    
    const color = tierColors[data.tiers[0]?.tier] || 10197915;
    
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
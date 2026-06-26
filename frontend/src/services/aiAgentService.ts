// LOCAL FRONTEND AI AGENT SERVICE

export interface AIAgentAction {
  intent: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  parameters: Record<string, any>;
  description: string;
  targetUrl?: string;
}

export interface AIAgentResponse {
  message: string;
  action?: AIAgentAction;
  success: boolean;
}

export function parseAgentCommand(query: string, isAdmin: boolean = false): AIAgentResponse {
  const q = query.toLowerCase().trim();
  console.log(`[AI Agent] Parsing command (Admin: ${isAdmin}): "${query}"`);

  // USER AGENT ACTIONS
  
  // 1. Register Team
  if (q.includes('register') && (q.includes('team') || q.includes('register my team'))) {
    const teamMatch = q.match(/team\s+([a-zA-Z0-9\s]+?)\s+to/i) || q.match(/register\s+([a-zA-Z0-9\s]+?)\s+for/i);
    const tournamentMatch = q.match(/for\s+([a-zA-Z0-9\s]+)$/i) || q.match(/to\s+([a-zA-Z0-9\s]+)$/i) || q.match(/tournament\s+([a-zA-Z0-9\s]+)$/i);
    
    const teamName = teamMatch ? teamMatch[1].trim() : "My Team";
    const tournamentName = tournamentMatch ? tournamentMatch[1].trim() : "Upcoming Tournament";

    return {
      success: true,
      message: `I have extracted the details. Ready to register team "${teamName}" for the tournament matching "${tournamentName}". I will open the registration flow for you.`,
      action: {
        intent: 'REGISTER_TEAM',
        parameters: { teamName, tournamentName },
        description: `Initiate team registration for "${teamName}"`,
        targetUrl: `/tournaments`
      }
    };
  }

  // 2. Upgrade Membership
  if (q.includes('upgrade') || q.includes('membership') || q.includes('platinum') || q.includes('gold') || q.includes('silver')) {
    let tier = 'silver';
    if (q.includes('platinum')) tier = 'platinum';
    else if (q.includes('gold')) tier = 'gold';

    return {
      success: true,
      message: `Sure! I am redirecting you to the membership upgrade page to subscribe to the ${tier.toUpperCase()} plan, which includes up to ${tier === 'platinum' ? '20%' : tier === 'gold' ? '10%' : '5%'} off all tournaments.`,
      action: {
        intent: 'UPGRADE_MEMBERSHIP',
        parameters: { tier },
        description: `Upgrade user membership to ${tier.toUpperCase()}`,
        targetUrl: `/dashboard?tab=membership`
      }
    };
  }

  // 3. Download Certificate
  if (q.includes('certificate') || q.includes('download')) {
    return {
      success: true,
      message: `Certainly. Redirecting you to your career profile where you can download winner, runner-up, or participation certificates.`,
      action: {
        intent: 'DOWNLOAD_CERTIFICATE',
        parameters: {},
        description: `Navigate to profiles to download certificates`,
        targetUrl: `/profile`
      }
    };
  }

  // 4. Filter Tournaments
  if (q.includes('tournament') && (q.includes('above') || q.includes('greater than') || q.includes('more than') || q.includes('limit') || q.includes('fee'))) {
    const numberMatch = q.match(/\d+/);
    const amount = numberMatch ? parseInt(numberMatch[0]) : 50000;
    
    return {
      success: true,
      message: `Filtering tournaments matching your budget criteria (Prize pool / Entry fee around ₹${amount.toLocaleString()}).`,
      action: {
        intent: 'VIEW_TOURNAMENTS',
        parameters: { minPrizePool: amount },
        description: `Filter tournaments with prize pool above ₹${amount}`,
        targetUrl: `/tournaments?minPrize=${amount}`
      }
    };
  }

  // ADMIN AGENT ACTIONS (Requires Admin status)
  
  if (isAdmin) {
    // 5. Create Tournament
    if (q.includes('create tournament') || q.includes('add tournament')) {
      const nameMatch = q.match(/(?:create|add)\s+tournament\s+([a-zA-Z0-9\s]+?)(?:\s+at|\s+in|$)/i);
      const venueMatch = q.match(/at\s+([a-zA-Z0-9\s,]+)$/i) || q.match(/in\s+([a-zA-Z0-9\s,]+)$/i);
      
      const name = nameMatch ? nameMatch[1].trim() : "Summer Blast League";
      const venue = venueMatch ? venueMatch[1].trim() : "Local Cricket Arena";

      return {
        success: true,
        message: `Understood Admin! Initializing creation flow for tournament "${name}" located at "${venue}".`,
        action: {
          intent: 'CREATE_TOURNAMENT',
          parameters: { name, venue, entryFee: 1500, prizePool: 100000 },
          description: `Create tournament "${name}"`,
          targetUrl: `/admin/tournaments?action=new&name=${encodeURIComponent(name)}&venue=${encodeURIComponent(venue)}`
        }
      };
    }

    // 6. Generate Fixtures
    if (q.includes('generate fixture') || q.includes('create fixture') || q.includes('schedule match')) {
      return {
        success: true,
        message: `Opening the AI Fixture generator. I will read the registered teams and set up a round-robin or knockout schedule for the active tournament.`,
        action: {
          intent: 'GENERATE_FIXTURES',
          parameters: {},
          description: `Generate fixtures for active tournament`,
          targetUrl: `/admin/fixtures`
        }
      };
    }

    // 7. Send Reminder Emails
    if (q.includes('send reminder') || q.includes('remind teams') || q.includes('email reminder')) {
      return {
        success: true,
        message: `Triggering automated emails! Reminder notifications will be sent to all confirmed team captains with match schedules and QR check-in instructions.`,
        action: {
          intent: 'SEND_REMINDERS',
          parameters: {},
          description: `Trigger automated reminder emails`,
          targetUrl: `/admin?trigger=reminders`
        }
      };
    }

    // 8. Show Revenue Report
    if (q.includes('revenue') || q.includes('earnings') || q.includes('analytics') || q.includes('report')) {
      return {
        success: true,
        message: `Loading financial reports. Charting total tournament fees, active memberships, and registration growth inside the analytics dashboard.`,
        action: {
          intent: 'SHOW_REVENUE',
          parameters: {},
          description: `Show Admin revenue analytics charts`,
          targetUrl: `/admin`
        }
      };
    }
  }

  // Default Fallback Response
  return {
    success: true,
    message: `I'm your CricketHub Pro assistant. Ask about tournaments or try commands like "upgrade membership to gold".`,
    action: {
      intent: 'CHAT_FALLBACK',
      parameters: { text: query },
      description: `Fallback conversation`
    }
  };
}

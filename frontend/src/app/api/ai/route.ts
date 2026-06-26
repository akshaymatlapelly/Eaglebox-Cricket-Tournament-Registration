import { NextResponse } from 'next/server';

interface AIAgentAction {
  intent: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  parameters: Record<string, any>;
  description: string;
  targetUrl?: string;
}

interface AIAgentResponse {
  message: string;
  action?: AIAgentAction;
  success: boolean;
}

// System prompt to give Gemini the project bias and guide its behavior
const SYSTEM_PROMPT = `You are the CricketHub Pro AI Assistant.
CricketHub Pro is an AI-powered Tournament Registration & Sports Venue Management Ecosystem.

CRITICAL INSTRUCTION:
- ALWAYS respond in 1 to 3 lines maximum.
- Keep answers extremely short, direct, and under 40 words total.
- NEVER write long paragraphs or lists.

Focus (project bias):
- User Portal routes: /dashboard, /tournaments, /profile, /membership
- Admin Portal routes: /admin, /admin/fixtures, /admin/scoring, /admin/qr-verify`;

// Conversational Simulator for fallback when Gemini API key is missing
function simulateAIResponse(query: string, isAdmin: boolean): AIAgentResponse {
  const q = query.toLowerCase().trim();
  
  // 1. Actions parsing (so local command triggers continue to function correctly)
  
  // Register Team
  if (q.includes('register') && (q.includes('team') || q.includes('register my team'))) {
    const teamMatch = q.match(/team\s+([a-zA-Z0-9\s]+?)\s+to/i) || q.match(/register\s+([a-zA-Z0-9\s]+?)\s+for/i);
    const tournamentMatch = q.match(/for\s+([a-zA-Z0-9\s]+)$/i) || q.match(/to\s+([a-zA-Z0-9\s]+)$/i) || q.match(/tournament\s+([a-zA-Z0-9\s]+)$/i);
    const teamName = teamMatch ? teamMatch[1].trim() : "My Team";
    const tournamentName = tournamentMatch ? tournamentMatch[1].trim() : "Upcoming Tournament";

    return {
      success: true,
      message: `Ready to register team **${teamName}** for **${tournamentName}**. Redirecting you to the registration portal now...`,
      action: {
        intent: 'REGISTER_TEAM',
        parameters: { teamName, tournamentName },
        description: `Initiate team registration for "${teamName}"`,
        targetUrl: `/tournaments`
      }
    };
  }

  // Upgrade Membership
  if (q.includes('upgrade') || q.includes('membership') || q.includes('platinum') || q.includes('gold') || q.includes('silver')) {
    let tier = 'silver';
    if (q.includes('platinum')) tier = 'platinum';
    else if (q.includes('gold')) tier = 'gold';

    return {
      success: true,
      message: `Redirecting you to the membership pricing panel to join the **${tier.toUpperCase()} Club** (includes ${tier === 'platinum' ? '20%' : tier === 'gold' ? '10%' : '5%'} off entry fees).`,
      action: {
        intent: 'UPGRADE_MEMBERSHIP',
        parameters: { tier },
        description: `Upgrade user membership to ${tier.toUpperCase()}`,
        targetUrl: `/membership`
      }
    };
  }

  // Download Certificate
  if (q.includes('certificate') || q.includes('download')) {
    return {
      success: true,
      message: `Certainly! Redirecting you to your career profile where you can view and download your HTML5 PDF achievement certificates.`,
      action: {
        intent: 'DOWNLOAD_CERTIFICATE',
        parameters: {},
        description: `Navigate to profiles to download certificates`,
        targetUrl: `/profile`
      }
    };
  }

  // Admin Actions
  if (isAdmin) {
    if (q.includes('create tournament') || q.includes('add tournament')) {
      const nameMatch = q.match(/(?:create|add)\s+tournament\s+([a-zA-Z0-9\s]+?)(?:\s+at|\s+in|$)/i);
      const venueMatch = q.match(/at\s+([a-zA-Z0-9\s,]+)$/i) || q.match(/in\s+([a-zA-Z0-9\s,]+)$/i);
      const name = nameMatch ? nameMatch[1].trim() : "Summer Blast League";
      const venue = venueMatch ? venueMatch[1].trim() : "Local Cricket Arena";

      return {
        success: true,
        message: `Admin, initializing creation form for **${name}** at **${venue}**. Opening the Tournaments Editor...`,
        action: {
          intent: 'CREATE_TOURNAMENT',
          parameters: { name, venue, entryFee: 1500, prizePool: 100000 },
          description: `Create tournament "${name}"`,
          targetUrl: `/admin/tournaments`
        }
      };
    }

    if (q.includes('generate fixture') || q.includes('create fixture') || q.includes('schedule match')) {
      return {
        success: true,
        message: `Opening the AI Fixtures Scheduler in the admin portal to auto-generate league brackets and match schedules.`,
        action: {
          intent: 'GENERATE_FIXTURES',
          parameters: {},
          description: `Generate fixtures for active tournament`,
          targetUrl: `/admin/fixtures`
        }
      };
    }
  }

  // 2. Conversational response matching (ChatGPT style with Project Bias)

  // Project Specifics & Tech Stack
  if (q.includes('tech stack') || q.includes('technologies') || q.includes('how was it built') || q.includes('database')) {
    return {
      success: true,
      message: `CricketHub Pro is built using Next.js, React 19, Tailwind CSS, Supabase (Database, Auth, Storage) with mock fallback, Recharts, and Framer Motion.`
    };
  }

  // About CricketHub Pro
  if (q.includes('what is crickethub') || q.includes('about the project') || q.includes('purpose') || q.includes('what does this app do')) {
    return {
      success: true,
      message: `CricketHub Pro is an AI sports-tech ecosystem. It features a User Operations Portal for players and an Admin Portal for organizers.`
    };
  }

  // Rules of Cricket / T20 Rules
  if (q.includes('rule') || q.includes('how to play') || q.includes('cricket rule') || q.includes('t20')) {
    return {
      success: true,
      message: `In T20 cricket, two teams of 11 players bowl and bat for 20 overs. Boundaries score 4 or 6 runs, and the team with the most runs wins.`
    };
  }

  // General questions (ChatGPT-style fallbacks)
  if (q.includes('joke') || q.includes('funny') || q.includes('laugh')) {
    const jokes = [
      `Why did the cricket player go to the bank? To get his *runs* checked! 😂`,
      `Why are cricket grounds always cool? Because they have thousands of *fans*! 🏟️`,
      `How do cricket players stay in shape? They do a lot of *bowling* and running between wickets! 🏃`
    ];
    return {
      success: true,
      message: jokes[Math.floor(Math.random() * jokes.length)]
    };
  }

  if (q.includes('code') || q.includes('javascript') || q.includes('html') || q.includes('react') || q.includes('function')) {
    return {
      success: true,
      message: `As an AI assistant, I can help you write code! Let me know if you need help refactoring or writing state/context hooks for this project.`
    };
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('greetings') || q.includes('who are you')) {
    return {
      success: true,
      message: `Hello! Welcome to CricketHub Pro 👋. I'm your AI Assistant. How can I help you manage tournaments or navigate the platform today?`
    };
  }

  // Generic Fallback (Very descriptive and context-aware ChatGPT simulation)
  const topic = query.split(' ').slice(0, 3).join(' ') || 'your query';
  return {
    success: true,
    message: `I'd be happy to help with your query about **"${topic}..."**! You can ask me to upgrade membership, register a team, or open the admin panels.`
  };
}

export async function POST(request: Request) {
  try {
    const { query, isAdmin } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, message: 'Missing query parameters' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      // Direct REST API Call to Gemini (No npm library wrapper required, React 19/Next 16 safe)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: query
                }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              {
                text: SYSTEM_PROMPT
              }
            ]
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        let geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText) {
          // Ensure response is strictly 1 to 3 lines max
          const lines = geminiText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
          if (lines.length > 3) {
            geminiText = lines.slice(0, 3).join('\n');
          }

          // Check if Gemini text implies a direct user portal command intent (for actions execution)
          const localParsed = simulateAIResponse(query, isAdmin);
          
          return NextResponse.json({
            success: true,
            message: geminiText,
            // Pass down action metadata if detected locally, keeping local command redirection working
            action: localParsed.action
          });
        }
      }
      
      console.warn('[AI] Gemini API request failed. Falling back to conversational simulator.');
    }

    // Call fallback conversational simulator
    const fallbackResponse = simulateAIResponse(query, isAdmin);
    return NextResponse.json(fallbackResponse);

  } catch (error: any) {
    console.error('[AI API Error]', error);
    return NextResponse.json({
      success: false,
      message: 'Sorry, I encountered an issue processing your AI request. Please try again.'
    }, { status: 500 });
  }
}

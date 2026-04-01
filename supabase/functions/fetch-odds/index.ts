import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ODDS_API_KEY = Deno.env.get("ODDS_API_KEY") || "";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

const SPORT_KEYS: Record<string, string> = {
  "Football": "americanfootball_nfl",
  "Basketball": "basketball_nba",
  "Baseball": "baseball_mlb",
  "Hockey": "icehockey_nhl",
  "Soccer": "soccer_usa_mls",
  "Tennis": "tennis_atp_aus_open",
};

const IN_SEASON_SPORTS = ["Basketball", "Hockey"];

const BOOKMAKER_MAP: Record<string, string> = {
  "betonlineag": "BetOnline",
  "bovada": "Bovada",
  "mybookieag": "MyBookie",
  "fanduel": "FanDuel",
  "draftkings": "DraftKings",
  "betmgm": "BetMGM",
  "caesars": "Caesars",
  "betrivers": "BetRivers",
  "pointsbetus": "PointsBet",
  "unibet_us": "Unibet",
  "williamhill_us": "Caesars",
  "barstool": "ESPN BET",
  "espnbet": "ESPN BET",
  "bet365": "bet365",
};

interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

function americanOdds(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

async function fetchOddsForSport(sportKey: string, sport: string): Promise<OddsApiEvent[]> {
  if (!ODDS_API_KEY) {
    return [];
  }

  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch odds for ${sport}: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching odds for ${sport}:`, error);
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let allOddsData: { sport: string; events: OddsApiEvent[] }[] = [];

    for (const sport of IN_SEASON_SPORTS) {
      const sportKey = SPORT_KEYS[sport];
      if (sportKey) {
        const events = await fetchOddsForSport(sportKey, sport);
        if (events.length > 0) {
          allOddsData.push({ sport, events });
        }
      }
    }

    const oddsRecords: {
      external_id: string;
      sport: string;
      home_team: string;
      away_team: string;
      game_time: string;
      market_type: string;
      sportsbook: string;
      home_odds: number | null;
      away_odds: number | null;
      spread: number | null;
      total: number | null;
      updated_at: string;
    }[] = [];

    for (const { sport, events } of allOddsData) {
      for (const event of events) {
        for (const bookmaker of event.bookmakers) {
          const sportsbookName = BOOKMAKER_MAP[bookmaker.key] || bookmaker.title;

          for (const market of bookmaker.markets) {
            let marketType = "Money Line";
            if (market.key === "spreads") marketType = "Point Spread";
            if (market.key === "totals") marketType = "Totals";

            const homeOutcome = market.outcomes.find(o => o.name === event.home_team);
            const awayOutcome = market.outcomes.find(o => o.name === event.away_team);
            const overOutcome = market.outcomes.find(o => o.name === "Over");
            const underOutcome = market.outcomes.find(o => o.name === "Under");

            let homeOdds: number | null = null;
            let awayOdds: number | null = null;
            let spread: number | null = null;
            let total: number | null = null;

            if (market.key === "h2h") {
              homeOdds = homeOutcome ? americanOdds(homeOutcome.price) : null;
              awayOdds = awayOutcome ? americanOdds(awayOutcome.price) : null;
            } else if (market.key === "spreads") {
              homeOdds = homeOutcome ? americanOdds(homeOutcome.price) : null;
              awayOdds = awayOutcome ? americanOdds(awayOutcome.price) : null;
              spread = homeOutcome?.point || null;
            } else if (market.key === "totals") {
              homeOdds = overOutcome ? americanOdds(overOutcome.price) : null;
              awayOdds = underOutcome ? americanOdds(underOutcome.price) : null;
              total = overOutcome?.point || null;
            }

            oddsRecords.push({
              external_id: event.id,
              sport,
              home_team: event.home_team,
              away_team: event.away_team,
              game_time: event.commence_time,
              market_type: marketType,
              sportsbook: sportsbookName,
              home_odds: homeOdds,
              away_odds: awayOdds,
              spread,
              total,
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    if (oddsRecords.length > 0) {
      const { error } = await supabase
        .from("odds")
        .upsert(oddsRecords, { onConflict: "external_id,market_type,sportsbook" });

      if (error) {
        console.error("Error upserting odds:", error);
      }
    }

    const { data: freshOdds, error: fetchError } = await supabase
      .from("odds")
      .select("*")
      .gte("game_time", new Date().toISOString())
      .order("game_time", { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    const gamesMap = new Map<string, {
      id: string;
      sport: string;
      homeTeam: string;
      awayTeam: string;
      gameTime: string;
      odds: Record<string, Record<string, { home: number | null; away: number | null; spread?: number; total?: number }>>;
    }>();

    for (const record of freshOdds || []) {
      const key = `${record.external_id}-${record.home_team}-${record.away_team}`;

      if (!gamesMap.has(key)) {
        gamesMap.set(key, {
          id: record.external_id,
          sport: record.sport,
          homeTeam: record.home_team,
          awayTeam: record.away_team,
          gameTime: record.game_time,
          odds: {},
        });
      }

      const game = gamesMap.get(key)!;

      if (!game.odds[record.market_type]) {
        game.odds[record.market_type] = {};
      }

      game.odds[record.market_type][record.sportsbook] = {
        home: record.home_odds,
        away: record.away_odds,
        spread: record.spread,
        total: record.total,
      };
    }

    const games = Array.from(gamesMap.values());

    return new Response(JSON.stringify({ games, updated: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-odds:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch odds" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

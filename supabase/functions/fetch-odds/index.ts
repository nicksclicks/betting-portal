import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ODDS_API_KEY = Deno.env.get("ODDS_API_KEY") || "";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

/** The Odds API bills ~1 region per 10 bookmakers — batch to avoid truncated responses. */
const BOOKMAKER_BATCH_SIZE = 8;
const SUPABASE_PAGE_SIZE = 1000;
const ODDS_GAME_LOOKBACK_MS = 6 * 60 * 60 * 1000;

const SPORT_KEYS: Record<string, string[]> = {
  "Football": ["americanfootball_nfl"],
  "Basketball": ["basketball_nba"],
  "Baseball": ["baseball_mlb"],
  "Hockey": ["icehockey_nhl"],
  "Soccer": ["soccer_usa_mls", "soccer_fifa_world_cup"],
  "Tennis": ["tennis_atp_aus_open"],
};

/** Maps Odds API bookmaker keys to display names — sync with src/constants/sportsbooks.ts */
const BOOKMAKER_MAP: Record<string, string> = {
  betonlineag: "BetOnline",
  bovada: "Bovada",
  mybookieag: "MyBookie",
  betus: "BetUS",
  everygame: "Everygame",
  betanysports: "BetAnything",
  fanduel: "FanDuel",
  draftkings: "DraftKings",
  betmgm: "BetMGM",
  caesars: "Caesars",
  betrivers: "BetRivers",
  williamhill_us: "Caesars",
  barstool: "ESPN BET",
  espnbet: "ESPN BET",
  fliff: "Fliff",
  rebet: "Rebet",
  novig: "Novig",
  prophetx: "ProphetX",
};

const BOOKMAKER_KEYS = Object.keys(BOOKMAKER_MAP);
const ALLOWED_SPORTSBOOKS = [...new Set(Object.values(BOOKMAKER_MAP))];

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

interface OddsRecord {
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
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function americanOdds(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

const NON_TEAM_OUTCOME_NAMES = new Set(["Over", "Under", "Draw"]);

function normTeamName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Outcome names often differ from event.home_team (e.g. "Athletics" vs "Oakland Athletics"). */
function findTeamOutcome(
  outcomes: OddsApiOutcome[],
  teamName: string,
  otherTeamName: string,
): OddsApiOutcome | undefined {
  const exact = outcomes.find((o) => o.name === teamName);
  if (exact) return exact;

  const nTeam = normTeamName(teamName);
  const fuzzy = outcomes.find((o) => {
    const n = normTeamName(o.name);
    return n === nTeam || n.includes(nTeam) || nTeam.includes(n);
  });
  if (fuzzy) return fuzzy;

  const teamOutcomes = outcomes.filter((o) => !NON_TEAM_OUTCOME_NAMES.has(o.name));
  if (teamOutcomes.length !== 2) return undefined;

  const nOther = normTeamName(otherTeamName);
  const other = teamOutcomes.find((o) => {
    const n = normTeamName(o.name);
    return o.name === otherTeamName || n === nOther || n.includes(nOther) || nOther.includes(n);
  });
  if (!other) return undefined;
  return teamOutcomes.find((o) => o !== other);
}

function mergeEvents(into: Map<string, OddsApiEvent>, events: OddsApiEvent[]): void {
  for (const event of events) {
    const existing = into.get(event.id);
    if (!existing) {
      into.set(event.id, event);
      continue;
    }
    const seen = new Set(existing.bookmakers.map((b) => b.key));
    for (const bookmaker of event.bookmakers) {
      if (!seen.has(bookmaker.key)) {
        existing.bookmakers.push(bookmaker);
        seen.add(bookmaker.key);
      }
    }
  }
}

async function fetchOddsBatch(sportKey: string, bookmakerKeys: string[]): Promise<OddsApiEvent[]> {
  const url =
    `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}` +
    `&bookmakers=${bookmakerKeys.join(",")}&markets=h2h,spreads,totals&oddsFormat=decimal`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    console.error(`Odds API ${sportKey} [${bookmakerKeys.join(",")}]: ${response.status} ${body}`);
    return [];
  }

  return await response.json();
}

async function fetchOddsForSport(sportKeys: string[], sport: string): Promise<OddsApiEvent[]> {
  if (!ODDS_API_KEY) {
    return [];
  }

  const merged = new Map<string, OddsApiEvent>();

  try {
    for (const sportKey of sportKeys) {
      for (const batch of chunk(BOOKMAKER_KEYS, BOOKMAKER_BATCH_SIZE)) {
        const events = await fetchOddsBatch(sportKey, batch);
        mergeEvents(merged, events);
      }
    }
  } catch (error) {
    console.error(`Error fetching odds for ${sport}:`, error);
    return [];
  }

  return Array.from(merged.values());
}

function gameTimeCutoffIso(): string {
  return new Date(Date.now() - ODDS_GAME_LOOKBACK_MS).toISOString();
}

async function fetchAllOddsRows(supabase: SupabaseClient): Promise<OddsRecord[]> {
  const cutoff = gameTimeCutoffIso();
  const allRows: OddsRecord[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("odds")
      .select("*")
      .gte("game_time", cutoff)
      .in("sportsbook", ALLOWED_SPORTSBOOKS)
      .order("game_time", { ascending: true })
      .range(from, from + SUPABASE_PAGE_SIZE - 1);

    if (error) throw error;

    const batch = (data ?? []) as OddsRecord[];
    allRows.push(...batch);

    if (batch.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return allRows;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const allOddsData: { sport: string; events: OddsApiEvent[] }[] = [];

    for (const [sport, sportKeys] of Object.entries(SPORT_KEYS)) {
      const events = await fetchOddsForSport(sportKeys, sport);
      if (events.length > 0) {
        allOddsData.push({ sport, events });
      }
    }

    const oddsRecords: OddsRecord[] = [];

    for (const { sport, events } of allOddsData) {
      for (const event of events) {
        for (const bookmaker of event.bookmakers) {
          const sportsbookName = BOOKMAKER_MAP[bookmaker.key];
          if (!sportsbookName) continue;

          for (const market of bookmaker.markets) {
            let marketType = "Money Line";
            if (market.key === "spreads") marketType = "Point Spread";
            if (market.key === "totals") marketType = "Totals";

            const homeOutcome = findTeamOutcome(market.outcomes, event.home_team, event.away_team);
            const awayOutcome = findTeamOutcome(market.outcomes, event.away_team, event.home_team);
            const overOutcome = market.outcomes.find((o) => o.name === "Over");
            const underOutcome = market.outcomes.find((o) => o.name === "Under");

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

            if (homeOdds === null && awayOdds === null) continue;

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

    const { error: cleanupError } = await supabase
      .from("odds")
      .delete()
      .not("sportsbook", "in", ALLOWED_SPORTSBOOKS);

    if (cleanupError) {
      console.error("Error cleaning stale sportsbooks:", cleanupError);
    }

    const freshOdds = await fetchAllOddsRows(supabase);

    const gamesMap = new Map<string, {
      id: string;
      sport: string;
      homeTeam: string;
      awayTeam: string;
      gameTime: string;
      odds: Record<string, Record<string, { home: number | null; away: number | null; spread?: number; total?: number }>>;
    }>();

    for (const record of freshOdds) {
      if (!ALLOWED_SPORTSBOOKS.includes(record.sportsbook)) continue;
      if (record.home_odds === null && record.away_odds === null) continue;

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

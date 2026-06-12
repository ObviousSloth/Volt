// get-exercises — authenticated proxy for ExerciseDB (exercisedb.p.rapidapi.com).
//
// Query params: ?bodyPart=chest | ?equipment=barbell | ?name=squat | ?limit=20
// Precedence when several filters are sent: name > bodyPart > equipment.
//
// The RapidAPI key lives ONLY in the EXERCISEDB_API_KEY function secret.
// Live results are normalised to the public.exercises shape and upserted for
// offline caching; if the key is missing or upstream fails, the function falls
// back to serving from the cached table. Responses always use canonical DB rows.
//
// The service-role client is used exclusively for the cache upsert of
// server-fetched ExerciseDB data — user input never reaches the write path
// beyond the validated filter terms. See standup note to Security, 2026-06-13.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RAPIDAPI_HOST = "exercisedb.p.rapidapi.com";

// Filter terms: lowercase letters, digits, spaces, hyphens, apostrophes,
// parentheses — matches ExerciseDB's vocabulary ("upper legs", "smith machine").
const TERM_RE = /^[a-z0-9 '()-]{1,50}$/;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RETURN_COLUMNS =
  "id, name, muscle, body_part, equipment, met_value, gif_url, instructions, secondary_muscles, is_custom, created_at";

type Filter = { kind: "name" | "bodyPart" | "equipment" | "all"; term: string };

function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extra },
  });
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Map an ExerciseDB item onto the exercises table shape. met_value and
// is_custom are deliberately omitted: inserts take the DB defaults and
// cache-refresh updates must not clobber existing values.
function normalise(item: Record<string, unknown>) {
  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;
  const strArray = (v: unknown, max: number) =>
    Array.isArray(v) ? v.slice(0, max).map((s) => String(s).slice(0, 500)) : null;

  const id = str(item.id, 64);
  const name = str(item.name, 120);
  if (!id || !name) return null;

  const muscle = str(item.target, 50);
  const bodyPart = str(item.bodyPart, 50);
  const equipment = str(item.equipment, 50);

  return {
    id,
    name: titleCase(name),
    muscle: muscle ? titleCase(muscle) : null,
    body_part: bodyPart ? titleCase(bodyPart) : null,
    equipment: equipment ? titleCase(equipment) : null,
    gif_url: str(item.gifUrl, 500),
    instructions: strArray(item.instructions, 20),
    secondary_muscles: strArray(item.secondaryMuscles, 10),
  };
}

function upstreamUrl(filter: Filter, limit: number): string {
  const base = `https://${RAPIDAPI_HOST}/exercises`;
  const page = `limit=${limit}&offset=0`;
  switch (filter.kind) {
    case "name":
      return `${base}/name/${encodeURIComponent(filter.term)}?${page}`;
    case "bodyPart":
      return `${base}/bodyPart/${encodeURIComponent(filter.term)}?${page}`;
    case "equipment":
      return `${base}/equipment/${encodeURIComponent(filter.term)}?${page}`;
    case "all":
      return `${base}?${page}`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const params = new URL(req.url).searchParams;

  let filter: Filter = { kind: "all", term: "" };
  for (const kind of ["name", "bodyPart", "equipment"] as const) {
    const raw = params.get(kind);
    if (raw === null) continue;
    const term = raw.trim().toLowerCase();
    if (!TERM_RE.test(term)) {
      return jsonResponse(
        { error: `Invalid ${kind}: 1-50 chars, letters/digits/spaces/-'() only` },
        400,
      );
    }
    filter = { kind, term };
    break; // precedence: name > bodyPart > equipment
  }

  const rawLimit = params.get("limit") ?? "20";
  const limit = Number.parseInt(rawLimit, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return jsonResponse({ error: "Invalid limit: integer 1-50" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const apiKey = Deno.env.get("EXERCISEDB_API_KEY");
  let source = "cache";

  if (apiKey) {
    try {
      const upstream = await fetch(upstreamUrl(filter, limit), {
        headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": RAPIDAPI_HOST },
      });
      if (upstream.ok) {
        const items = (await upstream.json()) as Record<string, unknown>[];
        const rows = items.map(normalise).filter((r) => r !== null);
        if (rows.length > 0) {
          const { data, error } = await supabase
            .from("exercises")
            .upsert(rows, { onConflict: "id" })
            .select(RETURN_COLUMNS);
          if (error) throw error;
          return jsonResponse(data, 200, { "X-Volt-Source": "live" });
        }
        // Valid empty upstream result (e.g. no name matches): fall through to
        // the cache so seed exercises remain searchable.
      } else {
        console.error(`ExerciseDB responded ${upstream.status}`);
      }
    } catch (err) {
      console.error(`ExerciseDB fetch/cache failed: ${(err as Error).message}`);
    }
    source = "cache-fallback";
  }

  let query = supabase.from("exercises").select(RETURN_COLUMNS).limit(limit);
  if (filter.kind === "name") query = query.ilike("name", `%${filter.term}%`);
  if (filter.kind === "bodyPart") query = query.ilike("body_part", `%${filter.term}%`);
  if (filter.kind === "equipment") query = query.ilike("equipment", `%${filter.term}%`);

  const { data, error } = await query;
  if (error) {
    console.error(`Cache query failed: ${error.message}`);
    return jsonResponse({ error: "Exercise lookup failed" }, 500);
  }
  return jsonResponse(data, 200, { "X-Volt-Source": source });
});

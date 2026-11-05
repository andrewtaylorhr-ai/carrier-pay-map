// Strategy Builder download: a PNG map of one recruiter's plan — their
// states zoomed in and colored, a pin for every city their accounts hire
// from, and a side panel listing each state's carriers and accounts. Drawn
// on a canvas in the browser (no extra libraries), so it can sit next to the
// Excel file when the plan is sent to the recruiter. A band at the bottom
// orders the states by time zone into a daily call plan (start east, end west).
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { BASE_PATH } from "@/lib/basePath";
import { CARRIER_ORDER, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import type {
  CarrierId,
  PersistedAssignments,
  PersistedRecruiterAccounts,
  PersistedRecruiterAssignments,
  RecruiterTeam,
} from "@/lib/carriers/types";
import { recruiterPlanAccounts, recruiterStates } from "./exportRecruiterReport";
import { clock, localHourToday, shortZoneName, TEAM_TZ, zoneOfState, type UsZone } from "./timeZones";

type StateFeature = Feature<Geometry, { name: string }>;

// same projection the states-albers-10m topojson was pre-projected with
const PROJECT = geoAlbersUsa().scale(1300).translate([487.5, 305]);
const STATE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6", "#ec4899", "#84cc16", "#f97316", "#6366f1"];

const W = 1800;
const HEADER = 96;
const PANEL_W = 540;
const PAD = 28;
const BG = "#171a21";
const FONT = "Segoe UI, system-ui, -apple-system, sans-serif";
// call window in each state's own local time
const CALL_START = 9;
const CALL_END = 19;
const ET = "America/New_York";

export async function downloadRecruiterMap(
  recruiter: string,
  assignments: PersistedAssignments,
  recruiterAssignments: PersistedRecruiterAssignments,
  recruiterAccounts: PersistedRecruiterAccounts,
  team: RecruiterTeam | null = null
): Promise<void> {
  const states = recruiterStates(recruiter, recruiterAssignments);
  const { accounts, fallback } = recruiterPlanAccounts(recruiter, assignments, recruiterAssignments, recruiterAccounts);
  const stateSet = new Set(states);
  const color = (s: string) => STATE_COLORS[states.indexOf(s) % STATE_COLORS.length];

  const us = (await fetch(`${BASE_PATH}/data/states-albers-10m.json`).then((r) => r.json())) as Topology;
  const objects = us.objects as unknown as Record<string, GeometryCollection>;
  const features = (feature(us, objects.states) as unknown as { features: StateFeature[] }).features;
  const path = geoPath();

  // ---- side panel content (measured first: it sets the picture's height) ----
  const perState = states.map((s) => {
    const here = accounts.filter((a) => a.states.includes(s));
    const carriers = CARRIER_ORDER.filter((id) => (assignments[s] || []).includes(id) || here.some((a) => a.carrier === id));
    const byCarrier = carriers.map((id) => ({ id, n: here.filter((a) => a.carrier === id).length }));
    return { s, n: here.length, byCarrier };
  });
  const panelH = 70 + 340 + perState.reduce((h, p) => h + 58 + Math.max(1, p.byCarrier.length) * 24, 0) + 60;
  const bodyH = Math.max(1100, HEADER + panelH + PAD); // map panels + side panel end here

  // ---- call plan: the recruiter's states grouped by time zone, east to west ----
  const now = new Date();
  // zones on the same clock today share a row (Arizona = Mountain in winter, Pacific in summer)
  const zoneRows: { z: UsZone; states: string[]; start: number; end: number }[] = [];
  states.forEach((s) => {
    const z = zoneOfState(STATE_CODE[s]);
    if (!z) return;
    const start = localHourToday(z.tz, CALL_START, now);
    const row = zoneRows.find((r) => r.start === start);
    if (!row) zoneRows.push({ z, states: [STATE_CODE[s]], start, end: localHourToday(z.tz, CALL_END, now) });
    else {
      row.states.push(STATE_CODE[s]);
      if (row.z.key === "AZ") row.z = z; // name the row after the regular zone
    }
  });
  zoneRows.sort((a, b) => a.start - b.start);
  const PLAN_H = zoneRows.length ? 196 + zoneRows.length * 46 : 0;
  const H = bodyH + PLAN_H;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ---- header ----
  ctx.fillStyle = "#f2f3f5";
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(`${recruiter} — recruiting plan`, PAD, 52);
  ctx.fillStyle = "#9aa0ad";
  ctx.font = `400 18px ${FONT}`;
  ctx.fillText(
    `${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} · ${states.length} state${states.length === 1 ? "" : "s"} · ${accounts.length} account${accounts.length === 1 ? "" : "s"}${fallback ? " (all open accounts — none ticked)" : ""}`,
    PAD,
    80
  );

  // ---- map: one zoomed-in panel per state (states can be far apart) ----
  const mapX = PAD;
  const mapY = HEADER;
  const mapW = W - PANEL_W - PAD * 3;
  const mapH = bodyH - HEADER - PAD - 30; // room for the legend line under the panels
  const GAP = 16;
  const n = Math.max(1, states.length);
  const cols = n === 1 ? 1 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const cellW = (mapW - GAP * (cols - 1)) / cols;
  const cellH = (mapH - GAP * (rows - 1)) / rows;
  const draw = geoPath(null, ctx);

  // every city the plan's accounts hire from, per state code
  const cities = new Map<string, { name: string; st: string; lon: number; lat: number; n: number }>();
  accounts.forEach((a) =>
    a.cities.forEach((c) => {
      const key = `${c.name}|${c.st}`;
      const cur = cities.get(key) ?? { name: c.name, st: c.st, lon: c.lon, lat: c.lat, n: 0 };
      cur.n++;
      cities.set(key, cur);
    })
  );

  states.forEach((st, i) => {
    const f = features.find((x) => x.properties.name === st);
    const cx = mapX + (i % cols) * (cellW + GAP);
    const cy = mapY + Math.floor(i / cols) * (cellH + GAP);
    ctx.fillStyle = "#1f232d";
    roundRect(ctx, cx, cy, cellW, cellH, 14);
    ctx.fill();

    // panel header: color swatch, state, accounts
    const info = perState.find((p) => p.s === st)!;
    ctx.fillStyle = color(st);
    roundRect(ctx, cx + 18, cy + 18, 18, 18, 4);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = "#f2f3f5";
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText(st, cx + 46, cy + 35);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f5c451";
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(`${info.n} account${info.n === 1 ? "" : "s"}`, cx + cellW - 18, cy + 34);
    if (!f) return;

    const bx = cx + 8;
    const by = cy + 50;
    const bw = cellW - 16;
    const bh = cellH - 58;
    let [[x0, y0], [x1, y1]] = path.bounds(f);
    const pad = Math.max(8, Math.max(x1 - x0, y1 - y0) * 0.12);
    x0 -= pad;
    x1 += pad;
    y0 -= pad;
    y1 += pad;
    const k = Math.min(bw / (x1 - x0), bh / (y1 - y0), 30);
    const tx = bx + (bw - (x1 - x0) * k) / 2 - x0 * k;
    const ty = by + (bh - (y1 - y0) * k) / 2 - y0 * k;
    const toScreen = ([x, y]: [number, number]): [number, number] => [x * k + tx, y * k + ty];

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    ctx.setTransform(k, 0, 0, k, tx, ty);
    features.forEach((g) => {
      ctx.beginPath();
      draw(g);
      ctx.fillStyle = g === f ? color(st) + "b3" : "#2c313d";
      ctx.fill();
      ctx.lineWidth = 1.2 / k;
      ctx.strokeStyle = "#0d0f14";
      ctx.stroke();
    });
    ctx.beginPath();
    draw(f);
    ctx.lineWidth = 3 / k;
    ctx.strokeStyle = "#f5c451";
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // neighbor state codes, faint
    ctx.font = `600 14px ${FONT}`;
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    features
      .filter((g) => g !== f && g.properties.name !== "Alaska" && g.properties.name !== "Hawaii") // insets sit off the coast
      .forEach((g) => {
        const [x, y] = toScreen(path.centroid(g) as [number, number]);
        if (x > bx + 16 && x < bx + bw - 16 && y > by + 16 && y < by + bh - 8) ctx.fillText(STATE_CODE[g.properties.name] || "", x, y);
      });

    // city pins, biggest first; labels placed after all pins so they avoid them
    const taken: [number, number, number, number][] = [];
    const free = (b: [number, number, number, number]) =>
      !taken.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
    const pins = [...cities.values()]
      .filter((c) => c.st === STATE_CODE[st])
      .map((c) => ({ ...c, xy: PROJECT([c.lon, c.lat]) }))
      .filter((c): c is typeof c & { xy: [number, number] } => !!c.xy)
      .sort((a, b) => b.n - a.n);
    pins.forEach((c) => {
      const [x, y] = toScreen(c.xy);
      const r = c.n > 9 ? 14 : 12;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f5c451";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#241800";
      ctx.stroke();
      ctx.fillStyle = "#241800";
      ctx.font = `800 13px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(String(c.n), x, y + 4.5);
      taken.push([x - r, y - r, x + r, y + r]);
    });
    ctx.font = `700 15px ${FONT}`;
    pins.forEach((c) => {
      const [x, y] = toScreen(c.xy);
      const w = ctx.measureText(c.name).width;
      const spots: [number, number, CanvasTextAlign][] = [
        [x + 17, y + 5, "left"],
        [x - 17, y + 5, "right"],
        [x, y - 18, "center"],
        [x, y + 30, "center"],
      ];
      for (const [lx, ly, align] of spots) {
        const left = align === "left" ? lx : align === "right" ? lx - w : lx - w / 2;
        const box: [number, number, number, number] = [left - 2, ly - 14, left + w + 2, ly + 4];
        if (box[0] < bx || box[2] > bx + bw || box[1] < by || box[3] > by + bh || !free(box)) continue;
        ctx.textAlign = align;
        outlined(ctx, c.name, lx, ly, "#ffffff");
        taken.push(box);
        break;
      }
    });
    if (!pins.length) {
      ctx.textAlign = "center";
      ctx.font = `500 15px ${FONT}`;
      outlined(ctx, "no city listed for these accounts", bx + bw / 2, by + bh - 14, "#c8ccd4");
    }
    ctx.restore();
  });

  // legend under the panels
  const ly = bodyH - PAD - 10;
  ctx.textAlign = "left";
  ctx.beginPath();
  ctx.arc(mapX + 10, ly - 5, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#f5c451";
  ctx.fill();
  ctx.fillStyle = "#c8ccd4";
  ctx.font = `500 15px ${FONT}`;
  ctx.fillText("City with accounts · number = how many of the plan's accounts hire from that city", mapX + 26, ly);

  // ---- side panel ----
  const px = W - PANEL_W - PAD;
  ctx.fillStyle = "#1f232d";
  roundRect(ctx, px, HEADER, PANEL_W, bodyH - HEADER - PAD, 14);
  ctx.fill();
  // overview: the whole US with the recruiter's states colored
  const ow = PANEL_W - 48;
  const ok = ow / 975;
  const oh = 610 * ok;
  ctx.save();
  ctx.setTransform(ok, 0, 0, ok, px + 24, HEADER + 24);
  features.forEach((g) => {
    ctx.beginPath();
    draw(g);
    ctx.fillStyle = stateSet.has(g.properties.name) ? color(g.properties.name) : "#2c313d";
    ctx.fill();
    ctx.lineWidth = 1 / ok;
    ctx.strokeStyle = "#0d0f14";
    ctx.stroke();
  });
  ctx.restore();
  let y = HEADER + 24 + oh + 44;
  ctx.textAlign = "left";
  ctx.fillStyle = "#f2f3f5";
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText("States & carriers", px + 24, y);
  y += 26;
  perState.forEach((p) => {
    y += 30;
    ctx.fillStyle = color(p.s);
    roundRect(ctx, px + 24, y - 16, 18, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#f2f3f5";
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(p.s, px + 52, y);
    ctx.fillStyle = "#f5c451";
    ctx.font = `600 15px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(`${p.n} account${p.n === 1 ? "" : "s"}`, px + PANEL_W - 24, y);
    ctx.textAlign = "left";
    y += 6;
    if (!p.byCarrier.length) {
      y += 24;
      ctx.fillStyle = "#6b7280";
      ctx.font = `400 15px ${FONT}`;
      ctx.fillText("no carriers yet", px + 52, y);
    }
    p.byCarrier.forEach(({ id, n }: { id: CarrierId; n: number }) => {
      y += 24;
      ctx.fillStyle = CARRIERS[id].color;
      ctx.beginPath();
      ctx.arc(px + 58, y - 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `600 16px ${FONT}`;
      ctx.fillText(CARRIERS[id].label, px + 72, y);
      ctx.fillStyle = "#9aa0ad";
      ctx.font = `400 15px ${FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(n ? `${n} account${n === 1 ? "" : "s"}` : "—", px + PANEL_W - 24, y);
      ctx.textAlign = "left";
    });
    y += 22;
    ctx.strokeStyle = "#2f3542";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 24, y);
    ctx.lineTo(px + PANEL_W - 24, y);
    ctx.stroke();
  });
  ctx.fillStyle = "#6b7280";
  ctx.font = `400 13px ${FONT}`;
  ctx.fillText(`Class A Recruiting · ${new Date().toLocaleDateString("en-US")} · full account list in the Excel file`, px + 24, bodyH - PAD - 20);

  if (zoneRows.length) drawCallPlan(ctx, bodyH, zoneRows, team);

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${recruiter.replace(/[^a-z0-9]+/gi, "_")}_strategy_map.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type ZoneRow = { z: UsZone; states: string[]; start: number; end: number };

// Bottom band: the order to call the zones in, and a timeline of when each
// zone is in its call window, in the recruiter's own time when their team is
// known (the clock they work by), else in US Eastern time.
function drawCallPlan(ctx: CanvasRenderingContext2D, top: number, rows: ZoneRow[], team: RecruiterTeam | null) {
  const home = team ? TEAM_TZ[team] : null;
  const refTz = home?.tz ?? ET;
  const refName = home ? `${home.city} time` : shortZoneName(ET);
  const x = PAD;
  const w = W - PAD * 2;
  const h = 196 + rows.length * 46 - PAD;
  ctx.fillStyle = "#1f232d";
  roundRect(ctx, x, top, w, h, 14);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = "#f2f3f5";
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText("Daily call plan — start in the East, finish in the West", x + 24, top + 40);
  ctx.fillStyle = "#9aa0ad";
  ctx.font = `400 16px ${FONT}`;
  const fmt = (hour: number) => (hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`);
  ctx.fillText(
    `Call each state ${fmt(CALL_START)} – ${fmt(CALL_END)} in its own local time. Times on the right are ${refName}${home ? " (and US Eastern)" : ""}, for today.`,
    x + 24,
    top + 66
  );

  // order line: 1. Eastern: NY, NJ → 2. Central: MO → …
  let ox = x + 24;
  const oy = top + 104;
  ctx.font = `700 18px ${FONT}`;
  rows.forEach((r, i) => {
    const text = `${i + 1}. ${r.z.label.split(" (")[0]}: ${r.states.join(", ")}`;
    ctx.fillStyle = r.z.color;
    ctx.fillText(text, ox, oy);
    ox += ctx.measureText(text).width + 14;
    if (i < rows.length - 1) {
      ctx.fillStyle = "#9aa0ad";
      ctx.fillText("→", ox, oy);
      ox += ctx.measureText("→").width + 14;
    }
  });

  // timeline: hour ticks from the first start to the last end
  const t0 = Math.min(...rows.map((r) => r.start));
  const t1 = Math.max(...rows.map((r) => r.end));
  const labelW = 360;
  const textW = 330;
  const bx = x + 24 + labelW;
  const bw = w - 48 - labelW - textW;
  const X = (t: number) => bx + ((t - t0) / (t1 - t0)) * bw;
  const axisY = top + 140;
  ctx.font = `500 13px ${FONT}`;
  ctx.textAlign = "center";
  for (let t = t0; t <= t1; t += 3600000) {
    ctx.fillStyle = "#6b7280";
    ctx.fillText(clock(t, refTz), X(t), axisY);
    ctx.strokeStyle = "#2f3542";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(t), axisY + 8);
    ctx.lineTo(X(t), axisY + 14 + rows.length * 46);
    ctx.stroke();
  }

  rows.forEach((r, i) => {
    const y = axisY + 22 + i * 46;
    ctx.textAlign = "left";
    ctx.fillStyle = r.z.color;
    ctx.font = `700 17px ${FONT}`;
    ctx.fillText(`${i + 1}. ${r.z.label}`, x + 24, y + 19);
    ctx.fillStyle = "#c8ccd4";
    ctx.font = `500 14px ${FONT}`;
    ctx.fillText(r.states.join(", "), x + 24, y + 37);
    ctx.fillStyle = r.z.color;
    roundRect(ctx, X(r.start), y + 6, X(r.end) - X(r.start), 26, 6);
    ctx.fill();
    ctx.fillStyle = "#11131a";
    ctx.font = `700 14px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(`${clock(r.start, r.z.tz)} – ${clock(r.end, r.z.tz)} local`, (X(r.start) + X(r.end)) / 2, y + 24);
    ctx.textAlign = "left";
    ctx.fillStyle = "#f2f3f5";
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText(`${clock(r.start, refTz)} – ${clock(r.end, refTz)} ${home ? home.city : shortZoneName(ET)}`, x + w - textW, y + 19);
    if (home) {
      ctx.fillStyle = "#9aa0ad";
      ctx.font = `400 13px ${FONT}`;
      ctx.fillText(`${clock(r.start, ET)} – ${clock(r.end, ET)} ${shortZoneName(ET)}`, x + w - textW, y + 37);
    }
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function outlined(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string) {
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#11131a";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

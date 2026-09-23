// Ported from renderStateLabels()/stateLabelText()/estimateLabelBox()/rectsOverlap()
// in the original HTML. Only used in Strategy + "color by recruiter" mode, to
// stamp small recruiter-name labels on assigned states without overlapping.
import { select } from "d3-selection";
import type { Selection } from "d3-selection";
import type { GeoPath } from "d3-geo";
import type { Feature, Geometry } from "geojson";

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function rectsOverlap(a: Box, b: Box): boolean {
  const pad = 2;
  return !(a.x2 + pad < b.x1 || b.x2 + pad < a.x1 || a.y2 + pad < b.y1 || b.y2 + pad < a.y1);
}

function estimateLabelBox(cx: number, cy: number, label: string): Box {
  const w = Math.max(18, label.length * 5.5 + 12);
  const h = 15;
  return { x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2 };
}

export function renderStateLabels(
  labelG: Selection<SVGGElement, unknown, null, undefined>,
  features: Feature<Geometry, { name: string }>[],
  path: GeoPath,
  recruiterAssignments: Record<string, string[]>,
  recruiterFilter: string,
  getLabel: (stateName: string) => string
): void {
  const nodes = features.filter((d) => {
    const arr = recruiterAssignments[d.properties.name] || [];
    if (!arr.length) return false;
    if (recruiterFilter) return arr.includes(recruiterFilter);
    return true;
  });
  // Bigger states get first pick of label space, so small crowded states
  // (New England etc.) are the ones that drop their label when there isn't
  // room — not the other way around.
  nodes.sort((a, b) => (path.area(b) ?? 0) - (path.area(a) ?? 0));

  const placed: Box[] = [];
  const toRender: { key: string; c: [number, number]; label: string }[] = [];
  nodes.forEach((d) => {
    const c = path.centroid(d) as [number, number];
    const label = getLabel(d.properties.name);
    const box = estimateLabelBox(c[0], c[1], label);
    if (placed.some((p) => rectsOverlap(p, box))) return; // would collide — skip, fill color + tooltip still show it
    placed.push(box);
    toRender.push({ key: d.properties.name, c, label });
  });

  const groups = labelG
    .selectAll<SVGGElement, (typeof toRender)[number]>("g.stateLabelG")
    .data(toRender, (x) => x.key)
    .join("g")
    .attr("class", "stateLabelG")
    .attr("transform", (x) => `translate(${x.c[0]},${x.c[1]})`);

  groups.selectAll("*").remove();
  groups.each(function (x) {
    const thisSel = select(this);
    const text = thisSel
      .append("text")
      .attr("class", "stateLabelText")
      .attr("text-anchor", "middle")
      .attr("dy", "0.32em")
      .text(x.label);
    let bbox: { x: number; y: number; width: number; height: number };
    try {
      bbox = (text.node() as SVGTextElement).getBBox();
    } catch {
      const w = x.label.length * 5.4;
      bbox = { x: -w / 2, y: -5, width: w, height: 10 };
    }
    thisSel
      .insert("rect", "text")
      .attr("class", "stateLabelBg")
      .attr("x", bbox.x - 4)
      .attr("y", bbox.y - 2)
      .attr("width", bbox.width + 8)
      .attr("height", bbox.height + 4)
      .attr("rx", 6);
  });
}

// Best-effort recruiter-name extraction from free-text "Status of
// application" notes. There's no dedicated recruiter column in the source
// workbooks — sometimes a name shows up as the trailing "- Name" segment
// (e.g. "DQ due to a rollover - 9/22 - Mike B"), but plenty of notes have no
// name at all, or end in a status word instead ("... - HIRED").
//
// Deliberately conservative per product decision: return undefined rather
// than guess wrong. Known limitation: an initials-only name with no
// lowercase letters (e.g. a bare "B") will be rejected by the all-caps
// check below along with real status words — acceptable tradeoff, the
// alternative (looser matching) produces more false positives than the
// current false negatives are worth.

const MAX_NAME_WORDS = 3;
const NAME_WORD_RE = /^[A-Z][a-zA-Z'.]*$/;

export function extractRecruiter(note: string): string | undefined {
  if (!note) return undefined;

  // Only attempt extraction when the note has a "... - ... - candidate"
  // structure; a bare sentence with no dash-separated trailer isn't in the
  // "date - name" shape these notes use when a name is present.
  const segments = note
    .split(/\s+[-–]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length < 2) return undefined;

  const candidate = segments[segments.length - 1];
  if (!candidate) return undefined;

  // Dates, ticket numbers, etc. — never part of a name.
  if (/\d/.test(candidate)) return undefined;

  const words = candidate.split(/\s+/);
  if (words.length === 0 || words.length > MAX_NAME_WORDS) return undefined;

  // Status words like "HIRED" / "DISPATCHED" are fully uppercase; real names
  // in this data show up mixed-case ("Mike B"), so reject all-caps segments.
  if (candidate === candidate.toUpperCase()) return undefined;

  if (!words.every((w) => NAME_WORD_RE.test(w))) return undefined;

  return candidate;
}

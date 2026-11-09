// The Class A Recruiting Academy (our Notion course). Each lesson links to its
// Notion page, so the content always stays current there; the manager ticks
// off lessons per trainee on the Training page. If a lesson is added in
// Notion, add it here too (id = the 32-character id at the end of its URL).
import type { Trainee } from "@/lib/trainees";

export const ACADEMY_URL = "https://boulder-throne-ca5.notion.site/Class-A-Recruiting-Academy-ac0be53c5c8b829e8d9201acc3f460e7";
export const lessonUrl = (id: string) => `https://boulder-throne-ca5.notion.site/${id}`;

export const QC_GOOD_CALLS = 3; // good calls needed before approval

export type Lesson = { id: string; title: string };
export type AcademySection = { title: string; lessons: Lesson[]; extra?: boolean };

const L = (title: string, id: string): Lesson => ({ title, id });

export const ACADEMY: AcademySection[] = [
  {
    title: "Introduction",
    lessons: [
      L("Who are we?", "e88be53c5c8b834b9e030182c3c254c3"),
      L("Why work with us?", "163be53c5c8b8210973701232482a6ee"),
      L("Driver Recruitment Process", "c63be53c5c8b830fa681019b17a665c8"),
    ],
  },
  {
    title: "1) Moral Preparation",
    lessons: [
      L("Respect Your Job", "924be53c5c8b838b91be811d558b95b4"),
      L("Discipline, Stress and Motivation", "3adbe53c5c8b828a89ae0163e41ff3cd"),
      L("Be Prepared to Start Your Shift", "db9be53c5c8b83c397a60149e3b8c7a0"),
    ],
  },
  {
    title: "2) General Fundamentals",
    lessons: [
      L("Who is a truck driver recruiter? Why companies need us?", "88dbe53c5c8b82549631011763a58745"),
      L("General Understanding of Logistics, Trucks, Drivers and How Recruiting Works", "6e3be53c5c8b83a5a33b01cf7deb7d9b"),
      L("New Recruiter Training", "239be53c5c8b8360bc678145d815ff19"),
      L("A Day in the Life of a Trucking Driver Recruiter", "f4bbe53c5c8b82f684af0104aa978bf3"),
      L("Work Time Management", "7fcbe53c5c8b82798d9b81a2665a573e"),
      L("Class A tools", "169be53c5c8b82caa4f501815b262504"),
    ],
  },
  {
    title: "3) Carrier and Offers",
    lessons: [
      L("How to master the art of recruiting?", "d51be53c5c8b83558973010e935c881f"),
      L("Understanding Company Information", "17cbe53c5c8b82cc91b481ff4120a928"),
      L("What drivers want to hear from the recruiter?", "7f5be53c5c8b8250b46c01d2038d3a98"),
      L("Swift", "548be53c5c8b8227b57301de8b66ae97"),
      L("US Xpress (Local, Regional, OTR)", "94dbe53c5c8b833e8b7301fe54a29687"),
      L("PAM Transportation", "535be53c5c8b8376a61701ce67e36a90"),
      L("Trans AM", "559be53c5c8b8232845c81d05e504c9c"),
      L("Family Dollar Training Video", "fc7be53c5c8b83999e9e814b7cc1d2ef"),
    ],
  },
  {
    title: "4) Job Posting and Working with Leads",
    lessons: [
      L("Job Post Rules (Indeed 101)", "958be53c5c8b83debb9981a3f77df822"),
      L("Lead Management", "e72be53c5c8b832ea7c301f4c1810005"),
      L("Cold Calling, Warm Calling", "87bbe53c5c8b82acba9a0153b20d35d2"),
      L("Interview, Texting, Emailing", "303be53c5c8b8208b2ee014fa8cb4fec"),
      L("Indeed Leads", "3fabe53c5c8b823aaec481c96ed37c63"),
    ],
  },
  {
    title: "5) Fundamentals of Safety of Trucking Industry",
    lessons: [
      L("SAP program", "397be53c5c8b8213bb27012dd92a683b"),
      L("Drug Testing", "062be53c5c8b821e84900176215a1939"),
      L("Clearinghouse", "f15be53c5c8b8330a11701c58be0c2d1"),
      L("Violations Types", "a78be53c5c8b83279d3501d3964e63c5"),
    ],
  },
  {
    title: "6) Pre-qualification",
    lessons: [
      L("Recruiting Process Outline", "4a8be53c5c8b838fa194814fe03ead51"),
      L("Pre-Qualifying Checklist", "86cbe53c5c8b820486b901f1b83ad806"),
      L("7 Questions to ask a driver while on a call", "b5dbe53c5c8b836fa02281dec5f0ec72"),
      L('What is "verifiable" experience', "195be53c5c8b82d3ba4d81f4734fce4c"),
      L("Criminal History, Court and etc", "fecbe53c5c8b83f19c9e0106decfc350"),
      L("Work History and Unemployment Gaps", "0a9be53c5c8b828eb48481b582b2649d"),
    ],
  },
  {
    title: "7) Interview and HR Skills",
    lessons: [
      L("Incoming/outbound calls", "8edbe53c5c8b82e8ae7d81b023a68ae6"),
      L("Call Script", "fbabe53c5c8b828d9e4501aee1577a34"),
      L("How to speak to the driver?", "9efbe53c5c8b8209ba75818b7d8a7a28"),
      L("Building Rapport and Prequalifying like a BOSS!", "98ebe53c5c8b8247988d81af4268de95"),
      L("Proper Presentation", "842be53c5c8b8248b5af01f7d1f0a028"),
      L("Hear Other Recruiters Make Calls to Drivers", "89fbe53c5c8b82788fa581605e27019f"),
      L("Speed To Hire - Training Call", "979be53c5c8b8223b1bf01737e540b86"),
    ],
  },
  {
    title: "8) Job Offer",
    lessons: [
      L("Pay, Key Selling Points", "47abe53c5c8b822b8c5601456ec32f4a"),
      L("Presenting Driving Jobs Properly", "2b1be53c5c8b8221b54d01aa72668552"),
      L("Practical Miles & How To Explain It To A Driver", "afbbe53c5c8b82479950010fb12d334c"),
      L("Rider Policy for Truck Drivers", "1cdbe53c5c8b8266962281716ddb0dd7"),
      L("Speaking Rules", "eaabe53c5c8b8372b2b281ec8ac3a0b4"),
      L("W2 Call Recordings", "9debe53c5c8b83f2a391812233a4eacd"),
      L("Convincing / Consulting", "3d0be53c5c8b820493fa811703f866ac"),
    ],
  },
  {
    title: "9) Application",
    lessons: [
      L("How to fill out a Tenstreet Link?", "ecfbe53c5c8b83b2857281f988ef23f0"),
      L("What is Tenstreet?", "8adbe53c5c8b82e589d6816e4bc846ef"),
      L("How to ask for a Social Security Number?", "8babe53c5c8b83cba94301e6cb6be76b"),
    ],
  },
  {
    title: "10) Documents",
    lessons: [
      L("Accidents, Accident Report and Lost Runs", "888be53c5c8b8209b78c81b795e2131d"),
      L("What are W2 and 1099 Contracts", "6f3be53c5c8b8231a27701bcad70ec4c"),
      L("The Market for W2 Drivers", "33cbe53c5c8b839ea2d78152cf6cf914"),
      L("1099 and W2 Tax", "e4bbe53c5c8b82abbb2d017347e07419"),
      L("Trucking Glossary of Terms", "03cbe53c5c8b828690ff810f52f154a9"),
      L("Summary", "694be53c5c8b83f280e581818780d636"),
    ],
  },
  {
    title: "11) Follow up! Follow up! Follow up!",
    lessons: [
      L("Follow Up calls", "57bbe53c5c8b825b9c62014e9e62cf25"),
      L("Proper Follow Up (by Adrian)", "cdbbe53c5c8b83e290de813feecc8356"),
      L("Proper Follow Up (by Daniel)", "bbdbe53c5c8b83bab2a6019696fa94fc"),
    ],
  },
  {
    title: "Extra reading",
    extra: true,
    lessons: [
      L("Logistics Course", "f1abe53c5c8b839aa78c01d00ee43df9"),
      L("Owner Operator Reading", "0e3be53c5c8b8321a90c8153ae7821f1"),
      L("Interviewing the Drivers: Introduction", "d2abe53c5c8b83ab988a817fe86ba01c"),
    ],
  },
];

// Extra reading is optional, so it doesn't count toward progress.
const REQUIRED = ACADEMY.filter((s) => !s.extra).flatMap((s) => s.lessons.map((l) => l.id));
export const REQUIRED_LESSONS = REQUIRED.length;

export function programProgress(t: Trainee) {
  const done = new Set(t.checklist ?? []);
  const n = REQUIRED.filter((id) => done.has(id)).length;
  const sections = ACADEMY.filter((s) => !s.extra && s.lessons.every((l) => done.has(l.id))).length;
  return { done: n, total: REQUIRED.length, pct: Math.round((n / REQUIRED.length) * 100), sections, sectionTotal: ACADEMY.filter((s) => !s.extra).length };
}

export const goodCalls = (t: Trainee) => (t.calls ?? []).filter((c) => c.good).length;

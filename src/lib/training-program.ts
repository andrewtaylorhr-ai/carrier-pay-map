// The Class A Recruiting Academy (our Notion course). Each lesson links to its
// Notion page, so the content always stays current there; the manager ticks
// off lessons per trainee on the Training page. If a lesson is added in
// Notion, add it here too (id = the 32-character id at the end of its URL).
import type { Trainee } from "@/lib/trainees";

export const ACADEMY_URL = "https://boulder-throne-ca5.notion.site/Class-A-Recruiting-Academy-Office-022be53c5c8b8294836681da8dd8c9c0";
export const lessonUrl = (id: string) => `https://boulder-throne-ca5.notion.site/${id}`;

export const QC_GOOD_CALLS = 3; // good calls needed before approval

export type Lesson = { id: string; title: string };
export type AcademySection = { title: string; lessons: Lesson[]; extra?: boolean };

const L = (title: string, id: string): Lesson => ({ title, id });

export const ACADEMY: AcademySection[] = [
  {
    title: "Introduction",
    lessons: [
      L("Who are we?", "e1bbe53c5c8b8218b34b013b19f04328"),
      L("Why work with us?", "b96be53c5c8b82d5a84a81070461a617"),
      L("Driver Recruitment Process", "178be53c5c8b83c1ac85011e6dccae21"),
    ],
  },
  {
    title: "1) Moral Preparation",
    lessons: [
      L("Respect Your Job", "026be53c5c8b8246906f010d55a80bf6"),
      L("Discipline, Stress and Motivation", "8a5be53c5c8b82539f9f0170e1a1a0f6"),
      L("Expectation vs Reality", "8d9be53c5c8b822cbb340180290361e1"),
    ],
  },
  {
    title: "2) General Fundamentals",
    lessons: [
      L("Who is a truck driver recruiter? Why companies need us?", "07fbe53c5c8b83ffb22701aeb76f68e6"),
      L("General Understanding of Logistics, Trucks, Drivers and How Recruiting Works", "f4abe53c5c8b83e2b28e81f93edc38af"),
      L("New Recruiter Training", "19dbe53c5c8b839f97ab810defbd1636"),
      L("Class A tools", "a5dbe53c5c8b83d9a4b9819581cd6582"),
    ],
  },
  {
    title: "3) Pre-qualification",
    lessons: [
      L("Recruiting Process Outline", "641be53c5c8b82259a1201c0fcd9f35d"),
      L("Pre-Qualifying Checklist", "ddbbe53c5c8b82a2b26981e6afbb21ce"),
      L("7 Questions to ask a driver while on a call", "fb9be53c5c8b83bf9a078103277b9e6c"),
      L('What is "verifiable" experience', "c27be53c5c8b83f0871c0125a246eeee"),
      L("Criminal History, Court and etc", "6b8be53c5c8b8315b86901a25b405e9b"),
      L("Work History and Unemployment Gaps", "501be53c5c8b825aa9fb01d794551717"),
    ],
  },
  {
    title: "4) Job Offer",
    lessons: [
      L("Pay, Key Selling Points", "630be53c5c8b8312a9b70128a075e238"),
      L("Presenting Driving Jobs Properly", "2c2be53c5c8b82a7a69501a8e18bb118"),
      L("Practical Miles & How To Explain It To A Driver", "909be53c5c8b8338ba068185eea94184"),
      L("Rider Policy for Truck Drivers", "562be53c5c8b837eaec881eafb76cd54"),
      L("Speaking Rules", "03fbe53c5c8b82fa8714813e97877dd8"),
      L("W2 Call Recordings", "7a3be53c5c8b82f69fa0017bbe114b8a"),
      L("Convincing / Consulting", "619be53c5c8b8336b37d01709e463910"),
    ],
  },
  {
    title: "5) Interview and HR Skills",
    lessons: [
      L("Incoming/outbound calls", "0e1be53c5c8b83ac9ead8130f225977a"),
      L("How to speak to the driver?", "c54be53c5c8b83eb9538819505aef0b9"),
      L("Building Rapport and Prequalifying like a BOSS!", "4a4be53c5c8b82b086f581c20475ae7a"),
      L("Proper Presentation", "efbbe53c5c8b820fb1ea812991ddd0b3"),
      L("Hear Other Recruiters Make Calls to Drivers", "b12be53c5c8b821785578178157aace5"),
      L("Speed To Hire - Training Call. Take notes all the time!", "c27be53c5c8b824dbbe401fde2dc0df9"),
      L("Call Script", "4c3be53c5c8b8313b293818cde995d11"),
    ],
  },
  {
    title: "6) Fundamentals of Safety of Trucking Industry",
    lessons: [
      L("SAP program", "78bbe53c5c8b8362a4f081625562b4a1"),
      L("Drug Testing", "a25be53c5c8b82b38e0281376231a1ab"),
      L("Clearinghouse", "20cbe53c5c8b83dc9b8901541540de58"),
      L("Violations Types", "39fbe53c5c8b82578aa781784e3f179f"),
    ],
  },
  {
    title: "7) Application",
    lessons: [
      L("How to fill out a Tenstreet Link?", "0f3be53c5c8b828bbfe101f2e6feb28b"),
      L("What is Tenstreet?", "3d3be53c5c8b8217a2600178fa98262f"),
      L("How to ask for a Social Security Number?", "3dbbe53c5c8b83dda5d4818cb0e45763"),
    ],
  },
  {
    title: "8) Documents",
    lessons: [
      L("Accidents, Accident Report and Lost Runs", "d54be53c5c8b83979c2901b8a308db88"),
      L("What are W2 and 1099 Contracts", "efabe53c5c8b820183908101fc658ead"),
      L("The Market for W2 Drivers", "cf8be53c5c8b82ac97a881589d6f3980"),
      L("1099 and W2 Tax", "6dfbe53c5c8b83ea83a701f6cba84ea1"),
      L("Trucking Glossary of Terms", "c87be53c5c8b83df9e4f01f772afba95"),
      L("Summary", "255be53c5c8b83a093c701a633999103"),
    ],
  },
  {
    title: "9) Follow up! Follow up! Follow up!",
    lessons: [
      L("Follow Up calls", "b0ebe53c5c8b822db85d01858f4fe7cd"),
      L("Proper Follow Up (by Adrian)", "72abe53c5c8b8290ae5381d491110f83"),
      L("Proper Follow Up (by Daniel)", "dbebe53c5c8b8324a03a013f70371203"),
    ],
  },
  {
    title: "10) Job Posting and Working with Leads",
    lessons: [
      L("Job Post Rules (Indeed 101)", "5bbbe53c5c8b82009f38811b6e339bce"),
      L("Cold Calling, Warm Calling", "94cbe53c5c8b83259dfe81fe622a8aaf"),
      L("Interview, Texting, Emailing", "ea7be53c5c8b822e9b2b0120bf6d41c9"),
      L("Indeed Leads", "f3ebe53c5c8b83db9b2b81cbf8166d0c"),
    ],
  },
  {
    title: "11) Carrier and Offers",
    lessons: [
      L("How to master the art of recruiting?", "559be53c5c8b832fa9298117b963f274"),
      L("Understanding Company Information", "efbbe53c5c8b8219bd9e81db1eeb211a"),
      L("What drivers want to hear from the recruiter?", "d74be53c5c8b83ac83e681e6ab2d6e12"),
      L("Swift: No CDL / CDL with 0 experience / 6 months in the last year or 12 months in the last 5 years", "127be53c5c8b83f8995f81bb37d5804a"),
      L("US Xpress (Local, Regional, OTR) (3 months)", "885be53c5c8b822c942001dbf9b39e50"),
      L("PAM Transportation (3 months in the past year)", "b35be53c5c8b83bba14281689bbfbf81"),
      L("Family Dollar Training Video", "e95be53c5c8b826c884e016eb4249469"),
    ],
  },
];

// Lesson ids from the first Academy page, so lessons a trainee ticked
// there stay ticked (see migrateChecklist).
const OLD_LESSON_IDS: Record<string, string> = {
  "e88be53c5c8b834b9e030182c3c254c3": "e1bbe53c5c8b8218b34b013b19f04328",
  "163be53c5c8b8210973701232482a6ee": "b96be53c5c8b82d5a84a81070461a617",
  "c63be53c5c8b830fa681019b17a665c8": "178be53c5c8b83c1ac85011e6dccae21",
  "924be53c5c8b838b91be811d558b95b4": "026be53c5c8b8246906f010d55a80bf6",
  "3adbe53c5c8b828a89ae0163e41ff3cd": "8a5be53c5c8b82539f9f0170e1a1a0f6",
  "88dbe53c5c8b82549631011763a58745": "07fbe53c5c8b83ffb22701aeb76f68e6",
  "6e3be53c5c8b83a5a33b01cf7deb7d9b": "f4abe53c5c8b83e2b28e81f93edc38af",
  "239be53c5c8b8360bc678145d815ff19": "19dbe53c5c8b839f97ab810defbd1636",
  "169be53c5c8b82caa4f501815b262504": "a5dbe53c5c8b83d9a4b9819581cd6582",
  "d51be53c5c8b83558973010e935c881f": "559be53c5c8b832fa9298117b963f274",
  "17cbe53c5c8b82cc91b481ff4120a928": "efbbe53c5c8b8219bd9e81db1eeb211a",
  "7f5be53c5c8b8250b46c01d2038d3a98": "d74be53c5c8b83ac83e681e6ab2d6e12",
  "548be53c5c8b8227b57301de8b66ae97": "127be53c5c8b83f8995f81bb37d5804a",
  "94dbe53c5c8b833e8b7301fe54a29687": "885be53c5c8b822c942001dbf9b39e50",
  "535be53c5c8b8376a61701ce67e36a90": "b35be53c5c8b83bba14281689bbfbf81",
  "fc7be53c5c8b83999e9e814b7cc1d2ef": "e95be53c5c8b826c884e016eb4249469",
  "958be53c5c8b83debb9981a3f77df822": "5bbbe53c5c8b82009f38811b6e339bce",
  "87bbe53c5c8b82acba9a0153b20d35d2": "94cbe53c5c8b83259dfe81fe622a8aaf",
  "303be53c5c8b8208b2ee014fa8cb4fec": "ea7be53c5c8b822e9b2b0120bf6d41c9",
  "3fabe53c5c8b823aaec481c96ed37c63": "f3ebe53c5c8b83db9b2b81cbf8166d0c",
  "397be53c5c8b8213bb27012dd92a683b": "78bbe53c5c8b8362a4f081625562b4a1",
  "062be53c5c8b821e84900176215a1939": "a25be53c5c8b82b38e0281376231a1ab",
  "f15be53c5c8b8330a11701c58be0c2d1": "20cbe53c5c8b83dc9b8901541540de58",
  "a78be53c5c8b83279d3501d3964e63c5": "39fbe53c5c8b82578aa781784e3f179f",
  "4a8be53c5c8b838fa194814fe03ead51": "641be53c5c8b82259a1201c0fcd9f35d",
  "86cbe53c5c8b820486b901f1b83ad806": "ddbbe53c5c8b82a2b26981e6afbb21ce",
  "b5dbe53c5c8b836fa02281dec5f0ec72": "fb9be53c5c8b83bf9a078103277b9e6c",
  "195be53c5c8b82d3ba4d81f4734fce4c": "c27be53c5c8b83f0871c0125a246eeee",
  "fecbe53c5c8b83f19c9e0106decfc350": "6b8be53c5c8b8315b86901a25b405e9b",
  "0a9be53c5c8b828eb48481b582b2649d": "501be53c5c8b825aa9fb01d794551717",
  "8edbe53c5c8b82e8ae7d81b023a68ae6": "0e1be53c5c8b83ac9ead8130f225977a",
  "fbabe53c5c8b828d9e4501aee1577a34": "4c3be53c5c8b8313b293818cde995d11",
  "9efbe53c5c8b8209ba75818b7d8a7a28": "c54be53c5c8b83eb9538819505aef0b9",
  "98ebe53c5c8b8247988d81af4268de95": "4a4be53c5c8b82b086f581c20475ae7a",
  "842be53c5c8b8248b5af01f7d1f0a028": "efbbe53c5c8b820fb1ea812991ddd0b3",
  "89fbe53c5c8b82788fa581605e27019f": "b12be53c5c8b821785578178157aace5",
  "979be53c5c8b8223b1bf01737e540b86": "c27be53c5c8b824dbbe401fde2dc0df9",
  "47abe53c5c8b822b8c5601456ec32f4a": "630be53c5c8b8312a9b70128a075e238",
  "2b1be53c5c8b8221b54d01aa72668552": "2c2be53c5c8b82a7a69501a8e18bb118",
  "afbbe53c5c8b82479950010fb12d334c": "909be53c5c8b8338ba068185eea94184",
  "1cdbe53c5c8b8266962281716ddb0dd7": "562be53c5c8b837eaec881eafb76cd54",
  "eaabe53c5c8b8372b2b281ec8ac3a0b4": "03fbe53c5c8b82fa8714813e97877dd8",
  "9debe53c5c8b83f2a391812233a4eacd": "7a3be53c5c8b82f69fa0017bbe114b8a",
  "3d0be53c5c8b820493fa811703f866ac": "619be53c5c8b8336b37d01709e463910",
  "ecfbe53c5c8b83b2857281f988ef23f0": "0f3be53c5c8b828bbfe101f2e6feb28b",
  "8adbe53c5c8b82e589d6816e4bc846ef": "3d3be53c5c8b8217a2600178fa98262f",
  "8babe53c5c8b83cba94301e6cb6be76b": "3dbbe53c5c8b83dda5d4818cb0e45763",
  "888be53c5c8b8209b78c81b795e2131d": "d54be53c5c8b83979c2901b8a308db88",
  "6f3be53c5c8b8231a27701bcad70ec4c": "efabe53c5c8b820183908101fc658ead",
  "33cbe53c5c8b839ea2d78152cf6cf914": "cf8be53c5c8b82ac97a881589d6f3980",
  "e4bbe53c5c8b82abbb2d017347e07419": "6dfbe53c5c8b83ea83a701f6cba84ea1",
  "03cbe53c5c8b828690ff810f52f154a9": "c87be53c5c8b83df9e4f01f772afba95",
  "694be53c5c8b83f280e581818780d636": "255be53c5c8b83a093c701a633999103",
  "57bbe53c5c8b825b9c62014e9e62cf25": "b0ebe53c5c8b822db85d01858f4fe7cd",
  "cdbbe53c5c8b83e290de813feecc8356": "dbebe53c5c8b8324a03a013f70371203",
  "bbdbe53c5c8b83bab2a6019696fa94fc": "dbebe53c5c8b8324a03a013f70371203",
};

// Extra reading is optional, so it doesn't count toward progress.
const REQUIRED = ACADEMY.filter((s) => !s.extra).flatMap((s) => s.lessons.map((l) => l.id));
export const REQUIRED_LESSONS = REQUIRED.length;

// Swaps old lesson ids in a trainee's checklist for the new ones.
export function migrateChecklist(list: string[]): string[] {
  return [...new Set(list.map((id) => OLD_LESSON_IDS[id] ?? id))];
}

export function programProgress(t: Trainee) {
  const done = new Set(t.checklist ?? []);
  const n = REQUIRED.filter((id) => done.has(id)).length;
  const sections = ACADEMY.filter((s) => !s.extra && s.lessons.every((l) => done.has(l.id))).length;
  return { done: n, total: REQUIRED.length, pct: Math.round((n / REQUIRED.length) * 100), sections, sectionTotal: ACADEMY.filter((s) => !s.extra).length };
}

export const goodCalls = (t: Trainee) => (t.calls ?? []).filter((c) => c.good).length;

// Days 2–3 (practice, first live calls) are in practice-days.ts.

export type PlanItem = { id: string; title: string };

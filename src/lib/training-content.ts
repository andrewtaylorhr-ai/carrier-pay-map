// Knowledge checks, practical scenarios, the call process and the carrier
// requirements for the Training page. Written from the Class A Recruiting
// Academy lessons in Notion; `lesson` names where the answer is.
import type { TestQuestion } from "@/lib/academy-test";

export type TrainingSettings = {
  passMark: number; // % needed to pass the final exam
  maxAttempts: number; // 0 = unlimited
  signer: string; // printed under the signature line on certificates
};
export const SETTINGS_KEY = "cpm_trainingSettings";
export const DEFAULT_SETTINGS: TrainingSettings = { passMark: 85, maxAttempts: 0, signer: "" };

export type KnowledgeCheck = { id: string; title: string; questions: TestQuestion[]; explain?: boolean };

export const KNOWLEDGE_CHECKS: KnowledgeCheck[] = [
  {
    id: "check-fundamentals",
    title: "Recruiting fundamentals",
    questions: [
      {
        q: "What should your workspace be like when you are making calls?",
        options: ["Quiet, with no interruptions", "Anywhere, as long as you have a phone", "A busy cafe, so you sound relaxed", "It doesn't matter"],
        answer: 0,
        why: "A focused, quiet workspace keeps you professional on every call.",
        lesson: "Recruiting Process Outline",
      },
      {
        q: "What should you keep ready before you start calling?",
        options: ["Only your phone", "Carrier details and qualification checklists", "Last month's paycheck", "Nothing, you can look it up later"],
        answer: 1,
        why: "Have carrier details and your checklists in reach so you can answer on the call.",
        lesson: "Recruiting Process Outline",
      },
      {
        q: "How quickly should you respond to a driver's inquiry?",
        options: ["By the end of the week", "Whenever you have free time", "As soon as possible", "Only after they call twice"],
        answer: 2,
        why: "Prompt responses show professionalism and keep drivers engaged.",
        lesson: "Recruiting Process Outline",
      },
      {
        q: "What is pre-qualifying for?",
        options: ["Filling the call time", "Making only drivers who meet the requirements move forward", "Replacing the application", "Finding out the driver's favorite carrier"],
        answer: 1,
        why: "Pre-qualifying moves forward only the drivers who meet safety, experience and regulatory requirements.",
        lesson: "7 Questions to ask a driver while on a call",
      },
    ],
  },
  {
    id: "check-carriers",
    title: "Carrier knowledge",
    questions: [
      {
        q: "What is the minimum age at Swift, US Xpress, PAM and TransAm?",
        options: ["18", "19", "21", "25"],
        answer: 2,
        why: "All four carriers' lessons list at least 21 years of age.",
        lesson: "Swift / US Xpress / PAM / Trans AM",
      },
      {
        q: "How much OTR experience does TransAm need?",
        options: ["None", "At least 90 days OTR in the last year, not counting training", "1 year in the last 3 years", "5 years"],
        answer: 1,
        why: "TransAm needs at least 90 days OTR (solo or team) in the last year, not counting training time.",
        lesson: "Trans AM (3 months in the past year)",
      },
      {
        q: "What is the US Xpress limit on moving violations?",
        options: ["No limit", "No more than 3 in 3 years and no more than 2 in 12 months", "No more than 1 ever", "No more than 6 in 3 years"],
        answer: 1,
        why: "US Xpress allows no more than 3 in the last 3 years and no more than 2 in the last 12 months.",
        lesson: "US Xpress (Local, Regional, OTR) (3 months)",
      },
      {
        q: "PAM's point system: which date decides whether a violation is inside the 3 years?",
        options: ["The violation date", "The conviction date", "The application date", "The date the driver remembers"],
        answer: 1,
        why: "PAM uses the conviction date, not the violation date.",
        lesson: "PAM Transportation (3 months in the past year)",
      },
    ],
  },
  {
    id: "check-prequal",
    title: "Safety and pre-qualification",
    questions: [
      {
        q: "Which is a Pre-Qualifying Checklist question?",
        options: ["Criminal history in a lifetime: what, when, where and sentence", "The driver's favorite truck", "The driver's credit score", "How many children the driver has"],
        answer: 0,
        why: "The checklist asks for criminal history in a lifetime, with what, when, where and the sentence.",
        lesson: "Pre-Qualifying Checklist",
      },
      {
        q: "Falsifying logbooks or ELD records is what type of violation?",
        options: ["Vehicle violation", "Moving violation", "Hours of Service violation", "Not a violation"],
        answer: 2,
        why: "Falsifying logs is listed under Hours of Service violations.",
        lesson: "Violations Types",
      },
      {
        q: "Which documents help verify a driver's work history?",
        options: ["A note from a friend", "Pay stubs, W2s/1099s and employment records", "A social media profile", "The driver's word is enough"],
        answer: 1,
        why: "Collect employment records, pay stubs, W2s/1099s and VOE details.",
        lesson: "Work History and Unemployment Gaps",
      },
      {
        q: "A driver has an unemployment gap. What is the right view?",
        options: ["Every gap is a disqualification", "Gaps never matter", "Ask why: not all gaps are negative, but unexplained ones raise concerns", "Leave it off the application"],
        answer: 2,
        why: "Gaps can have good reasons; it's unexplained gaps that raise concerns.",
        lesson: "Work History and Unemployment Gaps",
      },
    ],
  },
  {
    id: "check-communication",
    title: "Communication",
    questions: [
      {
        q: "Which kind of question gets the driver talking?",
        options: ["Open-ended questions", "Yes-or-no questions only", "Questions full of industry jargon", "No questions, just talk"],
        answer: 0,
        why: "Open-ended questions encourage the driver to share their experience.",
        lesson: "Speaking Rules",
      },
      {
        q: "What is active listening?",
        options: ["Talking over the driver to save time", "Giving them time to speak and repeating back key points", "Reading the script without stopping", "Typing while ignoring what they say"],
        answer: 1,
        why: "Let the driver speak and repeat back key points to confirm you understood.",
        lesson: "Speaking Rules / Convincing / Consulting",
      },
      {
        q: "How do you ask about sensitive topics like tickets or criminal history?",
        options: ["In a cold, accusing tone", "Skip them", "In a light, conversational tone, without accusing", "Only by email"],
        answer: 2,
        why: "A light tone keeps the driver at ease; ask clarifying questions without appearing accusatory.",
        lesson: "Call Script",
      },
      {
        q: "A recruiter should act as:",
        options: ["A consultant giving honest advice that fits the driver's goals", "A salesperson who pushes one job", "A dispatcher", "A safety officer"],
        answer: 0,
        why: "Position yourself as a consultant, not a salesperson.",
        lesson: "Convincing / Consulting",
      },
    ],
  },
  {
    id: "check-offer",
    title: "Job offer and application",
    questions: [
      {
        q: "What comes first in a Proper Presentation?",
        options: ["Equipment", "Home time", "Running area", "Freight"],
        answer: 1,
        why: "The order is home time, pay, freight, equipment, running area.",
        lesson: "Proper Presentation",
      },
      {
        q: "A driver is unsure about OTR because of home time. What can you offer?",
        options: ["Tell them OTR is the only choice", "End the call", "Promise home time the carrier doesn't offer", "Start on regional routes and move up with experience"],
        answer: 3,
        why: "Offer a flexible path, such as starting on regional routes.",
        lesson: "Convincing / Consulting",
      },
      {
        q: "What is Tenstreet used for?",
        options: ["Booking drivers' hotels", "Applicant tracking, applications and screening", "Paying recruiters", "Truck maintenance"],
        answer: 1,
        why: "Tenstreet captures every application and handles tracking and screening.",
        lesson: "What is Tenstreet?",
      },
      {
        q: "What do local positions usually offer?",
        options: ["The highest mileage pay", "All 48 states", "Frequent home time, often daily or weekly", "Weeks away from home"],
        answer: 2,
        why: "Local positions are for drivers who value home time and consistency.",
        lesson: "Convincing / Consulting",
      },
    ],
  },
  {
    id: "check-followup",
    title: "Submission and follow-up",
    questions: [
      {
        q: "Is submitting the application the finish line?",
        options: ["Yes, the work is done", "Yes, unless the driver calls you", "No, it's just the beginning", "Only for OTR drivers"],
        answer: 2,
        why: "Submitting isn't the finish line. If you don't stay in contact, another recruiter will.",
        lesson: "Follow Up calls",
      },
      {
        q: "A lead isn't responding. How often do you follow up?",
        options: ["Every 24–48 hours until they respond", "Once a month", "Once, then delete them", "Only if they text first"],
        answer: 0,
        why: "Follow up every 24–48 hours until they respond, and keep checking in until they're hired or say no.",
        lesson: "Follow Up calls",
      },
      {
        q: "Many drivers don't answer unknown numbers. What works best?",
        options: ["Calling ten times in a row", "Start with a text to introduce yourself, then call", "Waiting for them to call you", "Sending only a letter"],
        answer: 1,
        why: "Phone plus text is the winning combination: text first, then call.",
        lesson: "Follow Up calls",
      },
      {
        q: "How do you keep track of every lead?",
        options: ["From memory", "On sticky notes", "Only in your phone's call log", "In a CRM or spreadsheet, with notes on each call"],
        answer: 3,
        why: "Use a CRM or spreadsheet and take notes so you can pick up where you left off.",
        lesson: "Follow Up calls",
      },
    ],
  },
  {
    id: "check-scenarios",
    title: "Practical scenarios",
    explain: true,
    questions: [
      {
        q: "Limited experience: a driver just got a CDL and has 2 months of driving. They want a job this week.",
        options: [
          "Write 6 months on the application so they qualify",
          "Check which programs take drivers with little experience, such as Swift's trainee program, and match them to one they qualify for",
          "Tell them nobody will ever hire them",
          "Submit them to every carrier and see what happens",
        ],
        answer: 1,
        why: "Swift's trainee program needs 0 months with a valid Class A CDL. Match the driver to rules they really meet, and never change their experience.",
        lesson: "Swift / What is verifiable experience",
      },
      {
        q: "Criminal record: during PQ a driver tells you about a felony some years ago.",
        options: [
          "Get what, when, where and the sentence, then check it against the carrier's rules and ask your manager if unclear",
          "Hang up right away",
          "Leave it off the application",
          "Tell them it won't matter at any carrier",
        ],
        answer: 0,
        why: "The checklist asks what, when, where and the sentence. Each carrier's rule differs, and unclear cases go for review.",
        lesson: "Pre-Qualifying Checklist / Criminal History",
      },
      {
        q: "Accident: a driver wants TransAm but had a preventable accident 4 months ago.",
        options: [
          "Submit to TransAm and don't mention it",
          "Call it non-preventable on the application",
          "Explain TransAm needs no preventable accidents in the last 6 months, look for a carrier that fits, and note when they could qualify",
          "Close the lead for good",
        ],
        answer: 2,
        why: "TransAm allows no preventable accidents in the last 6 months. Be honest, find another fit, and set a follow-up.",
        lesson: "Trans AM (3 months in the past year)",
      },
      {
        q: "Tickets: a driver who wants Swift got a ticket for 32 mph over the limit 2 years ago.",
        options: [
          "Swift is fine, tickets over a year old don't count",
          "It's a DQ at Swift (30+ speeding in the last 3 years), so check other carriers' rules",
          "Tell them not to mention it",
          "Submit and let Swift find it",
        ],
        answer: 1,
        why: "A 30+ speeding ticket in the last 3 years is a DQ at Swift. Another carrier's rules may allow it.",
        lesson: "Swift",
      },
      {
        q: "Not interested: a driver says \"I'm not interested\" right after you introduce yourself.",
        options: [
          "Argue until they agree",
          "Mark them as a bad driver",
          "Keep reading the script",
          "Politely ask what concerns them or what they're looking for, and if it's still no, note it and respect that",
        ],
        answer: 3,
        why: "Ask about concerns and offer a fit. Keep checking in until they're hired or say no.",
        lesson: "Convincing / Consulting / Follow Up calls",
      },
      {
        q: "Stops responding: a driver filled in half the application and has not answered for two days.",
        options: [
          "Text and call every 24–48 hours, check in on their concerns, and log each attempt",
          "Delete the lead",
          "Finish the application for them",
          "Wait for them to come back",
        ],
        answer: 0,
        why: "Phone plus text, every 24–48 hours. Losing drivers from poor follow-up is the #1 complaint.",
        lesson: "Follow Up calls",
      },
      {
        q: "Other applications: a driver says they applied at two other carriers last week.",
        options: [
          "Ignore it, it doesn't matter",
          "Tell them to withdraw before you will talk",
          "Find out where and when (past 30 days), and check whether they already applied to your carrier before you submit",
          "Say bad things about those carriers",
        ],
        answer: 2,
        why: "The checklist asks where they applied in the past 30 days, including whether it was this carrier.",
        lesson: "Pre-Qualifying Checklist / Recruiting Process Outline",
      },
      {
        q: "Doesn't meet requirements: the driver is short of every rule for the carrier they want.",
        options: [
          "Change the details so they pass",
          "Be honest about why, look for another carrier that fits, and if none do, set a follow-up for when they'd qualify",
          "Say the carrier isn't hiring",
          "Submit them and hope",
        ],
        answer: 1,
        why: "Be transparent, keep the lead, and never change a driver's information.",
        lesson: "Convincing / Consulting",
      },
    ],
  },
];

// ---- The recruiting call, step by step (lines from the Call Script lesson).

export type CallStep = { title: string; goal: string; say: string };

export const CALL_STEPS: CallStep[] = [
  {
    title: "Opening and introduction",
    goal: "Say who you are, confirm their resume, and find out if they are still looking.",
    say: "Hey [DRIVER NAME], this is [YOUR NAME] calling regarding the resume you submitted on [DATE]. Have you found a job yet, or are you still looking?",
  },
  { title: "ZIP code", goal: "Find which jobs hire where the driver lives.", say: "May I have your zip code so I can pull up additional opportunities for you?" },
  { title: "CDL status", goal: "Confirm they hold a valid Class A CDL, and in which state.", say: "Are you holding a valid Class A CDL right now? What state is it in?" },
  {
    title: "Driving experience",
    goal: "Get their total, verifiable Class A experience.",
    say: "Can you tell me about your total Class A experience over the last 5 years?",
  },
  {
    title: "Work history",
    goal: "Learn why they left and whether it limits which carrier can take them.",
    say: "What's going on? Did you quit your job, or were you let go? What has you looking for work at the moment?",
  },
  {
    title: "Driver preferences",
    goal: "Learn what they want before you offer anything.",
    say: "What type of routes are you most comfortable with? What are your pay expectations and how much home time do you need?",
  },
  {
    title: "PQ (Pre-Qualification)",
    goal: "Tickets and accidents (3 years); DUIs, suspensions, criminal history (lifetime); terminations; applications in the past 30 days.",
    say: "How is your MVR? Any accidents, incidents, DWIs, speeding tickets, or pending issues? Where have you applied in the past 30 days?",
  },
  {
    title: "Present the right carrier",
    goal: "Pick a job they qualify for. Cover the 5 points: home time, pay, freight, equipment, running area.",
    say: "Based on what you've shared, this one fits you best. Let me go over the home time and pay first, then the freight, equipment and running area.",
  },
  { title: "Handle objections", goal: "Ask about the concern, then answer it. Bring in a lead recruiter if you get stuck.", say: "Can you share any concerns you have about this opportunity?" },
  {
    title: "Application process",
    goal: "Trial close, then take the details and complete the application together.",
    say: "I don't want to put the cart before the horse, but if we can get you approved today, are you good for an orientation on Monday?",
  },
  {
    title: "Confirmation and closing",
    goal: "Confirm next steps and when you will call again.",
    say: "I'll send you a release form by email. Please sign and return it before we hang up. I'll follow up with you within 48 hours.",
  },
];

export const SAMPLE_CALL: { who: "Recruiter" | "Driver"; line: string }[] = [
  { who: "Recruiter", line: "Hey John, this is Sarah calling about the resume you sent on April 20th. Are you still looking for a position?" },
  { who: "Driver", line: "Yeah, still looking." },
  { who: "Recruiter", line: "Great. Can you share your zip code so I can pull up options in your area?" },
  { who: "Driver", line: "It's 75201." },
  { who: "Recruiter", line: "Thanks. Do you have a valid Class A CDL, and how much Class A experience do you have over the last 5 years?" },
  { who: "Driver", line: "Texas CDL, about 4 years, all OTR." },
  { who: "Recruiter", line: "Nice. What has you looking for work at the moment?" },
  { who: "Driver", line: "I'm out too long. I want to be home more." },
  { who: "Recruiter", line: "That makes sense. How much home time would be ideal, and what are your pay expectations?" },
  { who: "Driver", line: "Home every weekend, around $1,400 a week." },
  { who: "Recruiter", line: "Got it. How is your MVR? Any tickets or accidents in the last 3 years, any DUIs or suspensions ever? Anything on your background I should know? And where have you applied in the past 30 days?" },
  { who: "Driver", line: "One speeding ticket two years ago. Nothing else, and I haven't applied anywhere." },
  { who: "Recruiter", line: "Thanks for being straight with me. Based on what you've shared, I have a regional job that gets you home weekly. Let me go over the home time and pay, then the freight, equipment and running area." },
  { who: "Driver", line: "Pay sounds a little low." },
  { who: "Recruiter", line: "I hear you. Can you share what concerns you most? Let me show you how the weekly pay adds up with the miles." },
  { who: "Driver", line: "Okay, that works." },
  { who: "Recruiter", line: "I don't want to put the cart before the horse, but if we can get you approved today, are you good for an orientation on Monday?" },
  { who: "Driver", line: "Yes." },
  { who: "Recruiter", line: "Perfect. Let's complete the application together. I'll email you a release form to sign before we hang up, and I'll follow up within 48 hours. Thank you for your time, John." },
];

// ---- Carrier requirements. These are only the starting values: the manager
// edits them on the Training page, and the edits are what's used from then on.

export type CarrierRuleField = "age" | "cdl" | "experience" | "hiring" | "opportunities" | "special" | "dq" | "notes";

export const CARRIER_RULE_FIELDS: { key: CarrierRuleField; label: string }[] = [
  { key: "age", label: "Minimum age" },
  { key: "cdl", label: "CDL requirements" },
  { key: "experience", label: "Experience requirements" },
  { key: "hiring", label: "Hiring areas" },
  { key: "opportunities", label: "OTR / Regional / Local" },
  { key: "special", label: "Special qualifications" },
  { key: "dq", label: "Disqualifying factors" },
  { key: "notes", label: "Important recruiter notes" },
];

export type CarrierRule = { id: string; name: string } & Partial<Record<CarrierRuleField, string>>;
export const CARRIER_RULES_KEY = "cpm_carrierRules";

export const DEFAULT_CARRIER_RULES: CarrierRule[] = [
  {
    id: "swift",
    name: "Swift Transportation",
    age: "At least 21. Must have held a US driver's license for the last 12 consecutive months.",
    cdl: "Trainee and experienced drivers need a valid Class A CDL.",
    experience: "Academy: 0 months. Trainee: 0 months with a valid Class A CDL. Experienced: 6 months OTR after training within the last 12 months, or at least 12 months in the past 5 years. Military experience considered with a DD214.",
    hiring: "See the hiring maps in the Swift lesson and the Pay Map.",
    opportunities: "OTR, regional, dedicated and local accounts.",
    special: "Accident report needed for all accidents in the last 5 years on reports. Copy of the original ticket for tickets in the last 3 years not defined by the reports.",
    dq: "More than 2 moving violations in 2 years. Serious violations in the last 12 months. 30+ speeding in the last 3 years. More than 1 on-road or DOT preventable loss in 2 years. All at-fault rear-end accidents are a 1-year DQ. Drug-related conviction in the past 5 years.",
    notes: "Carrier Notes: home time, schedule, account, exact pay quoted and the app confirmation number. Check the Swift lesson for the full list.",
  },
  {
    id: "usx",
    name: "US Xpress (USX)",
    age: "At least 21.",
    cdl: "Class A CDL. If licensed in another state than the job's hiring area, the driver has 30 days to switch.",
    experience: "Minimum 3 months in the last 36 months, with no more than two carriers. Under 6 months: no preventable CMV roadway accidents. School doesn't count. Must be T/T with trailers over 40 feet.",
    hiring: "See the USX hiring map link in the lesson and the Pay Map.",
    opportunities: "Local, regional and OTR.",
    special: "Drivers discharged for safety need 6 months of verified safe CMV driving afterwards.",
    dq: "More than 3 moving violations in 3 years or more than 2 in 12 months. More than 4 ticket/accident/incident combined in 36 months. More than 1 DOT-recordable preventable in 12 months. No more than 4 jobs in 1 year, 6 in 2 years, 8 in 3 years.",
    notes: "Carrier Notes: run applied for, pay quoted, home time quoted, and when they want orientation.",
  },
  {
    id: "pam",
    name: "PAM Transport",
    age: "At least 21.",
    cdl: "Class A CDL. Jobs counted as experience must have required a Class A.",
    experience: "3 months current verifiable OTR in a T/T in the past year plus an accredited school in the past 2 years, or 1 year verifiable OTR in the past 3 years. Trailers 45 feet or longer.",
    hiring: "See the hiring map in the lesson. About 90 miles around each domicile.",
    opportunities: "OTR and city drivers.",
    special: "Military experience: DD214 needed if service was within the last 3 years.",
    dq: "More than 5 MVR points in 3 years (conviction date counts). More than 4 moving violations in 3 years. Suspensions for moving violations within the last year. Leaving the scene of an accident. Violating an out-of-service order.",
    notes: "All accidents in the last 3 years must be disclosed. Fatality accidents need approval.",
  },
  {
    id: "cre",
    name: "CR England",
    hiring: "See the CR England accounts on the Pay Map.",
    notes: "No Academy lesson for CR England yet. Fill these in from their information sheet.",
  },
  {
    id: "transam",
    name: "TransAm",
    age: "At least 21.",
    cdl: "Valid CDL-A in the state where the driver lives, for interstate driving.",
    experience: "At least 90 days OTR (solo or team) in the last year, not counting training. Experience must be recent.",
    hiring: "See the hiring area in the lesson and the Pay Map.",
    opportunities: "OTR.",
    special: "Will consider a driver on probation or parole with a letter from the PO that says they can travel for work.",
    dq: "More than 3 moving violations in 3 years (DUIs and open containers count). Preventable accident in the last 6 months, or more than 1 in 12 months. Reckless driving in the past 5 years. DUI inside 3 years. Termed for an accident at the last job. Ignition interlock.",
    notes: "On the pay chart, experience counts from the last preventable accident. Include 10 years of work history.",
  },
  {
    id: "uc-group",
    name: "UC Group",
    notes: "Named in the training brief. No lesson or data yet. Fill these in, or delete this carrier.",
  },
];

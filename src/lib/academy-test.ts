// The Academy test: questions taken from the Class A Recruiting Academy
// lessons in Notion, to check what a trainee learned on their Academy day.
// `lesson` names where the answer is, shown with the explanation.

export type TestQuestion = { q: string; options: string[]; answer: number; why: string; lesson: string };

export const ACADEMY_TEST: TestQuestion[] = [
  // Introduction
  {
    q: "When a driver is talking to you, who do you say you represent?",
    options: ["Class A Recruiting, a third-party agency", "The carrier you are hiring for", "Indeed", "Nobody, you just ask questions"],
    answer: 1,
    why: "Never tell the driver you are a third-party recruiter. Always represent the carrier.",
    lesson: "Driver Recruitment Process",
  },
  {
    q: "When is a driver officially hired?",
    options: ["When the application is submitted", "When the carrier approves them", "When they attend orientation", "Only after they are dispatched"],
    answer: 3,
    why: "Orientation doesn't guarantee hiring. The driver is officially hired only after dispatch.",
    lesson: "Driver Recruitment Process",
  },
  {
    q: "The driver's orientation is on Monday. When do you follow up?",
    options: ["Monday morning only", "During the weekend before", "After orientation is over", "No need to follow up"],
    answer: 1,
    why: "If orientation is on Monday, follow up during the weekend so the driver shows up.",
    lesson: "Driver Recruitment Process",
  },
  {
    q: "What is the right way to do the Tenstreet application?",
    options: [
      "Send the driver the link and wait",
      "Fill it out together with the driver: name, SSN and date of birth, then the verification code",
      "Fill it out yourself without the driver",
      "Ask the driver to apply on the carrier's website",
    ],
    answer: 1,
    why: "Complete the application with the driver. Only send the link (and ask for a PDF) if the driver declines.",
    lesson: "Driver Recruitment Process",
  },
  // Safety
  {
    q: "How long does a failed drug test stay in the FMCSA Clearinghouse?",
    options: ["1 year", "3 years", "5 years", "Forever"],
    answer: 2,
    why: "A failed drug test stays in the Clearinghouse for five years.",
    lesson: "SAP program",
  },
  {
    q: "A driver failed a drug test. What must they finish before they can drive again?",
    options: ["A new CDL test", "The SAP return-to-duty process", "Nothing, they just wait 30 days", "A defensive driving course"],
    answer: 1,
    why: "They need a SAP evaluation, the treatment or education it prescribes, and an observed return-to-duty test.",
    lesson: "SAP program",
  },
  {
    q: "After return-to-duty, how many unannounced follow-up tests does a driver get in the first 12 months, at least?",
    options: ["1", "3", "6", "12"],
    answer: 2,
    why: "At least six unannounced follow-up tests in the first 12 months, and possibly testing for up to 60 months.",
    lesson: "SAP program",
  },
  {
    q: "Which of these counts as a REFUSAL to take a drug test?",
    options: ["Asking what the test is for", "Leaving before the collection is finished", "Being late by 5 minutes after calling ahead", "Taking the test and then complaining"],
    answer: 1,
    why: "Not showing up, leaving early, giving an altered sample or not cooperating all count as a refusal.",
    lesson: "Drug Testing",
  },
  {
    q: "How far back can a hair follicle drug test detect substances?",
    options: ["7 days", "30 days", "90 days", "1 year"],
    answer: 2,
    why: "Hair tests go back about 90 days. Urine tests about 30 days.",
    lesson: "Drug Testing",
  },
  {
    q: "A driver refuses to give consent for a Clearinghouse full query. What happens?",
    options: ["You submit them anyway", "They cannot be hired", "You run a limited query instead", "They only need a urine test"],
    answer: 1,
    why: "If a driver refuses consent for a full query, they cannot be hired.",
    lesson: "Clearinghouse",
  },
  {
    q: "Which report shows a driver's traffic violations, suspensions and accident history?",
    options: ["MVR (Motor Vehicle Report)", "W2", "Tenstreet", "DOT medical card"],
    answer: 0,
    why: "The MVR shows traffic violations, suspensions and accidents.",
    lesson: "Violations Types",
  },
  {
    q: "Many carriers have zero tolerance for major moving violations within how many years?",
    options: ["1 year", "3 years", "7 years", "10 years"],
    answer: 1,
    why: "Many companies won't accept major moving violations in the past 3 years.",
    lesson: "Violations Types",
  },
  // Pre-qualification
  {
    q: "On the Pre-Qualifying Checklist, how far back do you ask about tickets and accidents?",
    options: ["Last 12 months", "Last 3 years", "Last 10 years", "Lifetime"],
    answer: 1,
    why: "Tickets and accidents: last 3 years. DUIs, suspensions and criminal history: lifetime.",
    lesson: "Pre-Qualifying Checklist",
  },
  {
    q: "Which of these do you ask about for the driver's WHOLE LIFETIME?",
    options: ["Speeding tickets", "Accidents", "DUIs and license suspensions", "Where they applied"],
    answer: 2,
    why: "DUIs, suspensions and criminal history are lifetime questions.",
    lesson: "Pre-Qualifying Checklist",
  },
  {
    q: "You ask where the driver has applied recently. What time period?",
    options: ["Past 7 days", "Past 30 days", "Past 6 months", "Past year"],
    answer: 1,
    why: "Ask where they've applied in the past 30 days.",
    lesson: "Pre-Qualifying Checklist",
  },
  {
    q: "How many years of a driver's work history must carriers be able to verify (VOE)?",
    options: ["Last 1 year", "Last 3 years", "Last 5 years", "Only the last job"],
    answer: 1,
    why: "Carriers verify the last three years of work history through a Verification of Employment.",
    lesson: 'What is "verifiable" experience',
  },
  {
    q: "A driver's experience can't be verified with the employer. What usually happens?",
    options: [
      "It still counts if the driver says so",
      "It doesn't count toward their experience, and a big gap can mean a DQ",
      "You verify it yourself by calling as the carrier",
      "Pay stubs always replace it",
    ],
    answer: 1,
    why: "Unverified experience isn't counted. Pay stubs are only partial proof. Never do the VOE yourself.",
    lesson: 'What is "verifiable" experience',
  },
  {
    q: "You notice a gap in a driver's work history. How do you handle it?",
    options: [
      "Skip the driver",
      "Ignore it",
      "Ask an open question about what they did then, and ask for documents if needed",
      "Tell them to leave it off the application",
    ],
    answer: 2,
    why: "Probe gently with an open question, let them explain, and verify with documents when you can.",
    lesson: "Work History and Unemployment Gaps",
  },
  // Calls
  {
    q: "How do you answer an incoming call?",
    options: ['"Hello?"', '"Recruiting Department, how can I help you today?"', '"Class A Recruiting agency"', "With the driver's name"],
    answer: 1,
    why: 'Start every incoming call with "Recruiting Department".',
    lesson: "Incoming/outbound calls",
  },
  {
    q: "What is the first thing to ask the driver for on the opening call, so you can pull up jobs?",
    options: ["Their SSN", "Their zip code", "Their date of birth", "Their last paycheck"],
    answer: 1,
    why: "The script asks for the zip code early to pull up jobs in their area.",
    lesson: "Call Script",
  },
  {
    q: 'What is the "trial close" in the Call Script?',
    options: [
      '"If we get you approved today, are you good for an orientation on Monday?"',
      '"Can I call you back next week?"',
      '"Do you want to think about it?"',
      '"Please send me your resume."',
    ],
    answer: 0,
    why: "The trial close checks the driver is ready before you finish the application.",
    lesson: "Call Script",
  },
  {
    q: "Which way of building rapport is right?",
    options: [
      '"Hello, is this John?"',
      '"Hey John! This is Sara from [Company]. How\'s your day going?"',
      '"Our client is expanding their workforce of Class A operators."',
      "Start straight with the pre-qualifying questions",
    ],
    answer: 1,
    why: "Open warm, use their name, and ask a simple personal question. No corporate jargon.",
    lesson: "Building Rapport and Prequalifying like a BOSS!",
  },
  {
    q: "What are the 5 points of a proper job presentation?",
    options: [
      "Home time, pay, freight, equipment, running area",
      "Company age, CEO, office, website, logo",
      "Salary, vacation, holidays, uniform, parking",
      "Pay, bonus, insurance, 401k, PTO",
    ],
    answer: 0,
    why: "Proper Presentation: home time, pay, freight, equipment and running area.",
    lesson: "Proper Presentation",
  },
  // Job offer
  {
    q: "What are practical miles?",
    options: [
      "The shortest possible route",
      "Miles on the most efficient, truck-friendly route (highways and interstates)",
      "Only the miles with a loaded trailer",
      "Miles the driver logs by hand",
    ],
    answer: 1,
    why: "Practical miles use highways and interstates and usually pay fairer than shortest (HHG) miles.",
    lesson: "Practical Miles & How To Explain It To A Driver",
  },
  {
    q: "Which pay method do drivers prefer?",
    options: ["Shortest (HHG) miles", "Practical miles", "Both are the same", "Neither"],
    answer: 1,
    why: "Practical miles: better fuel economy, quicker travel and fairer pay.",
    lesson: "Practical Miles & How To Explain It To A Driver",
  },
  {
    q: "A driver isn't sure about OTR because of home time. What can you offer?",
    options: [
      "Tell them OTR is the only option",
      "Start on regional routes and move up as they gain experience",
      "End the call",
      "Promise local home-daily without checking",
    ],
    answer: 1,
    why: "Consult, don't push: offer a flexible path that fits their needs.",
    lesson: "Convincing / Consulting",
  },
  {
    q: "What is a rider policy?",
    options: [
      "A rule about motorcycles",
      "Allowing a passenger to ride with the driver, under company rules",
      "Insurance for the trailer",
      "A bonus for riding with a trainer",
    ],
    answer: 1,
    why: "Riders usually sign a waiver and follow company rules. Not every carrier allows riders.",
    lesson: "Rider Policy for Truck Drivers",
  },
  // Application & documents
  {
    q: "A driver hesitates to give their SSN. What do you do?",
    options: [
      "Skip the application",
      "Reassure them it's for the standard background and MVR check, or offer the secure link",
      "Tell them it's optional",
      "Hang up and call back tomorrow",
    ],
    answer: 1,
    why: "Ask confidently, reassure them, and offer to let them enter it on the secure link.",
    lesson: "How to ask for a Social Security Number?",
  },
  {
    q: "Why are W2 drivers safer for recruiters than 1099 drivers?",
    options: [
      "They drive faster",
      "Carriers don't ask for a guarantee and there's no probation on your commission",
      "They don't need a CDL",
      "They never need a drug test",
    ],
    answer: 1,
    why: "With W2 drivers carriers ask no guarantee on hire and there's no probation for your commission.",
    lesson: "What are W2 and 1099 Contracts",
  },
  {
    q: "What is a DOT-recordable accident?",
    options: [
      "Any accident at all",
      "One with a fatality, an injury treated away from the scene, or a vehicle towed",
      "Only accidents the driver caused",
      "Accidents in a parking lot",
    ],
    answer: 1,
    why: "DOT-recordable means a fatality, bodily injury treated away from the scene, or disabling damage that needs a tow.",
    lesson: "Accidents, Accident Report and Lost Runs",
  },
  {
    q: "For an accident report, what does the carrier need?",
    options: ["Only the date", "The diagram and the narrative", "A photo of the truck", "The driver's opinion"],
    answer: 1,
    why: "What we need from an accident report is the diagram and a narrative.",
    lesson: "Accidents, Accident Report and Lost Runs",
  },
  // Leads & follow-up
  {
    q: "A new Indeed lead comes in. How fast should you make first contact?",
    options: ["Within 5–10 minutes", "Same week", "Next morning", "Wait until they call you"],
    answer: 0,
    why: "Indeed leads go cold fast. Call within 5–10 minutes, then text and email if they don't answer.",
    lesson: "Indeed Leads",
  },
  {
    q: "The driver doesn't answer your call. What's next?",
    options: ["Mark them as dead", "Leave a voicemail and send a text, then keep trying at different times", "Email once and stop", "Wait for them to call"],
    answer: 1,
    why: "Call, text, email. Keep following up every 24–48 hours until you get a response.",
    lesson: "Follow Up calls",
  },
  {
    q: "After you submit a driver, when should you set the next check-in?",
    options: ["Within 24 hours", "In one week", "After orientation", "Only if the carrier asks"],
    answer: 0,
    why: "Schedule a follow-up within 24 hours and give the driver your contact details.",
    lesson: "Recruiting Process Outline",
  },
  {
    q: "What is the #1 reason recruiters lose drivers, according to recruiting managers?",
    options: ["Low pay", "Not following up properly", "Bad weather", "Too many questions"],
    answer: 1,
    why: "Speed + consistency = more hires. Not following up is the #1 complaint.",
    lesson: "Indeed Leads",
  },
  // Carrier qualification scenarios
  {
    q: "A driver's only OTR experience is 60 days in the last year, not counting training. They want TransAm. What do you do?",
    options: [
      "Submit them to TransAm anyway",
      "Round it up to 90 days on the application",
      "Explain TransAm needs 90 days in the last year, and look for another carrier that fits",
      "End the call",
    ],
    answer: 2,
    why: "TransAm needs at least 90 days OTR in the last year, not counting training. Never change a driver's experience.",
    lesson: "Trans AM (Carrier rules tab)",
  },
  {
    q: "A driver has 6 MVR points in the last 3 years on PAM's point system. Can PAM hire them?",
    options: ["Yes, up to 10 points is fine", "No, more than 5 points in 3 years is not eligible", "Yes, if they have 1 year of experience", "Points don't matter at PAM"],
    answer: 1,
    why: "An applicant with more than 5 points within the last 3 years is not eligible at PAM.",
    lesson: "PAM Transportation (3 months in the past year)",
  },
  {
    q: "A driver has 3 moving violations in the last 3 years, and all 3 were in the last 12 months. Does the driver fit US Xpress?",
    options: ["Yes, 3 in 3 years is allowed", "Yes, if they have 3 months of experience", "No, US Xpress allows no more than 2 in the last 12 months", "No, US Xpress allows none"],
    answer: 2,
    why: "US Xpress allows no more than 3 in 3 years and no more than 2 in the last 12 months.",
    lesson: "US Xpress (Local, Regional, OTR) (3 months)",
  },
  // Communication
  {
    q: "You sense hesitation or run into trouble during the application. What does the Call Script tell you to do?",
    options: ["Hang up and try next week", "Bring in the lead recruiter", "Finish the application without the driver", "Ignore it and keep going"],
    answer: 1,
    why: "Ask them to hold for a moment and bring in the lead recruiter, so the driver feels supported.",
    lesson: "Call Script",
  },
  {
    q: "A driver hesitates about the job you offered. What is a good first question?",
    options: ["Why are you wasting my time?", "Can you share any concerns you have about this opportunity?", "Do you want the job or not?", "Who else are you talking to?"],
    answer: 1,
    why: "Ask about the concern first, then give a solution that fits.",
    lesson: "Convincing / Consulting",
  },
  // Application submission
  {
    q: "Which of these goes in the Carrier Notes when you submit a Swift driver?",
    options: [
      "Only the driver's name",
      "Home time, schedule, account, exact pay quoted and the app confirmation number",
      "The driver's favorite routes",
      "Nothing, the application is enough",
    ],
    answer: 1,
    why: "Carrier Notes list exactly what was sold to the driver and the confirmation number.",
    lesson: "Swift",
  },
  {
    q: "After you complete the application, when does the Call Script say you will follow up?",
    options: ["Within 48 hours", "In two weeks", "Only if the driver calls", "After orientation"],
    answer: 0,
    why: "Close the call with a clear next step: you will follow up within 48 hours.",
    lesson: "Call Script",
  },
  // True or false
  {
    q: "True or false: truck driving school counts as experience for US Xpress.",
    options: ["True", "False"],
    answer: 1,
    why: "US Xpress: truck driving school or training doesn't count as experience.",
    lesson: "US Xpress (Local, Regional, OTR) (3 months)",
  },
  {
    q: "True or false: on TransAm's pay chart, a driver's experience counts from their last preventable accident.",
    options: ["True", "False"],
    answer: 0,
    why: "A driver with 5 years of experience whose last preventable accident was 2 years ago is a 2-year driver on the chart.",
    lesson: "Trans AM (Carrier rules tab)",
  },
  {
    q: "True or false: in the Call Script, you pre-qualify the driver before you present the job.",
    options: ["True", "False"],
    answer: 0,
    why: "Pre-qualification comes first, so you only present a job the driver can get.",
    lesson: "Call Script",
  },
  {
    q: "True or false: submitting the application is the end of your work on that driver.",
    options: ["True", "False"],
    answer: 1,
    why: "Submitting isn't the finish line. Keep following up until they're hired or say no.",
    lesson: "Follow Up calls",
  },
];

// ---- Paper version (Word download). The answer options are shuffled once
// with a fixed seed, so the printed test and the answer key always match and
// a paper test can be graded in the app by letter.

const LETTERS = ["A", "B", "C", "D"];

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PAPER_TEST = (() => {
  const rand = seeded(20261109);
  return ACADEMY_TEST.map((q) => {
    const order = q.options.map((_, i) => i);
    if (q.options.length === 2) return q; // true / false stays in that order
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  });
})();

export const letter = (i: number) => LETTERS[i] ?? "?";

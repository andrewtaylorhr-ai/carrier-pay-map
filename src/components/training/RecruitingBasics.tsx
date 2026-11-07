"use client";

import { useState } from "react";

const TERMS: [string, string][] = [
  ["CDL Class A", "Commercial driver's license for combination vehicles over 26,001 lbs (tractor-trailers). Every driver we recruit needs one, or must be in school for one."],
  ["OTR (Over the Road)", "Long-haul, crosses many states. Out 2–3 weeks at a time, highest miles, least home time."],
  ["Regional", "Runs inside one region of the country. Usually home weekly or every few days."],
  ["Dedicated", "Hauls for one customer (e.g. Walmart, Home Depot) on set lanes. Steady pay and predictable home time."],
  ["Local", "Home daily. Shorter runs, often more physical work (unloading, multiple stops)."],
  ["Home time", "How often and for how long the driver is home: daily, weekly, every two weeks, 34-hour reset, etc."],
  ["CPM", "Cents per mile, how most OTR/regional drivers are paid. Weekly pay = miles × CPM (plus extras)."],
  ["Sign-on bonus", "Extra money for joining, usually paid in parts over the first weeks or months, not all at once."],
  ["Solo / Team", "Solo = one driver. Team = two drivers share one truck and drive in shifts, so the truck keeps moving and pay is higher."],
  ["Trainee / Student", "New CDL graduate with little or no experience. Only some accounts accept them; check the account's experience rule."],
  ["Experience (months)", "Verifiable Class A driving time. Many accounts need 3, 6 or 12 months."],
  ["MVR", "Motor Vehicle Record: the driver's tickets, accidents and suspensions. Carriers check it first."],
  ["PSP", "Pre-employment Screening Program: FMCSA crash and inspection history for the last 5 / 3 years."],
  ["DAC report", "Employment history report from past trucking jobs. Shows terminations and gaps."],
  ["Clearinghouse", "FMCSA Drug & Alcohol Clearinghouse. A failed or refused test blocks hiring until the return-to-duty process is done."],
  ["DOT medical card", "Medical certificate a driver must hold to drive commercially (valid for up to 2 years)."],
  ["Endorsements", "Extra license permissions: H = Hazmat, N = Tanker, T = Doubles/Triples, X = Hazmat + Tanker."],
  ["Drop & hook / No-touch", "Driver drops an empty trailer and hooks a loaded one / never unloads freight by hand. Drivers like both."],
  ["Hours of Service (HOS)", "Federal driving limits: 11 hours of driving inside a 14-hour window, and a 34-hour restart to reset the week."],
  ["Submission", "A qualified driver we send to a carrier account. Hires come from good submissions."],
];

const STEPS: [string, string][] = [
  ["Prepare", "Open your Strategy Plan. Know your states, your carriers and the accounts ticked for you. Start calling in the East and move West (see the call plan on your map picture)."],
  ["Open the call", "Introduce yourself and the company, say why you are calling, and ask if they have 2 minutes."],
  ["Qualify", "CDL Class A? Experience in months? Where do they live (city/ZIP)? Any tickets or accidents in 3 years? Any failed drug test? Endorsements?"],
  ["Find what they want", "Home time, pay, type of freight, solo or team, how soon they can start. Listen more than you talk."],
  ["Match", "Use the Pay Map and your account list to find 1–2 accounts that hire in their area and fit what they want. Explain pay and home time honestly."],
  ["Submit", "Get permission, collect what the carrier needs, and submit the driver to the account. Log it in the Daily Tracker."],
  ["Follow up", "Call back within 24 hours. Keep the driver warm until orientation. Many drivers are lost because nobody followed up."],
];

const SCRIPT = `Hi, is this [Driver name]? This is [Your name] with Class A Recruiting. I'm calling about CDL Class A driving jobs in [their area]. Do you have two minutes?

Great. Are you driving right now, or looking for something new?

Quick questions so I only send you jobs that fit:
• How long have you had your Class A, and how many months of driving experience?
• What city or ZIP are you in?
• What matters most to you: home time, pay, or the type of freight?
• Any tickets, accidents or failed drug tests in the last 3 years?

Based on what you told me, [Carrier] has a [Local / Regional / Dedicated / OTR] job out of [city]. It pays about [$ weekly] and you'd be home [home time]. Does that sound like something you'd want?

Perfect. With your OK, I'll send your info to their recruiter today. You should hear from them within [time]. I'll also call you tomorrow to make sure everything is moving. What's the best time to reach you?`;

const FAQ: [string, string][] = [
  ["How much will I make?", "Give the account's weekly pay range from the Pay Map, and say it depends on miles and the lane. Never promise a number the account doesn't show."],
  ["How often will I be home?", "Read the account's home time exactly. If the driver needs to be home daily or weekly, only show Local, Dedicated or Regional accounts."],
  ["I'm a new CDL graduate. Can I get hired?", "Yes, at accounts that accept trainees or students. Check the Experience line on the account before you pitch it."],
  ["I have a ticket / accident on my record.", "Ask what and when. One minor ticket is often fine; serious violations (DUI, reckless driving, recent preventable accidents) usually are not. Let the carrier decide; don't guess."],
  ["Is there a sign-on bonus?", "Some accounts have one. Explain it's paid in parts over time, and give the account's real schedule."],
  ["Do I have to unload the truck?", "Check the account notes. Dedicated and local jobs sometimes require unloading; many OTR jobs are no-touch."],
  ["Can I bring a pet or a passenger?", "Policies differ by carrier. Don't answer from memory; ask the carrier's recruiter and call the driver back."],
  ["Why should I trust you?", "Be honest: you work with several carriers and your job is to find the one that fits them, not to push one company."],
];

export function RecruitingBasics() {
  const [open, setOpen] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";
  const h2 = "text-[15px] font-bold text-[var(--cpm-text)] px-4 py-3 border-b border-[var(--cpm-border)]";

  return (
    <div className="grid gap-3 xl:grid-cols-2 items-start">
      <section className={`${card} xl:row-span-2`}>
        <h2 className={h2}>Words you will hear every day</h2>
        <dl className="divide-y divide-[var(--cpm-border)]">
          {TERMS.map(([t, d]) => (
            <div key={t} className="grid grid-cols-[170px_1fr] gap-3 px-4 py-2 text-[12.5px]">
              <dt className="font-semibold text-[var(--cpm-accent-strong)]">{t}</dt>
              <dd className="text-[var(--cpm-text-dim)]">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={card}>
        <h2 className={h2}>The call, step by step</h2>
        <ol className="px-4 py-3 flex flex-col gap-2.5">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)] text-[12px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="text-[12.5px]">
                <div className="font-semibold text-[var(--cpm-text)]">{t}</div>
                <div className="text-[var(--cpm-text-dim)]">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={card}>
        <div className="flex items-center border-b border-[var(--cpm-border)] pr-3">
          <h2 className="text-[15px] font-bold text-[var(--cpm-text)] px-4 py-3">Sample call script</h2>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(SCRIPT).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="ml-auto text-[11.5px] font-semibold px-2.5 py-1 rounded-md border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
          >
            {copied ? "Copied ✓" : "Copy script"}
          </button>
        </div>
        <pre className="px-4 py-3 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--cpm-text-dim)] font-[inherit]">{SCRIPT}</pre>
      </section>

      <section className={`${card} xl:col-span-2`}>
        <h2 className={h2}>Questions drivers ask, and how to answer</h2>
        <div className="divide-y divide-[var(--cpm-border)]">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--cpm-text)] hover:bg-[var(--cpm-panel-alt)]"
              >
                <span className="text-[var(--cpm-text-faint)] text-[11px] w-3">{open === i ? "▼" : "▶"}</span>
                &ldquo;{q}&rdquo;
              </button>
              {open === i && <div className="px-4 pb-3 pl-9 text-[12.5px] text-[var(--cpm-text-dim)]">{a}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

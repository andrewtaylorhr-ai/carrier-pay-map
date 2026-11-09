// The two Word files for the Academy test: the test to hand to recruiters
// (no answers) and the answer key for the manager.
import { PAPER_TEST, TEST_PASS, letter } from "@/lib/academy-test";
import { type DocBlock, downloadDocx } from "@/lib/docx";

const TITLE = "Class A Recruiting Academy · Test";

export function downloadTestDoc() {
  const blocks: DocBlock[] = [
    { kind: "title", text: TITLE },
    { kind: "para", text: "Name: ______________________________          Date: ______________", spaceAfter: 120 },
    {
      kind: "para",
      text: `${PAPER_TEST.length} questions from the Academy lessons. Circle or write ONE letter (A, B, C or D) for each question. You pass with ${TEST_PASS}% or more.`,
      italic: true,
      spaceAfter: 240,
    },
  ];
  PAPER_TEST.forEach((q, i) => {
    blocks.push({ kind: "para", text: `${i + 1}. ${q.q}`, bold: true, spaceAfter: 60 });
    q.options.forEach((o, oi) => blocks.push({ kind: "para", text: `${letter(oi)})  ${o}`, indent: true, spaceAfter: 30 }));
    blocks.push({ kind: "para", text: "Answer: ______", indent: true, spaceAfter: 220 });
  });
  blocks.push({ kind: "pageBreak" });
  blocks.push({ kind: "heading", text: "Answer sheet" });
  blocks.push({ kind: "para", text: "Name: ______________________________", spaceAfter: 160 });
  for (let i = 0; i < PAPER_TEST.length; i += 5) {
    const row = PAPER_TEST.slice(i, i + 5)
      .map((_, k) => `${String(i + k + 1).padStart(2, " ")}. ____`)
      .join("        ");
    blocks.push({ kind: "para", text: row, spaceAfter: 140 });
  }
  downloadDocx("Academy Test.docx", blocks);
}

export function downloadAnswerKeyDoc() {
  const blocks: DocBlock[] = [
    { kind: "title", text: `${TITLE} · ANSWER KEY` },
    { kind: "para", text: "For the manager only. Do not share with recruiters.", bold: true, color: "C0392B", spaceAfter: 160 },
    { kind: "heading", text: "Quick key" },
  ];
  for (let i = 0; i < PAPER_TEST.length; i += 7) {
    blocks.push({
      kind: "para",
      text: PAPER_TEST.slice(i, i + 7)
        .map((q, k) => `${i + k + 1}-${letter(q.answer)}`)
        .join("     "),
      spaceAfter: 60,
    });
  }
  blocks.push({
    kind: "para",
    text: `Pass mark: ${TEST_PASS}% = ${Math.ceil((PAPER_TEST.length * TEST_PASS) / 100)} of ${PAPER_TEST.length} correct.`,
    italic: true,
    spaceAfter: 240,
  });
  blocks.push({ kind: "heading", text: "Answers explained" });
  PAPER_TEST.forEach((q, i) => {
    blocks.push({ kind: "para", text: `${i + 1}. ${q.q}`, bold: true, spaceAfter: 40 });
    blocks.push({ kind: "runs", indent: true, runs: [{ text: `${letter(q.answer)})  ${q.options[q.answer]}`, bold: true, color: "1E7B34" }] });
    blocks.push({ kind: "para", text: q.why, indent: true, spaceAfter: 20 });
    blocks.push({ kind: "para", text: `Lesson: ${q.lesson}`, italic: true, color: "777777", indent: true, spaceAfter: 180 });
  });
  downloadDocx("Academy Test - Answer Key.docx", blocks);
}

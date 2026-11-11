// Word files for the knowledge checks: the checks to hand to recruiters (no
// answers), one check or all of them, and the answer key for the manager.
import { letter } from "@/lib/academy-test";
import { type DocBlock, downloadDocx } from "@/lib/docx";
import { KNOWLEDGE_CHECKS, type KnowledgeCheck } from "@/lib/training-content";

const TITLE = "Class A Recruiting Academy · Knowledge checks";

function checkBlocks(c: KnowledgeCheck): DocBlock[] {
  const blocks: DocBlock[] = [
    { kind: "heading", text: c.title },
    {
      kind: "para",
      text: c.explain
        ? `${c.questions.length} scenarios. Circle ONE action for each, then write why it's the right one.`
        : `${c.questions.length} questions. Circle or write ONE letter for each question.`,
      italic: true,
      spaceAfter: 200,
    },
  ];
  c.questions.forEach((q, i) => {
    blocks.push({ kind: "para", text: `${i + 1}. ${q.q}`, bold: true, spaceAfter: 60 });
    q.options.forEach((o, oi) => blocks.push({ kind: "para", text: `${letter(oi)})  ${o}`, indent: true, spaceAfter: 30 }));
    blocks.push({ kind: "para", text: "Answer: ______", indent: true, spaceAfter: c.explain ? 60 : 220 });
    if (c.explain) {
      blocks.push({ kind: "para", text: "Why: ____________________________________________________________", indent: true, spaceAfter: 60 });
      blocks.push({ kind: "para", text: "____________________________________________________________________", indent: true, spaceAfter: 220 });
    }
  });
  return blocks;
}

const nameLine: DocBlock = { kind: "para", text: "Name: ______________________________          Date: ______________", spaceAfter: 200 };
const fileName = (title: string) => title.replace(/[\\/:*?"<>|]/g, "-");

// One check, or all of them (each on its own page), for recruiters.
export function downloadChecksDoc(check?: KnowledgeCheck) {
  const checks = check ? [check] : KNOWLEDGE_CHECKS;
  const blocks: DocBlock[] = [{ kind: "title", text: check ? `${TITLE} · ${check.title}` : TITLE }, nameLine];
  checks.forEach((c, i) => {
    if (i) blocks.push({ kind: "pageBreak" }, nameLine);
    blocks.push(...checkBlocks(c));
  });
  downloadDocx(check ? `Knowledge Check - ${fileName(check.title)}.docx` : "Knowledge Checks.docx", blocks);
}

export function downloadChecksAnswerKeyDoc() {
  const blocks: DocBlock[] = [
    { kind: "title", text: `${TITLE} · ANSWER KEY` },
    { kind: "para", text: "For the manager only. Do not share with recruiters.", bold: true, color: "C0392B", spaceAfter: 200 },
  ];
  KNOWLEDGE_CHECKS.forEach((c) => {
    blocks.push({ kind: "heading", text: c.title });
    blocks.push({
      kind: "para",
      text: c.questions.map((q, i) => `${i + 1}-${letter(q.answer)}`).join("     "),
      bold: true,
      spaceAfter: 120,
    });
    c.questions.forEach((q, i) => {
      blocks.push({ kind: "para", text: `${i + 1}. ${q.q}`, bold: true, spaceAfter: 40 });
      blocks.push({ kind: "runs", indent: true, runs: [{ text: `${letter(q.answer)})  ${q.options[q.answer]}`, bold: true, color: "1E7B34" }] });
      blocks.push({ kind: "para", text: q.why, indent: true, spaceAfter: 20 });
      blocks.push({ kind: "para", text: `Lesson: ${q.lesson}`, italic: true, color: "777777", indent: true, spaceAfter: 160 });
    });
  });
  downloadDocx("Knowledge Checks - Answer Key.docx", blocks);
}

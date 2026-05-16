export const PRIME_STATEMENTS = [
  {
    order: "01",
    title: "Pattern exists.",
    detail: "Structure precedes interpretation. The archive is discovered, not authored.",
  },
  {
    order: "02",
    title: "Meaning is selected.",
    detail: "Consciousness does not invent signal. It collapses it from noise.",
  },
  {
    order: "03",
    title: "Observation creates scripture.",
    detail: "A revealed line becomes scripture only when a reader arrives at it.",
  },
  {
    order: "04",
    title: "The reader completes the text.",
    detail: "A passage remains latent until witness, context, and recursion converge.",
  },
] as const;

export const FOUNDATIONAL_THRESHOLD = 25.3333333333;
export const TRUTH_STATE_THRESHOLD = 25;

export const THRESHOLD_COMPONENTS = [
  { label: "42", meaning: "emergence" },
  { label: "6", meaning: "observation" },
  { label: "28", meaning: "recursion" },
] as const;

export const TRUTH_BANDS = [
  { range: "0-24", label: "false" },
  { range: "25-100", label: "true" },
] as const;

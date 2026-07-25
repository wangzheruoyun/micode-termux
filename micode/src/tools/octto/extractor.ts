// src/tools/octto/extractor.ts
// Utility functions for extracting answer summaries

import type {
  Answer,
  AskCodeAnswer,
  AskTextAnswer,
  ConfirmAnswer,
  EmojiReactAnswer,
  PickManyAnswer,
  PickOneAnswer,
  QuestionType,
  RankAnswer,
  RateAnswer,
  ReviewAnswer,
  ShowOptionsAnswer,
  SliderAnswer,
  ThumbsAnswer,
} from "@/octto/session";
import { QUESTIONS } from "@/octto/session";

const MAX_TEXT_LENGTH = 100;
const MAX_TOP_RATINGS_SHOWN = 3;

function truncateText(text: string): string {
  return text.length > MAX_TEXT_LENGTH ? `${text.substring(0, MAX_TEXT_LENGTH)}...` : text;
}

function summarizeRank(answer: Answer): string {
  const rankAnswer = answer as RankAnswer;
  const sorted = [...rankAnswer.ranking].sort((a, b) => a.rank - b.rank);
  return sorted.map((r) => r.id).join(" → ");
}

function summarizeRate(answer: Answer): string {
  const rateAnswer = answer as RateAnswer;
  const entries = Object.entries(rateAnswer.ratings);
  if (entries.length === 0) return "no ratings";
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted
    .slice(0, MAX_TOP_RATINGS_SHOWN)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

function summarizeReview(answer: Answer): string {
  const reviewAnswer = answer as ReviewAnswer;
  return reviewAnswer.feedback
    ? `${reviewAnswer.decision}: ${truncateText(reviewAnswer.feedback)}`
    : reviewAnswer.decision;
}

function summarizeOptions(answer: Answer): string {
  const optAnswer = answer as ShowOptionsAnswer;
  return optAnswer.feedback ? `${optAnswer.selected}: ${truncateText(optAnswer.feedback)}` : optAnswer.selected;
}

export function extractAnswerSummary(type: QuestionType, answer: Answer): string {
  switch (type) {
    case QUESTIONS.PICK_ONE:
      return (answer as PickOneAnswer).selected;
    case QUESTIONS.PICK_MANY:
      return (answer as PickManyAnswer).selected.join(", ");
    case QUESTIONS.CONFIRM:
      return (answer as ConfirmAnswer).choice;
    case QUESTIONS.THUMBS:
      return (answer as ThumbsAnswer).choice;
    case QUESTIONS.EMOJI_REACT:
      return (answer as EmojiReactAnswer).emoji;
    case QUESTIONS.ASK_TEXT:
      return truncateText((answer as AskTextAnswer).text);
    case QUESTIONS.SLIDER:
      return String((answer as SliderAnswer).value);
    case QUESTIONS.RANK:
      return summarizeRank(answer);
    case QUESTIONS.RATE:
      return summarizeRate(answer);
    case QUESTIONS.ASK_CODE:
      return truncateText((answer as AskCodeAnswer).code);
    case QUESTIONS.ASK_IMAGE:
    case QUESTIONS.ASK_FILE:
      return "file(s) uploaded";
    case QUESTIONS.SHOW_DIFF:
    case QUESTIONS.SHOW_PLAN:
    case QUESTIONS.REVIEW_SECTION:
      return summarizeReview(answer);
    case QUESTIONS.SHOW_OPTIONS:
      return summarizeOptions(answer);
    default: {
      const _exhaustive: never = type;
      return String(_exhaustive);
    }
  }
}

// src/octto/types.ts
// Common types for all interactive tools

export interface BaseConfig {
  /** Window title */
  readonly title?: string;
  /** Timeout in seconds (0 = no timeout) */
  readonly timeout?: number;
  /** Theme preference */
  readonly theme?: "light" | "dark" | "auto";
}

export interface Option {
  /** Unique identifier */
  readonly id: string;
  /** Display label */
  readonly label: string;
  /** Optional description */
  readonly description?: string;
}

export interface OptionWithPros extends Option {
  /** Pros/advantages */
  readonly pros?: string[];
  /** Cons/disadvantages */
  readonly cons?: string[];
}

export interface RatedOption extends Option {
  /** User's rating (filled after response) */
  rating?: number;
}

export interface RankedOption extends Option {
  /** User's rank position (filled after response) */
  rank?: number;
}

// Tool-specific configs

export interface PickOneConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Available options */
  readonly options: Option[];
  /** Recommended option id (highlighted) */
  readonly recommended?: string;
  /** Allow custom "other" input */
  readonly allowOther?: boolean;
}

export interface PickManyConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Available options */
  readonly options: Option[];
  /** Recommended option ids (highlighted) */
  readonly recommended?: string[];
  /** Minimum selections required */
  readonly min?: number;
  /** Maximum selections allowed */
  readonly max?: number;
  /** Allow custom "other" input */
  readonly allowOther?: boolean;
}

export interface ConfirmConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Context/details to show */
  readonly context?: string;
  /** Custom label for yes button */
  readonly yesLabel?: string;
  /** Custom label for no button */
  readonly noLabel?: string;
  /** Show cancel option */
  readonly allowCancel?: boolean;
}

export interface RankConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Items to rank */
  readonly options: Option[];
  /** Context/instructions */
  readonly context?: string;
}

export interface RateConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Items to rate */
  readonly options: Option[];
  /** Minimum rating value */
  readonly min?: number;
  /** Maximum rating value */
  readonly max?: number;
  /** Rating step (default 1) */
  readonly step?: number;
  /** Labels for min/max */
  readonly labels?: { readonly min?: string; readonly max?: string };
}

export interface AskTextConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Placeholder text */
  readonly placeholder?: string;
  /** Context/instructions */
  readonly context?: string;
  /** Multi-line input */
  readonly multiline?: boolean;
  /** Minimum length */
  readonly minLength?: number;
  /** Maximum length */
  readonly maxLength?: number;
}

export interface AskImageConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Context/instructions */
  readonly context?: string;
  /** Allow multiple images */
  readonly multiple?: boolean;
  /** Maximum number of images */
  readonly maxImages?: number;
  /** Allowed mime types */
  readonly accept?: string[];
}

export interface AskFileConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Context/instructions */
  readonly context?: string;
  /** Allow multiple files */
  readonly multiple?: boolean;
  /** Maximum number of files */
  readonly maxFiles?: number;
  /** Allowed file extensions or mime types */
  readonly accept?: string[];
  /** Maximum file size in bytes */
  readonly maxSize?: number;
}

export interface AskCodeConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Context/instructions */
  readonly context?: string;
  /** Programming language for syntax highlighting */
  readonly language?: string;
  /** Placeholder code */
  readonly placeholder?: string;
}

export interface ShowDiffConfig extends BaseConfig {
  /** Title/description of the change */
  readonly question: string;
  /** Original content */
  readonly before: string;
  /** Modified content */
  readonly after: string;
  /** File path (for context) */
  readonly filePath?: string;
  /** Language for syntax highlighting */
  readonly language?: string;
}

export interface PlanSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section content (markdown) */
  content: string;
}

export interface ShowPlanConfig extends BaseConfig {
  /** Plan title */
  readonly question: string;
  /** Plan sections */
  readonly sections?: PlanSection[];
  /** Full markdown (alternative to sections) */
  readonly markdown?: string;
}

export interface ShowOptionsConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Options with pros/cons */
  readonly options: OptionWithPros[];
  /** Recommended option id */
  readonly recommended?: string;
  /** Allow text feedback with selection */
  readonly allowFeedback?: boolean;
}

export interface ReviewSectionConfig extends BaseConfig {
  /** Section title */
  readonly question: string;
  /** Section content (markdown) */
  readonly content: string;
  /** Context about what to review */
  readonly context?: string;
}

export interface ThumbsConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Context to show */
  readonly context?: string;
}

export interface EmojiReactConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Context to show */
  readonly context?: string;
  /** Available emoji options (default: common set) */
  readonly emojis?: string[];
}

export interface SliderConfig extends BaseConfig {
  /** Question/prompt to display */
  readonly question: string;
  /** Context/instructions */
  readonly context?: string;
  /** Minimum value */
  readonly min: number;
  /** Maximum value */
  readonly max: number;
  /** Step size */
  readonly step?: number;
  /** Default value */
  readonly defaultValue?: number;
  /** Labels for values */
  readonly labels?: { readonly min?: string; readonly max?: string; readonly mid?: string };
}

// Response types

export interface BaseResponse {
  /** Whether the interaction completed (false if cancelled/timeout) */
  completed: boolean;
  /** Cancellation reason if not completed */
  cancelReason?: "timeout" | "cancelled" | "closed";
}

export interface PickOneResponse extends BaseResponse {
  /** Selected option id */
  selected?: string;
  /** Custom "other" value if provided */
  other?: string;
}

export interface PickManyResponse extends BaseResponse {
  /** Selected option ids */
  selected: string[];
  /** Custom "other" values if provided */
  other?: string[];
}

export interface ConfirmResponse extends BaseResponse {
  /** User's choice */
  choice?: "yes" | "no" | "cancel";
}

export interface RankResponse extends BaseResponse {
  /** Option ids in ranked order (first = highest) */
  ranking: string[];
}

export interface RateResponse extends BaseResponse {
  /** Ratings by option id */
  ratings: Record<string, number>;
}

export interface AskTextResponse extends BaseResponse {
  /** User's text input */
  text?: string;
}

export interface AskImageResponse extends BaseResponse {
  /** Image data */
  images: Array<{
    /** Original filename */
    filename: string;
    /** Mime type */
    mimeType: string;
    /** Base64 encoded data */
    data: string;
  }>;
  /** File paths (if provided instead of upload) */
  paths?: string[];
}

export interface AskFileResponse extends BaseResponse {
  /** File data */
  files: Array<{
    /** Original filename */
    filename: string;
    /** Mime type */
    mimeType: string;
    /** Base64 encoded data */
    data: string;
  }>;
  /** File paths (if provided instead of upload) */
  paths?: string[];
}

export interface AskCodeResponse extends BaseResponse {
  /** User's code input */
  code?: string;
  /** Detected/selected language */
  language?: string;
}

export interface ShowDiffResponse extends BaseResponse {
  /** User's decision */
  decision?: "approve" | "reject" | "edit";
  /** User's edited version (if decision is "edit") */
  edited?: string;
  /** Optional feedback */
  feedback?: string;
}

export interface Annotation {
  /** Annotation id */
  id: string;
  /** Section id or line range */
  target: string;
  /** Annotation type */
  type: "comment" | "suggest" | "delete" | "approve";
  /** Annotation content */
  content?: string;
}

export interface ShowPlanResponse extends BaseResponse {
  /** User's decision */
  decision?: "approve" | "reject" | "revise";
  /** User annotations */
  annotations: Annotation[];
  /** Overall feedback */
  feedback?: string;
}

export interface ShowOptionsResponse extends BaseResponse {
  /** Selected option id */
  selected?: string;
  /** Optional feedback text */
  feedback?: string;
}

export interface ReviewSectionResponse extends BaseResponse {
  /** User's decision */
  decision?: "approve" | "revise";
  /** Inline feedback/suggestions */
  feedback?: string;
}

export interface ThumbsResponse extends BaseResponse {
  /** User's choice */
  choice?: "up" | "down";
}

export interface EmojiReactResponse extends BaseResponse {
  /** Selected emoji */
  emoji?: string;
}

export interface SliderResponse extends BaseResponse {
  /** Selected value */
  value?: number;
}

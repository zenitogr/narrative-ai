export interface Suggestion {
    suggestion_text: string;
  }
  
  export interface UserChoice {
    suggestions: Suggestion;
  }
  
  export interface StepData {
    id: number;
    parent_step_id: number | null;
    user_choices: UserChoice[];
    suggestions: Suggestion[];
  }
  
  export interface HistoryItem {
    id: number;
    parent_step_id: number | null;
    user_choices: UserChoice[];
    suggestions: Suggestion[];
  }
  
  export interface AppContextType {
    suggestions: string[];
    selectedSuggestions: string[];
    loading: boolean;
    userComment: string;
    handleCheckboxChange: (suggestion: string) => void;
    getSuggestions: (prompt?: string) => void;
    submitChoices: (isFork?: boolean) => void;
    setUserComment: (comment: string) => void;
  }
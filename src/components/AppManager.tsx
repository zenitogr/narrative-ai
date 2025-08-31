"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function AppManager({ children }: { children: React.ReactNode }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<number | null>(null);
  const [userComment, setUserComment] = useState("");

  const getSuggestions = async (prompt?: string) => {
    setLoading(true);
    setSuggestions([]);
    setSelectedSuggestions([]);
    const model = localStorage.getItem("suggestionModel");
    
    let finalPrompt = prompt || "Give me 10 varied and interesting suggestions for what I could do next. Return them as a numbered list inside <suggestions> tags.";
    if (userComment) {
      finalPrompt += `\n\nMy additional thoughts: ${userComment}`;
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        prompt: finalPrompt,
        model: model
      }),
    });

    if (!response.body) {
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let contentResponse = "";
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === "") continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.choices && parsed.choices[0].delta.content) {
            contentResponse += parsed.choices[0].delta.content;
          }
        } catch (e) {
          // Not a JSON line, probably just text
        }
      }
    }
    
    const suggestionMatch = contentResponse.match(/<suggestions>([\s\S]*?)<\/suggestions>/);
    if (suggestionMatch && suggestionMatch[1]) {
      setSuggestions(suggestionMatch[1].trim().split('\n').filter(s => s.trim().length > 0 && !s.trim().startsWith("<")));
    }

    setLoading(false);
    setUserComment(""); // Clear comment after use
  };

  const submitChoices = async (isFork = false) => {
    const response = await fetch('/api/choice', {
      method: 'POST',
      body: JSON.stringify({
        suggestions: suggestions,
        choices: selectedSuggestions,
        parentStepId: currentStepId,
        isFork,
      }),
    });
    const { stepId } = await response.json();
    setCurrentStepId(stepId);

    window.dispatchEvent(new Event('choice-made'));

    const nextPrompt = `Based on my previous choices (${selectedSuggestions.join(', ')}), give me 10 new suggestions. Return them as a numbered list inside <suggestions> tags.`;
    getSuggestions(nextPrompt);
  };

  useEffect(() => {
    const handleVersionControl = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, stepId } = customEvent.detail;

      const response = await fetch(`/api/history?stepId=${stepId}`);
      const stepData = await response.json();

      if (type === 'fork') {
        setCurrentStepId(stepId);
        const nextPrompt = `Based on my previous choices (${stepData.user_choices.map((c: any) => c.suggestions.suggestion_text).join(', ')}), give me 10 new suggestions. Return them as a numbered list inside <suggestions> tags.`;
        getSuggestions(nextPrompt);
      } else if (type === 'version') {
        setSuggestions(stepData.suggestions.map((s: any) => s.suggestion_text));
        setSelectedSuggestions([]);
        setCurrentStepId(stepData.parent_step_id);
      } else if (type === 'continue') {
        const historyResponse = await fetch('/api/history');
        const fullHistory: any[] = await historyResponse.json();
        const stepMap = new Map(fullHistory.map((item) => [item.id, item]));
        let currentStep = stepMap.get(stepId);
        const historyToContinue: any[] = [];
        while(currentStep) {
          historyToContinue.unshift(currentStep);
          currentStep = stepMap.get(currentStep.parent_step_id);
        }
        const choiceText = historyToContinue.flatMap(h => h.user_choices.map((c: any) => c.suggestions.suggestion_text)).join(', ');
        const nextPrompt = `Based on my previous choices (${choiceText}), give me 10 new suggestions. Return them as a numbered list inside <suggestions> tags.`;
        getSuggestions(nextPrompt);
        setCurrentStepId(stepId);
      }
      
      if (window.location.pathname !== '/') {
        router.push('/');
      }
    };

    window.addEventListener('version-control', handleVersionControl);
    return () => window.removeEventListener('version-control', handleVersionControl);
  }, []);

  const router = useRouter();
  const contextValue = {
    suggestions,
    selectedSuggestions,
    loading,
    userComment,
    handleCheckboxChange: (suggestion: string) => {
      setSelectedSuggestions(prev =>
        prev.includes(suggestion)
          ? prev.filter(s => s !== suggestion)
          : [...prev, suggestion]
      );
    },
    getSuggestions,
    submitChoices,
    setUserComment,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export const AppContext = React.createContext<any>(null);
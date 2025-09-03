"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { HistoryItem } from "@/lib/types";

function StatsContent() {
  const searchParams = useSearchParams();
  const stepId = searchParams.get('stepId');
  const mode = searchParams.get('mode') || 'total'; // 'total', 'item', 'full'
  const cacheBuster = searchParams.get('cacheBuster');
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const userId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'; // Dummy user ID
  const isFetching = useRef(false);

  useEffect(() => {
    const getAnalysis = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      setLoading(true);
      
      if (!cacheBuster) {
        // Check if analysis already exists
        const analysisCheckResponse = await fetch(`/api/analysis?stepId=${stepId}&mode=${mode}`);
        if (analysisCheckResponse.ok) {
          const data = await analysisCheckResponse.json();
          if (data.analysis) {
            setAnalysis(data.analysis);
            setLoading(false);
            isFetching.current = false;
            return;
          }
        }
      }

      const historyResponse = await fetch('/api/history');
      const fullHistory: HistoryItem[] = await historyResponse.json();

      let relevantHistory: HistoryItem[] = fullHistory;
      if (stepId) {
        if (mode === 'item') {
          relevantHistory = fullHistory.filter((item) => item.id === parseInt(stepId));
        } else if (mode === 'full') {
          const stepMap = new Map(fullHistory.map((item) => [item.id, item]));
          let currentStep = stepMap.get(parseInt(stepId));
          relevantHistory = [];
          while(currentStep) {
            relevantHistory.unshift(currentStep);
            currentStep = stepMap.get(currentStep.parent_step_id!);
          }
        }
      }
      
      const model = localStorage.getItem("analysisModel");
      const analysisPayload = relevantHistory.map(item => ({
        id: item.id,
        user_choices: item.user_choices,
      }));

      const analysisResponse = await fetch('/api/analysis', {
        method: 'POST',
        body: JSON.stringify({ userId, stepId: stepId || 'total', history: analysisPayload, model, mode }),
      });

      const data = await analysisResponse.json();
      setAnalysis(data.analysis);
      setLoading(false);
      isFetching.current = false;
    };

    getAnalysis();
  }, [stepId, mode, cacheBuster]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-[800px]">
        <CardHeader>
          <CardTitle>AI-Powered Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <motion.div
                className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                role="status"
              />
              <span>Analyzing...</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose dark:prose-invert max-w-none"
            >
              {analysis}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StatsContent />
    </Suspense>
  );
}
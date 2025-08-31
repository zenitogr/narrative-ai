"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useContext } from "react";
import { AppContext } from "@/components/AppManager";

export default function Home() {
  const {
    suggestions,
    selectedSuggestions,
    loading,
    userComment,
    handleCheckboxChange,
    getSuggestions,
    submitChoices,
    setUserComment,
  } = useContext(AppContext);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>What should I do next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Steer the next suggestions with your comments..."
            />
            <Button onClick={() => getSuggestions()} disabled={loading}>
              {loading && <motion.div
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] text-white"
                role="status"
              />}
              {loading ? "Generating..." : "Get Suggestions"}
            </Button>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                {suggestions.map((suggestion: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id={`suggestion-${index}`}
                      onCheckedChange={() => handleCheckboxChange(suggestion)}
                    />
                    <label htmlFor={`suggestion-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {suggestion}
                    </label>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            {suggestions.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={() => submitChoices()} disabled={selectedSuggestions.length === 0}>
                  Submit Choices
                </Button>
                <Button onClick={() => submitChoices(true)} disabled={selectedSuggestions.length === 0} variant="outline">
                  Fork from this Choice
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

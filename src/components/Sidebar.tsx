"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Share2, BarChart, Settings, Home, Play } from "lucide-react";
import Link from "next/link";

import { ChevronDown, ChevronRight } from "lucide-react";

interface HistoryItem {
  id: number;
  created_at: string;
  is_fork: boolean;
  parent_step_id: number | null;
  user_choices: {
    suggestions: {
      suggestion_text: string;
    };
  }[];
  children?: HistoryItem[];
}

const HistoryNode = ({ item }: { item: HistoryItem }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ml-4"
    >
      <Card className={item.is_fork ? 'border-blue-500' : ''}>
        <CardContent className="p-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {item.children && item.children.length > 0 && (
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'My Narrative AI Checkpoint',
                    text: `Check out my choices: ${item.user_choices.map(c => c.suggestions.suggestion_text).join(', ')}`,
                    url: window.location.href,
                  });
                }
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <ul className="list-disc pl-8">
            {item.user_choices.map((choice, index) => (
              <li key={index} className="text-sm">{choice.suggestions.suggestion_text}</li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('version-control', { detail: { type: 'version', stepId: item.id } }))}>Version</Button>
            <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('version-control', { detail: { type: 'fork', stepId: item.id } }))}>Fork</Button>
            <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('version-control', { detail: { type: 'continue', stepId: item.id } }))}>
              <Play className="h-4 w-4 mr-2" />
              Continue
            </Button>
            <Link href={`/stats?stepId=${item.id}&mode=item`}>
              <Button size="sm" variant="ghost">Stats (Item)</Button>
            </Link>
            <Link href={`/stats?stepId=${item.id}&mode=full`}>
              <Button size="sm" variant="ghost">Stats (Full)</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      {isOpen && item.children && (
        <div className="mt-2">
          {item.children.map(child => <HistoryNode key={child.id} item={child} />)}
        </div>
      )}
    </motion.div>
  );
};

export default function Sidebar() {
  const [historyTree, setHistoryTree] = useState<HistoryItem[]>([]);
  const [statsUrl, setStatsUrl] = useState("/stats");

  useEffect(() => {
    setStatsUrl(`/stats?cacheBuster=${Date.now()}`);
    const fetchAndBuildTree = async () => {
      const response = await fetch('/api/history');
      const flatHistory: HistoryItem[] = await response.json();
      
      const historyMap: { [key: number]: HistoryItem } = {};
      flatHistory.forEach(item => {
        historyMap[item.id] = { ...item, children: [] };
      });

      const tree: HistoryItem[] = [];
      flatHistory.forEach(item => {
        if (item.parent_step_id && historyMap[item.parent_step_id]) {
          historyMap[item.parent_step_id].children?.push(historyMap[item.id]);
        } else {
          tree.push(historyMap[item.id]);
        }
      });
      
      setHistoryTree(tree);
    };

    fetchAndBuildTree();
    window.addEventListener('choice-made', fetchAndBuildTree);
    return () => window.removeEventListener('choice-made', fetchAndBuildTree);
  }, []);

  return (
    <Card className="w-[350px] h-full overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10">
        <CardTitle>History</CardTitle>
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={statsUrl}>
            <Button variant="ghost" size="icon">
              <BarChart className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-2">
        {historyTree.map(item => (
          <HistoryNode key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
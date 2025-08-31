"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useState, useEffect } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
}

export default function SettingsPage() {
  const [providerUrl, setProviderUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [suggestionModel, setSuggestionModel] = useState("");
  const [analysisModel, setAnalysisModel] = useState("");
  const [openSuggestion, setOpenSuggestion] = useState(false);
  const [openAnalysis, setOpenAnalysis] = useState(false);

  useEffect(() => {
    setProviderUrl(localStorage.getItem("customProviderUrl") || "");
    setApiKey(localStorage.getItem("customApiKey") || "");
    setSuggestionModel(localStorage.getItem("suggestionModel") || "");
    setAnalysisModel(localStorage.getItem("analysisModel") || "");

    const fetchAndSelectModels = async () => {
      const modelsResponse = await fetch('/api/models');
      const modelsData = await modelsResponse.json();
      setModels(modelsData);

      if (!localStorage.getItem("suggestionModel") || !localStorage.getItem("analysisModel")) {
        const smartSelectResponse = await fetch('/api/smart-select', {
          method: 'POST',
          body: JSON.stringify({ models: modelsData }),
        });
        const selectedModels = await smartSelectResponse.json();
        setSuggestionModel(selectedModels.suggestionModel);
        setAnalysisModel(selectedModels.analysisModel);
        localStorage.setItem("suggestionModel", selectedModels.suggestionModel);
        localStorage.setItem("analysisModel", selectedModels.analysisModel);
      }
    };
    fetchAndSelectModels();
  }, []);

  const saveSettings = () => {
    localStorage.setItem("customProviderUrl", providerUrl);
    localStorage.setItem("customApiKey", apiKey);
    localStorage.setItem("suggestionModel", suggestionModel);
    localStorage.setItem("analysisModel", analysisModel);
    alert("Settings saved!");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>AI Provider Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="provider-url">Provider URL</Label>
              <Input
                id="provider-url"
                value={providerUrl}
                onChange={(e) => setProviderUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div>
              <Label>Suggestion Model</Label>
              <Popover open={openSuggestion} onOpenChange={setOpenSuggestion}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openSuggestion} className="w-full justify-between">
                    {suggestionModel || "Select suggestion model..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[550px] p-0">
                  <Command>
                    <CommandInput placeholder="Search model..." />
                    <CommandEmpty>No model found.</CommandEmpty>
                    <CommandGroup>
                      {models.map((model) => (
                        <CommandItem
                          key={model.id}
                          onSelect={(currentValue) => {
                            setSuggestionModel(currentValue === suggestionModel ? "" : currentValue);
                            setOpenSuggestion(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", suggestionModel === model.id ? "opacity-100" : "opacity-0")} />
                          {model.id}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Analysis Model</Label>
              <Popover open={openAnalysis} onOpenChange={setOpenAnalysis}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openAnalysis} className="w-full justify-between">
                    {analysisModel || "Select analysis model..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[550px] p-0">
                  <Command>
                    <CommandInput placeholder="Search model..." />
                    <CommandEmpty>No model found.</CommandEmpty>
                    <CommandGroup>
                      {models.map((model) => (
                        <CommandItem
                          key={model.id}
                          onSelect={(currentValue) => {
                            setAnalysisModel(currentValue === analysisModel ? "" : currentValue);
                            setOpenAnalysis(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", analysisModel === model.id ? "opacity-100" : "opacity-0")} />
                          {model.id}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={saveSettings}>Save Settings</Button>
            <Button variant="outline" onClick={() => {
              localStorage.removeItem("customProviderUrl");
              localStorage.removeItem("customApiKey");
              localStorage.removeItem("suggestionModel");
              localStorage.removeItem("analysisModel");
              setProviderUrl("");
              setApiKey("");
              setSuggestionModel("");
              setAnalysisModel("");
              alert("Settings reverted to default.");
            }}>
              Revert to Default Provider
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="w-[600px] mt-4">
        <CardHeader>
          <CardTitle>Currently Selected Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p><strong>Suggestion Model:</strong> {suggestionModel || "Not Set"}</p>
            <p><strong>Analysis Model:</strong> {analysisModel || "Not Set"}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
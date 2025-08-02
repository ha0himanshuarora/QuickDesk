"use client";

import { useState } from "react";
import {
  suggestArticlesAgents,
  type SuggestArticlesAgentsOutput,
} from "@/ai/flows/suggest-articles-agents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WandSparkles, Book, UserCheck, AlertTriangle } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface AiSuggestionsProps {
  subject: string;
  description: string;
}

export function AiSuggestions({ subject, description }: AiSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestArticlesAgentsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await suggestArticlesAgents({ subject, description });
      setSuggestions(result);
    } catch (err) {
      setError("Failed to get AI suggestions. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-secondary/50 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-lg">
          <WandSparkles className="h-5 w-5 text-accent" />
          Intelligent Assistance
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions for relevant articles and agents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-6 w-1/2 mt-4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : suggestions ? (
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Book className="h-4 w-4 text-primary" />
                Suggested Articles
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                {suggestions.suggestedArticles.map((article, i) => (
                  <li key={i}>{article}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2 mt-4">
                <UserCheck className="h-4 w-4 text-primary" />
                Suggested Agents
              </h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                {suggestions.suggestedAgents.map((agent, i) => (
                  <li key={i}>{agent}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
         <Button onClick={handleGetSuggestions} disabled={isLoading} className="w-full" variant={suggestions ? "secondary" : "default"}>
            <WandSparkles className="mr-2 h-4 w-4" />
            {isLoading ? "Analyzing..." : suggestions ? "Regenerate Suggestions" : "Get Suggestions"}
        </Button>
      </CardFooter>
    </Card>
  );
}

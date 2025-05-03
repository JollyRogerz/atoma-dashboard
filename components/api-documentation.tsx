"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { ApiUsageDialog } from "@/components/api-usage-dialog";
import { ModelModality } from "@/lib/atoma";

const endpoints = [
  {
    name: "Chat Completions",
    endpoint: "/v1/chat/completions",
    modality: ModelModality.ChatCompletions,
    method: "POST",
  },
  {
    name: "Images Generations",
    endpoint: "/v1/images/generations",
    modality: ModelModality.ImagesGenerations,
    method: "POST",
  },
  {
    name: "Embeddings",
    endpoint: "/v1/embeddings",
    modality: ModelModality.Embeddings,
    method: "POST",
  },
];

const exampleCode = `# Chat Completion Example
curl https://api.atoma.network/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YOUR_API_KEY" \\
  -d '{
    "model": "llama-3.3-70b",
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 128,
    "stream": true
  }'

# Response Format
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "llama-3.3-70b",
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 7,
    "total_tokens": 20
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris."
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}`;

export function ApiDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);

  return (
    <Card className="h-[280px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-primary">Quick Reference</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="endpoints" className="h-[208px]">
          <div className="px-6 border-b">
            <TabsList className="h-8">
              <TabsTrigger value="endpoints" className="text-xs">
                Available Endpoints
              </TabsTrigger>
              <TabsTrigger value="example" className="text-xs">
                Example Request
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea>
            <TabsContent value="endpoints" className="p-4 m-0">
              <div className="space-y-4">
                {endpoints.map(endpoint => (
                  <div
                    key={endpoint.endpoint}
                    className="group space-y-1.5 rounded-lg bg-muted/50 p-3 cursor-pointer transition-all duration-200 hover:bg-muted/70 active:bg-muted/90 outline-none focus:ring-0"
                    onClick={() => {
                      setSelectedEndpoint(endpoint.name);
                      setIsApiDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm group-hover:text-primary transition-colors">
                        {endpoint.name}
                      </span>
                      <span className="text-primary text-xs font-mono bg-secondary dark:bg-purple-900/20 px-2 py-0.5 rounded transition-all duration-200 group-hover:bg-secondary dark:group-hover:bg-secondary group-hover:scale-105 group-active:scale-95">
                        {endpoint.method}
                      </span>
                    </div>
                    <code className="text-xs text-muted-foreground font-mono group-hover:text-foreground transition-colors">
                      {endpoint.endpoint}
                    </code>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="example" className="p-4 m-0">
              <div className="rounded-lg bg-muted/50 p-3">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre overflow-x-auto">
                  <code>{exampleCode}</code>
                </pre>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
      <ApiUsageDialog
        isOpen={isApiDialogOpen}
        onClose={() => setIsApiDialogOpen(false)}
        modelName={''}
        modality={
          endpoints.find(endpoint => endpoint.name === selectedEndpoint)?.modality || ModelModality.ChatCompletions
        }
        showModelSelector={true}
      />
    </Card>
  );
}

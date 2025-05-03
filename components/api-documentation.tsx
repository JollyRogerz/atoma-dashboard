"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { ApiUsageDialog } from "@/components/api-usage-dialog";
import { ModelModality } from "@/lib/atoma";
import { Lock, Unlock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const endpoints = [
  {
    name: "Chat Completions",
    endpoint: "/v1/chat/completions",
    confidentialEndpoint: "/v1/confidential/chat/completions",
    confidentialEndpoint: "/v1/confidential/chat/completions",
    modality: ModelModality.ChatCompletions,
    method: "POST",
  },
  {
    name: "Images Generations",
    endpoint: "/v1/images/generations",
    confidentialEndpoint: "/v1/confidential/images/generations",
    confidentialEndpoint: "/v1/confidential/images/generations",
    modality: ModelModality.ImagesGenerations,
    method: "POST",
  },
  {
    name: "Embeddings",
    endpoint: "/v1/embeddings",
    confidentialEndpoint: "/v1/confidential/embeddings",
    confidentialEndpoint: "/v1/confidential/embeddings",
    modality: ModelModality.Embeddings,
    method: "POST",
  },
];

const regularExampleCode = `# Chat Completion Example
const regularExampleCode = `# Chat Completion Example
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

const confidentialExampleCode = `# Python Example
from atoma_sdk import AtomaSDK
import os

with AtomaSDK(
    bearer_auth=os.getenv("ATOMASDK_BEARER_AUTH", ""),
) as atoma_sdk:
    completion = atoma_sdk.confidential_chat.create(
      model="meta-llama/Llama-3.3-70B-Instruct",
      messages=[
        {"role": "developer", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
      ]
    )
    print(completion.choices[0].message)

# cURL Example
curl --request POST \\
  --url https://api.atoma.network/v1/confidential/chat/completions \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
  "ciphertext": "<string>",
  "client_dh_public_key": "<string>",
  "model_name": "<string>",
  "node_dh_public_key": "<string>",
  "nonce": "<string>",
  "num_compute_units": 1,
  "plaintext_body_hash": "<string>",
  "salt": "<string>",
  "stack_small_id": 1,
  "stream": true
}'

# TypeScript Example
import { AtomaSDK } from "atoma-sdk";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const completion = await atomaSDK.confidentialChat.create({
    messages: [
      {"role": "developer", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    model: "meta-llama/Llama-3.3-70B-Instruct"
  });

  console.log(completion.choices[0]);
}

run();`;

const confidentialExampleCode = `# Python Example
from atoma_sdk import AtomaSDK
import os

with AtomaSDK(
    bearer_auth=os.getenv("ATOMASDK_BEARER_AUTH", ""),
) as atoma_sdk:
    completion = atoma_sdk.confidential_chat.create(
      model="meta-llama/Llama-3.3-70B-Instruct",
      messages=[
        {"role": "developer", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
      ]
    )
    print(completion.choices[0].message)

# cURL Example
curl --request POST \\
  --url https://api.atoma.network/v1/confidential/chat/completions \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
  "ciphertext": "<string>",
  "client_dh_public_key": "<string>",
  "model_name": "<string>",
  "node_dh_public_key": "<string>",
  "nonce": "<string>",
  "num_compute_units": 1,
  "plaintext_body_hash": "<string>",
  "salt": "<string>",
  "stack_small_id": 1,
  "stream": true
}'

# TypeScript Example
import { AtomaSDK } from "atoma-sdk";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const completion = await atomaSDK.confidentialChat.create({
    messages: [
      {"role": "developer", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    model: "meta-llama/Llama-3.3-70B-Instruct"
  });

  console.log(completion.choices[0]);
}

run();`;

export function ApiDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isConfidentialMode, setIsConfidentialMode] = useState(false);
  const [isConfidentialMode, setIsConfidentialMode] = useState(false);

  return (
    <Card className="h-[280px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary">Quick Reference</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsConfidentialMode(!isConfidentialMode)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  {isConfidentialMode ? (
                    <Lock className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle confidential compute endpoints</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
                      <div className="flex items-center gap-2">
                        {isConfidentialMode && (
                          <span className="text-xs text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                            Confidential
                          </span>
                        )}
                        <span className="text-primary text-xs font-mono bg-secondary dark:bg-purple-900/20 px-2 py-0.5 rounded transition-all duration-200 group-hover:bg-secondary dark:group-hover:bg-secondary group-hover:scale-105 group-active:scale-95">
                          {endpoint.method}
                        </span>
                      </div>
                    </div>
                    <code className="text-xs text-muted-foreground font-mono group-hover:text-foreground transition-colors">
                      {isConfidentialMode ? endpoint.confidentialEndpoint : endpoint.endpoint}
                      {isConfidentialMode ? endpoint.confidentialEndpoint : endpoint.endpoint}
                    </code>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="example" className="p-4 m-0">
              <div className="rounded-lg bg-muted/50 p-3">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre overflow-x-auto">
                  <code>{isConfidentialMode ? confidentialExampleCode : regularExampleCode}</code>
                  <code>{isConfidentialMode ? confidentialExampleCode : regularExampleCode}</code>
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
        isConfidential={isConfidentialMode}
        isConfidential={isConfidentialMode}
      />
    </Card>
  );
}

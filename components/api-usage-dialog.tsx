"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelModality } from "@/lib/atoma";

interface ApiUsageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  modality: ModelModality;
}

function getPythonCode(modelName: string, modality: ModelModality) {
  switch (modality) {
    case ModelModality.ChatCompletions:
      return `from atoma_sdk import AtomaSDK
import os

with AtomaSDK(
    bearer_auth=os.getenv("ATOMASDK_BEARER_AUTH", ""),
) as atoma_sdk:

    completion = atoma_sdk.chat.create(
      model="${modelName}",
      messages=[
        {"role": "developer", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
      ]
    )

    print(completion.choices[0].message)`;
    case ModelModality.ImagesGenerations:
      return `from atoma_sdk import AtomaSDK
import os

with AtomaSDK(
    bearer_auth=os.getenv("ATOMASDK_BEARER_AUTH", ""),
) as atoma_sdk:

    res = atoma_sdk.confidential_images.generate(
      model="${modelName}",
      prompt="A cute baby sea otter floating on its back",
      n=1,
      quality="hd",
      response_format="url",
      size="1024x1024"
    )

    print(res)`;
    case ModelModality.Embeddings:
      return `from atoma_sdk import AtomaSDK
import os

with AtomaSDK(
    bearer_auth=os.getenv("ATOMASDK_BEARER_AUTH", ""),
) as atoma_sdk:

    res = atoma_sdk.embeddings.create(
      input_="The quick brown fox jumped over the lazy dog",
      model="${modelName}",
      encoding_format="float"
    )

    print(res)`;
  }
}

function getTypescriptCode(modelName: string, modality: ModelModality) {
  switch (modality) {
    case ModelModality.ChatCompletions:
      return `import { AtomaSDK } from "atoma-sdk";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const completion = await atomaSDK.chat.create({
    messages: [
      {"role": "developer", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    model: "${modelName}"
  });

  console.log(completion.choices[0]);
}

run();`;
    case ModelModality.ImagesGenerations:
      return `import { AtomaSDK } from "atoma-sdk";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await atomaSDK.images.generate({
    model: "${modelName}",
    prompt: "A cute baby sea otter",
    n: 1,
    size: "1024x1024"
  });

  // Handle the result
  console.log(result);
}

run();`;
    case ModelModality.Embeddings:
      return `import { AtomaSDK } from "atoma-sdk";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const result = await atomaSDK.embeddings.create({
    model: "${modelName}",
    input: "The quick brown fox jumped over the lazy dog",
    encoding_format: "float",
  });

  // Handle the result
  console.log(result);
}

run();`;
  }
}
export function ApiUsageDialog({ isOpen, onClose, modelName, modality }: ApiUsageDialogProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("curl");

  // Determine the endpoint based on the model name
  const getEndpoint = () => {
    if (modality === ModelModality.ChatCompletions) {
      return "/v1/chat/completions";
    } else if (modality === ModelModality.ImagesGenerations) {
      return "/v1/images/generations";
    } else if (modality === ModelModality.Embeddings) {
      return "/v1/embeddings";
    }
  };

  // Generate the appropriate request body based on the model
  const getRequestBody = () => {
    if (modality === ModelModality.ChatCompletions) {
      return `{
  "model": "${modelName}",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "What is the capital of France?"
    }
  ],
  "max_tokens": 128,
  "temperature": 0.7,
  "top_p": 0.7,
  "top_k": 50,
  "repetition_penalty": 1.0
}`;
    } else if (modality === ModelModality.ImagesGenerations) {
      return `{
  "model": "${modelName}",
  "prompt": "A serene landscape with mountains",
  "n": 1,
  "size": "1024x1024"
}`;
    } else {
      return `{
  "model": "${modelName}",
  "input": "The food was delicious and the waiter..."
}`;
    }
  };

  // Generate curl command
  const curlCode = `curl https://api.atoma.network${getEndpoint()} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $YOUR_API_KEY" \\
-d '${getRequestBody()}'`;

  // Generate Python code
  const pythonCode = getPythonCode(modelName, modality);

  // Generate TypeScript code
  const typescriptCode = getTypescriptCode(modelName, modality);

  const copyToClipboard = () => {
    const codeMap = {
      curl: curlCode,
      python: pythonCode,
      typescript: typescriptCode,
    };

    navigator.clipboard.writeText(codeMap[activeTab as keyof typeof codeMap]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>API Usage for {modelName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="curl" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
          </TabsList>

          <TabsContent value="curl" className="relative">
            <pre className="relative rounded-lg bg-muted p-4 overflow-x-auto font-mono text-sm h-[60vh] overflow-scroll">
              {curlCode}
            </pre>
          </TabsContent>

          <TabsContent value="python" className="relative">
            <pre className="relative rounded-lg bg-muted p-4 overflow-x-auto font-mono text-sm h-[60vh] overflow-scroll">
              {pythonCode}
            </pre>
          </TabsContent>

          <TabsContent value="typescript" className="relative">
            <pre className="relative rounded-lg bg-muted p-4 overflow-x-auto font-mono text-sm h-[60vh] overflow-scroll">
              {typescriptCode}
            </pre>
          </TabsContent>
        </Tabs>

        <Button
          size="icon"
          variant="ghost"
          className="absolute top-16 right-6 h-8 w-8 hover:bg-muted-foreground/20"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          <span className="sr-only">Copy code</span>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

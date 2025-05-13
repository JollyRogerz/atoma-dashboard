"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelModality, Task } from "@/lib/atoma";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTasks } from "@/lib/api";
import { simplifyModelName } from "@/lib/utils";

interface ApiUsageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  modality: ModelModality;
  showModelSelector?: boolean;
  isConfidential?: boolean;
}

const modalityToCategory = (modality: ModelModality): "chat" | "embeddings" | "images" | null => {
  switch (modality) {
    case ModelModality.ChatCompletions:
      return "chat";
    case ModelModality.Embeddings:
      return "embeddings";
    case ModelModality.ImagesGenerations:
      return "images";
    default:
      return null;
  }
};

function processModelsForModality(
  models: [Task, ModelModality[]][],
  modality: ModelModality
): { modelName: string; model: string }[] {
  const uniqueModels = new Map<string, { modelName: string; model: string }>();

  models
    .filter(([task, capabilities]) => Array.isArray(capabilities) && capabilities.includes(modality))
    .forEach(([task]) => {
      const modelId = task.model_name || "";
      if (modelId && !uniqueModels.has(modelId)) {
        uniqueModels.set(modelId, {
          modelName: simplifyModelName(modelId),
          model: modelId,
        });
      }
    });

  return Array.from(uniqueModels.values()).sort((a, b) => a.modelName.localeCompare(b.modelName));
}

function getPythonCode(modelName: string, modality: ModelModality, isConfidential: boolean) {
  if (isConfidential) {
    return `from atoma_sdk import AtomaSDK
import os

with AtomaSDK(
    bearer_auth=os.getenv("ATOMASDK_BEARER_AUTH", ""),
) as atoma_sdk:

    completion = atoma_sdk.confidential_chat.create(
      model="${modelName}",
      messages=[
        {"role": "developer", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
      ]
    )

    print(completion.choices[0].message)`;
  }

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

    res = atoma_sdk.images.generate(
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

function getTypescriptCode(modelName: string, modality: ModelModality, isConfidential: boolean) {
  if (isConfidential) {
    return `import { AtomaSDK } from "atoma-sdk";

const atomaSDK = new AtomaSDK({
  bearerAuth: process.env["ATOMASDK_BEARER_AUTH"] ?? "",
});

async function run() {
  const completion = await atomaSDK.confidentialChat.create({
    messages: [
      {"role": "developer", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    model: "${modelName}"
  });

  console.log(completion.choices[0]);
}

run();`;
  }

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

export function ApiUsageDialog({
  isOpen,
  onClose,
  modelName: initialModelName,
  modality,
  showModelSelector = false,
  isConfidential = false,
}: ApiUsageDialogProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("python");
  const [selectedModel, setSelectedModel] = useState<string>(initialModelName);
  const [availableModels, setAvailableModels] = useState<{ modelName: string; model: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(showModelSelector);

  useEffect(() => {
    if (isOpen && showModelSelector) {
      setIsLoadingModels(true);
      setSelectedModel("");
      setAvailableModels([]);
      getTasks()
        .then(response => {
          const models = processModelsForModality(response.data, modality);
          setAvailableModels(models);

          if (models.length > 0) {
            const initialModelIsValid = models.some(m => m.model === initialModelName);
            if (initialModelIsValid) {
              setSelectedModel(initialModelName);
            } else {
              setSelectedModel(models[0].model);
            }
          } else {
            setSelectedModel("");
          }
        })
        .catch(error => {
          console.error("Error fetching models for dialog:", error);
          setSelectedModel("");
          setAvailableModels([]);
        })
        .finally(() => {
          setIsLoadingModels(false);
        });
    } else if (!showModelSelector) {
      setSelectedModel(initialModelName);
      setIsLoadingModels(false);
    }
  }, [isOpen, showModelSelector, modality, initialModelName]);

  const getEndpoint = () => {
    if (isConfidential) {
      if (modality === ModelModality.ChatCompletions) {
        return "/v1/confidential/chat/completions";
      } else if (modality === ModelModality.ImagesGenerations) {
        return "/v1/confidential/images/generations";
      } else if (modality === ModelModality.Embeddings) {
        return "/v1/confidential/embeddings";
      }
    } else {
    if (modality === ModelModality.ChatCompletions) {
      return "/v1/chat/completions";
    } else if (modality === ModelModality.ImagesGenerations) {
      return "/v1/images/generations";
    } else if (modality === ModelModality.Embeddings) {
      return "/v1/embeddings";
      }
    }
  };

  const currentModelForCode = selectedModel;

  const getRequestBody = () => {
    if (isConfidential) {
      return `{
  "ciphertext": "<string>",
  "client_dh_public_key": "<string>",
  "model_name": "${currentModelForCode}",
  "node_dh_public_key": "<string>",
  "nonce": "<string>",
  "num_compute_units": 1,
  "plaintext_body_hash": "<string>",
  "salt": "<string>",
  "stack_small_id": 1,
  "stream": true
}`;
    }

    if (modality === ModelModality.ChatCompletions) {
      return `{
  "model": "${currentModelForCode}",
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
  "model": "${currentModelForCode}",
  "prompt": "A serene landscape with mountains",
  "n": 1,
  "size": "1024x1024"
}`;
    } else {
      return `{
  "model": "${currentModelForCode}",
  "input": "The food was delicious and the waiter..."
}`;
    }
  };

  const curlCode = `curl ${isConfidential ? "--request POST \\" : ""} \\
  --url https://api.atoma.network${getEndpoint()} \\
  --header 'Authorization: Bearer ${isConfidential ? "<token>" : "$YOUR_API_KEY"}' \\
  --header 'Content-Type: application/json' \\
  --data '${getRequestBody()}'`;

  const pythonCode = getPythonCode(currentModelForCode, modality, isConfidential);

  const typescriptCode = getTypescriptCode(currentModelForCode, modality, isConfidential);

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

  const displayModelName = showModelSelector
    ? availableModels.find(m => m.model === selectedModel)?.modelName || selectedModel
    : simplifyModelName(initialModelName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader className="flex flex-row items-center justify-between gap-2">
          {showModelSelector ? (
            <div className="flex items-center gap-2 flex-grow">
              <DialogTitle className="whitespace-nowrap">API Usage for</DialogTitle>
              {isLoadingModels ? (
                <div className="text-sm text-muted-foreground">Loading models...</div>
              ) : availableModels.length > 0 ? (
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-auto min-w-[250px] flex-grow">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model.model} value={model.model}>
                        {model.modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground pl-2">No models available for this modality.</div>
              )}
            </div>
          ) : (
            <DialogTitle className="whitespace-nowrap flex-grow">API Usage for {displayModelName}</DialogTitle>
          )}
          {!isLoadingModels && selectedModel && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-muted-foreground/20 flex-shrink-0"
              onClick={copyToClipboard}
              title="Copy code snippet"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">Copy code</span>
            </Button>
          )}
        </DialogHeader>

        <Tabs defaultValue="python" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
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
      </DialogContent>
    </Dialog>
  );
}

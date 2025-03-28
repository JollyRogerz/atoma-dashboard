"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { ApiUsageDialog } from "@/components/api-usage-dialog";
import { ParametersSidebar } from "@/components/parameters-sidebar";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import {
  processModelsForCategory,
  RenderRequestBodyBasedOnEndPoint,
  parseOutputBasedOnEndpoint,
  fetchAvailableModels,
  TaskResponse,
  readableModelName,
} from "../../utils/utils";
import config from "@/config/config";
import LoadingCircle from "../../components/LoadingCircle";
import { useSettings } from "../../contexts/settings-context";
import ReactMarkdown from "react-markdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModelModality } from "@/lib/atoma";

export type ModelCategories = "chat" | "embeddings" | "images";

interface Parameters {
  apiKey: string;
  systemPrompt: string;
  customSystemPrompt: string;
  outputLength: number;
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
}

const defaultParameters: Parameters = {
  apiKey: "",
  systemPrompt: "Default",
  customSystemPrompt: "",
  outputLength: 2048,
  temperature: 0.7,
  topP: 0.7,
  topK: 50,
  repetitionPenalty: 1,
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PlaygroundPage() {
  const { settings, updatePlaygroundSettings } = useSettings();
  const [selectedModel, setSelectedModel] = useState("");
  const [availableModels, setAvailableModels] = useState<TaskResponse>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [parameters, setParameters] = useState<Parameters>({
    ...defaultParameters,
    ...(settings.playground || {}),
  });

  useEffect(() => {
    setParameters(prev => ({
      ...prev,
      ...settings.playground,
      apiKey: prev.apiKey,
    }));
  }, [settings.playground]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        setModelError(null);
        const models = await fetchAvailableModels();
        setAvailableModels(models);

        // Set initial selected model
        const processedModels = processModelsForCategory(models, "chat");
        if (processedModels.length > 0) {
          setSelectedModel(processedModels[0].model);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
        setModelError("Failed to load available models. Please try again later.");
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  // Auto-scroll messages container only, with containment
  useEffect(() => {
    // Instead of using scrollIntoView (which can scroll the whole page),
    // scroll only the direct parent container
    const messagesContainer = chatEndRef.current?.parentElement;
    if (messagesContainer && chatEndRef.current) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, streamingResponse]);

  const endpoints = {
    chat: "chat/completions",
    embeddings: "embeddings",
    images: "images/generations",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    setStreamingResponse("");
    setIsStreaming(false);
    abortControllerRef.current = new AbortController();

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      setIsLoading(true);
      setIsStreaming(true);

      const response = await fetch(`${config.ATOMA_API_URL}${endpoints.chat}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parameters.apiKey}`,
        },
        body: JSON.stringify({
          ...RenderRequestBodyBasedOnEndPoint("chat", selectedModel, userMessage, parameters, messages),
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line: string) => line.trim() !== "");

        for (const line of lines) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                fullResponse += content;
                setStreamingResponse(fullResponse);
              }
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullResponse }]);
      setStreamingResponse("");
      setIsStreaming(false);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Handle cancellation - preserve the partial response
        const currentResponse = streamingResponse;
        if (currentResponse) {
          setMessages(prev => [...prev, { role: "assistant", content: currentResponse }]);
        }
        setIsStreaming(false);
        setStreamingResponse("");
      } else {
        console.log(error);
        const currentResponse = streamingResponse;
        if (currentResponse) {
          setMessages(prev => [...prev, { role: "assistant", content: currentResponse }]);
        }

        const errorMessage =
          error instanceof Error
            ? error.message.includes("401")
              ? "There was a problem with your api key"
              : error.message
            : "An unexpected error occurred.";

        setMessages(prev => [...prev, { role: "assistant", content: errorMessage }]);
        setStreamingResponse("");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleParameterChange = (key: keyof Parameters, value: number | boolean | string) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      const currentResponse = streamingResponse;
      abortControllerRef.current.abort();
      if (currentResponse) {
        setMessages(prev => [...prev, { role: "assistant", content: currentResponse }]);
      }
      setIsStreaming(false);
      setStreamingResponse("");
    }
  };

  const currentModels = processModelsForCategory(availableModels, "chat");
  if (isLoadingModels)
    return (
      <div className="w-full h-[80dvh] flex justify-center items-center">
        <LoadingCircle size="md" isSpinning={true} />{" "}
      </div>
    );

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="relative z-10 h-[calc(100vh-6rem)] overflow-hidden">
        <div className="h-full p-4 grid grid-cols-[1fr,400px] gap-4">
          <Card className="flex flex-col overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Header Section */}
            <div className="p-4">
              <div className="flex w-full items-center justify-between p-2">
                {/* Model Selection */}
                <div className="flex items-center gap-2 flex-1">
                  {modelError ? (
                    <div className="text-red-500">{modelError}</div>
                  ) : (
                    <div className="flex items-center">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentModels.map(model => (
                            <SelectItem key={model.model} value={model.model}>
                              {readableModelName(model.model)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Button variant="outline" onClick={() => setIsApiDialogOpen(true)}>
                    API
                  </Button>
                </div>
              </div>
              <Separator className="mt-4" />
            </div>

            {/* Chat Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Start a conversation by sending a message</p>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>ul]:space-y-2 [&>ol]:space-y-2 [&>ul>li]:mt-1 [&>ol>li]:mt-1 [&>ol]:list-decimal [&>ol]:pl-6">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {streamingResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-4 bg-muted border border-border">
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>ul]:space-y-2 [&>ol]:space-y-2 [&>ul>li]:mt-1 [&>ol>li]:mt-1 [&>ol]:list-decimal [&>ol]:pl-6">
                        <ReactMarkdown>{streamingResponse}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {isLoading && !streamingResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-4 bg-muted border border-border">
                      <LoadingCircle isSpinning={true} size="xs" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t p-4 bg-background/50 backdrop-blur-md shadow-md rounded-b-lg">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-lg bg-background/80 border border-primary focus:ring-2 focus:ring-primary transition"
                    disabled={isLoading}
                  />
                  {isStreaming ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="hover:bg-destructive/90 transition-all duration-200 rounded-lg shadow-md"
                      onClick={handleStopStreaming}
                    >
                      <Square className="h-5 w-5" />
                      <span className="sr-only">Stop streaming</span>
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-primary hover:bg-primary/90 transition-all duration-200 rounded-lg shadow-md"
                      disabled={isLoading || !message.trim()}
                    >
                      <Send className="h-5 w-5" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  )}
                </form>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <ParametersSidebar parameters={parameters} onChange={handleParameterChange} />
          </Card>
        </div>
      </div>
      <ApiUsageDialog
        isOpen={isApiDialogOpen}
        onClose={() => setIsApiDialogOpen(false)}
        modelName={selectedModel}
        modality={ModelModality.ChatCompletions}
      />
    </div>
  );
}

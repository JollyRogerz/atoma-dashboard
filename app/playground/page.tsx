"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Square } from "lucide-react";
import { BackgroundGrid } from "@/components/background-grid";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
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

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("playgroundMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("playgroundMessages", JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    setStreamingResponse("");
    setIsStreaming(false);
    abortControllerRef.current = new AbortController();

    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      setIsLoading(true);
      setIsStreaming(true);

      const response = await axios.post(
        `${config.ATOMA_API_URL}${endpoints.chat}`,
        RenderRequestBodyBasedOnEndPoint("chat", selectedModel, userMessage, parameters),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parameters.apiKey}`,
          },
          signal: abortControllerRef.current.signal,
        }
      );

      const assistantResponse = parseOutputBasedOnEndpoint("chat", response);

      // Streaming effect
      setIsStreaming(true);
      for (let i = 0; i < assistantResponse.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        setStreamingResponse(prev => prev + assistantResponse[i]);
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Add assistant message to chat
      setMessages(prev => [...prev, { role: "assistant", content: assistantResponse }]);
      setStreamingResponse("");
      setIsStreaming(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.name === "CanceledError") {
        // Handle cancellation
        const partialResponse = streamingResponse;
        setMessages(prev => [...prev, { role: "assistant", content: partialResponse }]);
        setStreamingResponse("");
        setIsStreaming(false);
      } else {
        console.log(error);
        const errorMessage = axios.isAxiosError(error)
          ? error.status === 401
            ? "There was a problem with your api key"
            : error.response?.data?.error?.message || "Failed to query."
          : "An unexpected error occurred.";

        setMessages(prev => [...prev, { role: "assistant", content: errorMessage }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      abortControllerRef.current = null;
    }
  };

  const handleParameterChange = (key: keyof Parameters, value: number | boolean | string) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
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
    localStorage.removeItem("playgroundMessages");
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
                    currentModels.map(model => (
                      <Button
                        key={model.model}
                        variant="ghost"
                        className={`px-2 py-1 text-xs rounded-lg border ${
                          selectedModel === model.model
                            ? "bg-primary text-primary-foreground border-primary"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200 border-transparent"
                        }`}
                        onClick={() => setSelectedModel(model.model)}
                      >
                        {readableModelName(model.model)}
                      </Button>
                    ))
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
                )}
                {isLoading && !streamingResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-4 bg-muted border border-border">
                      <LoadingCircle isSpinning={true} size="xs" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
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

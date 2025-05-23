"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export interface ModelSettings {
  privateKey: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface ModelSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ModelSettings;
  onSave: (settings: ModelSettings) => void;
}

export function ModelSettingsDialog({ isOpen, onClose, settings, onSave }: ModelSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<ModelSettings>(settings);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Model Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="privateKey">Private Key</Label>
            <Input
              id="privateKey"
              type="password"
              value={localSettings.privateKey}
              onChange={e => setLocalSettings({ ...localSettings, privateKey: e.target.value })}
              placeholder="Enter your private key"
            />
          </div>
          <div className="grid gap-2">
            <Label>Temperature ({localSettings.temperature})</Label>
            <Slider
              value={[localSettings.temperature]}
              onValueChange={value => setLocalSettings({ ...localSettings, temperature: value[0] })}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness: 0 is focused and deterministic, 2 is more creative
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={localSettings.maxTokens}
              onChange={e => setLocalSettings({ ...localSettings, maxTokens: Number.parseInt(e.target.value) })}
              min={1}
              max={4096}
            />
          </div>
          <div className="grid gap-2">
            <Label>Top P ({localSettings.topP})</Label>
            <Slider
              value={[localSettings.topP]}
              onValueChange={value => setLocalSettings({ ...localSettings, topP: value[0] })}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Frequency Penalty ({localSettings.frequencyPenalty})</Label>
            <Slider
              value={[localSettings.frequencyPenalty]}
              onValueChange={value => setLocalSettings({ ...localSettings, frequencyPenalty: value[0] })}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Decreases the model's likelihood to repeat the same information
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Presence Penalty ({localSettings.presencePenalty})</Label>
            <Slider
              value={[localSettings.presencePenalty]}
              onValueChange={value => setLocalSettings({ ...localSettings, presencePenalty: value[0] })}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">Increases the model's likelihood to talk about new topics</p>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

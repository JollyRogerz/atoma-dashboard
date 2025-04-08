"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Copy, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/contexts/settings-context";
import { generateApiKey, getUserProfile, listApiKeys, revokeApiToken } from "@/lib/api";
import Modal from "./Modal";
import LoadingCircle from "./LoadingCircle";

interface ApiKey {
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  projectAccess: string;
  createdBy: string;
  permissions: string;
  id: number;
}

export function ApiKeyCard() {
  const [apiKeys, setApiKeys] = useState<ApiKey[] | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaveKeyDialogOpen, setIsSaveKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newGeneratedKey, setNewGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedToRevokeToken, setSelectedToRevokeToken] = useState<{ id: number; name: string } | null>(null);
  const { settings } = useSettings();

  const updateApiTokens = async () => {
    if (!settings.loggedIn) {
      setApiKeys([]);
      return;
    }
    setApiKeys(null);
    try {
      let tokens = await listApiKeys();
      let userProfile = await getUserProfile();
      let apiKeys: ApiKey[] = tokens.data.map(token => {
        return {
          name: token.name,
          key: `sk-...${token.token_last_4}`,
          created: new Date(token.created_at).toLocaleDateString(),
          projectAccess: "all",
          createdBy: userProfile.data.email,
          permissions: "all",
          lastUsed: token.last_used_timestamp ? new Date(token.last_used_timestamp).toLocaleString() : "Never",
          id: token.id,
        };
      });
      setApiKeys(apiKeys);
    } catch (error) {}
  };

  useEffect(() => {
    setLoggedIn(settings.loggedIn);
    updateApiTokens();
  }, [settings.loggedIn]);

  useEffect(() => {
    updateApiTokens();
  }, [newGeneratedKey]);

  const handleRevokeKey = async (key: number) => {
    try {
      await revokeApiToken(key);
      await updateApiTokens();
    } catch (error) {
      alert("failed to delete key");
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName) return;
    try {
      const generatedKey = await generateApiKey(newKeyName);
      setNewGeneratedKey(generatedKey.data);
      setIsCreateDialogOpen(false);
      setIsSaveKeyDialogOpen(true);
    } catch (error) {
      alert("error in creating key, ensure login and try again");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newGeneratedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <h2 className="text-lg font-semibold text-primary">API keys</h2>
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!loggedIn}>
            <Plus className="mr-2 h-4 w-4" />
            Create new API key
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>SECRET KEY</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead>LAST USED</TableHead>
                    <TableHead>PROJECT ACCESS</TableHead>
                    <TableHead>CREATED BY</TableHead>
                    <TableHead>PERMISSIONS</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys
                    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                    .map(key => (
                      <TableRow key={key.id} className={key.id == selectedToRevokeToken?.id ? "bg-red-100" : ""}>
                        <TableCell>{key.name}</TableCell>
                        <TableCell className="font-mono">{key.key}</TableCell>
                        <TableCell>{key.created}</TableCell>
                        <TableCell>{key.lastUsed}</TableCell>
                        <TableCell>{key.projectAccess}</TableCell>
                        <TableCell>{key.createdBy}</TableCell>
                        <TableCell>{key.permissions}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                setSelectedToRevokeToken({ id: key.id, name: key.name });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center">
                <LoadingCircle isSpinning={true} size="md" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new secret key</DialogTitle>
            <DialogDescription>
              Give your key a name to remember it by. This is only for your reference—it won't affect how the key works.
            </DialogDescription>
          </DialogHeader>
          
          <div className="pt-4">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My API key"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateKey} 
              disabled={!newKeyName}
            >
              Create secret key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Key Dialog */}
      <Dialog open={isSaveKeyDialogOpen} onOpenChange={setIsSaveKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your key</DialogTitle>
            <DialogDescription>
              Please save your secret key in a safe place since{" "}
              <span className="font-semibold">you won't be able to view it again</span>. Keep it secure, as anyone
              with your API key can make requests on your behalf. If you do lose it, you'll need to generate a new
              one.
            </DialogDescription>
          </DialogHeader>
          <div className="relative pt-4">
            <div className="rounded-md border bg-muted p-4 font-mono text-sm">{newGeneratedKey}</div>
            <Button 
              size="sm" 
              onClick={copyToClipboard} 
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {copied ? (
                "Copied"
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
           <DialogFooter className="pt-6">
              <Button onClick={() => setIsSaveKeyDialogOpen(false)}>Done</Button> 
           </DialogFooter>
        </DialogContent>
      </Dialog>
      <Modal isOpen={!!selectedToRevokeToken} onClose={() => setSelectedToRevokeToken(null)}>
        <h2 className="text-lg font-semibold text-primary">Revoke API Key json</h2>
        <p className="text-sm text-gray-500">
          Are you sure you want to revoke this <b>{selectedToRevokeToken?.name}</b> API key?
        </p>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setSelectedToRevokeToken(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleRevokeKey(selectedToRevokeToken!.id);
              setSelectedToRevokeToken(null);
            }}
            className="ml-2"
          >
            Revoke
          </Button>
        </div>
      </Modal>
    </>
  );
}

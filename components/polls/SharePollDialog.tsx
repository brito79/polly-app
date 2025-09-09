"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share, Copy, Check } from "lucide-react";
import { Poll } from "@/types/database";
import { QRCodeSVG } from "qrcode.react";

interface SharePollDialogProps {
  poll: Poll;
}

export function SharePollDialog({ poll }: SharePollDialogProps) {
  const [copied, setCopied] = useState(false);
  const pollUrl = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/polls/${poll.id}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Poll</DialogTitle>
          <DialogDescription>
            Share this poll with others so they can vote
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Poll URL */}
          <div className="space-y-2">
            <Label htmlFor="poll-url">Poll URL</Label>
            <div className="flex space-x-2">
              <Input
                id="poll-url"
                value={pollUrl}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <Label>QR Code</Label>
            <div className="flex justify-center p-4 bg-white border rounded-lg">
              <QRCodeSVG
                value={pollUrl}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan with your phone to open the poll
            </p>
          </div>

          {/* Poll Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium text-sm">{poll.title}</h3>
            {poll.description && (
              <p className="text-xs text-muted-foreground mt-1">{poll.description}</p>
            )}
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{poll.options.length} options</span>
              <span>{poll.total_votes || 0} votes</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

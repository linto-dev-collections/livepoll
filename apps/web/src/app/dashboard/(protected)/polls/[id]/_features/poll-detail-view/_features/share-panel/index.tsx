"use client";

import { Button } from "@livepoll/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@livepoll/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@livepoll/ui/components/ui/dialog";
import { Input } from "@livepoll/ui/components/ui/input";
import { CopyIcon, Maximize2Icon } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

export function SharePanel({ joinUrl }: { joinUrl: string }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("参加 URL をコピーしました");
    } catch {
      toast.error("コピーに失敗しました。URL を手動で選択してください。");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>参加者を集める</CardTitle>
        <CardDescription>
          参加 URL を共有するか、QR コードを提示してください。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 参加 URL + コピー */}
        <div className="flex items-center gap-2">
          <Input readOnly value={joinUrl} aria-label="参加 URL" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="参加 URL をコピー"
            onClick={handleCopy}
          >
            <CopyIcon className="size-4" />
          </Button>
        </div>

        {/* QR コード（スキャン用に常に白背景・黒前景） */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-lg bg-white p-4">
            <QRCode
              value={joinUrl}
              size={176}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>

          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              <Maximize2Icon className="mr-2 size-4" />
              QR を拡大
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>QR コード</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center rounded-lg bg-white p-6">
                <QRCode
                  value={joinUrl}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="break-all text-center text-muted-foreground text-sm">
                {joinUrl}
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

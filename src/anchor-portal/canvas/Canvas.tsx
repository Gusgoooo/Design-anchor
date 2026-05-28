import * as React from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";
import { useRoute } from "../router";
import { useStorySession, mergeParameters } from "../usePreviewState";
import { PreviewFrame } from "./PreviewFrame";

export function Canvas() {
  const { t } = useLocale();
  const route = useRoute();
  const { session, loading, error, registry } = useStorySession();

  if (route.kind === "components") return <WelcomeScreen registryCount={registry?.length ?? 0} />;

  if (loading) return <CenterMessage icon={<Loader2 size={16} className="animate-spin" />} text={t({ en: "Loading story…", zh: "Story 加载中…" })} />;
  if (error) return <CenterMessage icon={null} text={error} variant="error" />;
  if (!session) return <CenterMessage icon={null} text={t({ en: "Story not found in registry.", zh: "registry 里没有找到这个 story。" })} variant="error" />;

  // Fullscreen stories should fit the Canvas card exactly — no canvas
  // scrollbar, the component is in charge of its own height. Centered /
  // padded stories may exceed the canvas naturally, so they get
  // overflow-auto for graceful scroll.
  const layout = mergeParameters(session).layout ?? "centered";
  const isFullscreen = layout === "fullscreen";

  // transform creates a new containing block, so any `position: fixed`
  // element inside a story (e.g. AssistantModal's `fixed end-4 bottom-4`
  // anchor) resolves to the canvas card instead of the viewport. The
  // outer rounded card's overflow-hidden then clips anything outside
  // the card bounds — keeping AI overlays from leaking into the
  // sibling Controls card. Radix Portal-rendered dialogs/popovers are
  // unaffected since they escape to document.body.
  return (
    <div
      className={cn(
        "relative h-full w-full bg-background",
        isFullscreen ? "overflow-hidden" : "overflow-auto",
      )}
      style={{ transform: "translateZ(0)" }}
    >
      <PreviewFrame session={session} />
    </div>
  );
}

function WelcomeScreen({ registryCount }: { registryCount: number }) {
  const { t } = useLocale();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <MousePointerClick size={28} className="text-muted-foreground" />
      <div>
        <p className="text-base font-medium text-foreground">{t({ en: "Welcome to Design-anchor", zh: "欢迎使用 Design-anchor" })}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {registryCount > 0
            ? t({
                en: `Select a story from the sidebar to preview. ${registryCount} components are available.`,
                zh: `从左侧选一个 story 预览。当前共 ${registryCount} 个组件可用。`,
              })
            : t({
                en: "Add a *.demo.tsx file under src/components/ to get started.",
                zh: "在 src/components/ 下加一个 *.demo.tsx 文件就能开始了。",
              })}
        </p>
      </div>
    </div>
  );
}

function CenterMessage({
  icon,
  text,
  variant,
}: {
  icon: React.ReactNode | null;
  text: string;
  variant?: "error";
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-sm ${
        variant === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {icon}
      <p className="max-w-xl whitespace-pre-wrap">{text}</p>
    </div>
  );
}

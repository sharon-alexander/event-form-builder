import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { StepId } from "../../../locations/types";
import type { FormData } from "../../../types";
import { INITIAL_FORM_DATA } from "../../../types";
import { LocationProvider } from "../../../context/LocationContext";
import { getStepProps, renderStep } from "../../../form/renderStep";
import { applyTheme } from "../../../theme/theme";
import LandingPage from "../../../components/LandingPage";
import type { EditableLocation } from "../../pages/FormEditorPage";
import { draftToLocationConfig } from "../../utils/draftToConfig";

interface Props {
  draft: EditableLocation;
  selectedId: "landing" | StepId;
}

const noop = () => {};
const noopPatch = (_p: Partial<FormData>) => {};

export default function IframePreview({ draft, selectedId }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  const config = useMemo(() => draftToLocationConfig(draft), [draft]);

  const initIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write("<!DOCTYPE html><html><head></head><body></body></html>");
    doc.close();

    // Copy all stylesheets from parent into iframe head
    const parentStyles = document.querySelectorAll(
      'link[rel="stylesheet"], style',
    );
    parentStyles.forEach((el) => {
      doc.head.appendChild(el.cloneNode(true));
    });

    // Base styles for the iframe body
    doc.body.style.margin = "0";
    doc.body.style.padding = "16px 20px";
    doc.body.style.overflow = "auto";
    doc.body.style.fontFamily =
      'var(--font-sans, "Inter", system-ui, sans-serif)';

    setMountNode(doc.body);
  }, []);

  useEffect(() => {
    initIframe();
  }, [initIframe]);

  // Apply theme to iframe body whenever draft.theme changes
  useEffect(() => {
    if (!mountNode) return;
    applyTheme(mountNode, draft.theme);
  }, [mountNode, draft.theme]);

  const stepProps = useMemo(
    () => ({
      data: INITIAL_FORM_DATA,
      onChange: noopPatch,
      onNext: noop,
      onBack: noop,
    }),
    [],
  );

  const content = useMemo(() => {
    if (!mountNode) return null;

    let inner: React.ReactNode;
    if (selectedId === "landing") {
      inner = <LandingPage onStart={noop} />;
    } else {
      const props = getStepProps(config, selectedId, stepProps);
      inner = renderStep(selectedId, props);
    }

    return createPortal(
      <LocationProvider config={config}>
        <div style={{ pointerEvents: "none" }}>{inner}</div>
      </LocationProvider>,
      mountNode,
    );
  }, [mountNode, config, selectedId, stepProps]);

  return (
    <div className="flex h-full items-start justify-center">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
        <iframe
          ref={iframeRef}
          title="Form preview"
          className="h-[600px] w-full border-0"
          sandbox="allow-same-origin"
        />
      </div>
      {content}
    </div>
  );
}

import ConversionPanel from "@components/ConversionPanel";
import * as React from "react";
import { useCallback } from "react";

export default function() {
  const transformer = useCallback(async ({ value }) => {
    const { run } = await import(
      "@assets/vendor/json-typegen/json_typegen_wasm"
    );
    return run(
      "Root",
      value,
      JSON.stringify({
        output_mode: "json_schema"
      })
    );
  }, []);

  return (
    <ConversionPanel
      transformer={transformer}
      editorTitle="JSON"
      editorLanguage="json"
      resultTitle="JSON Schema"
      resultLanguage={"json"}
    />
  );
}
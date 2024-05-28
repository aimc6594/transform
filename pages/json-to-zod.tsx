import { generate } from "ts-to-zod";
import crypto from "crypto";
import path from "path";
import ConversionPanel from "@components/ConversionPanel";
import { EditorPanelProps } from "@components/EditorPanel";
import Form, { InputType } from "@components/Form";
import { useSettings } from "@hooks/useSettings";
import * as React from "react";
import os from "os";
import { useCallback } from "react";
import { Writable } from "stream";

interface Settings {
  rootName: string;
}

const formFields = [
  {
    type: InputType.TEXT_INPUT,
    key: "rootName",
    label: "Root Schema Name"
  }
];

const tmpDir = os.tmpdir?.();

function tsToZod(body: any, keepComments: string | string[] = "true", skipParseJSDoc: string | string[] = "true") {
  const schemaGenerator = generate({
    sourceText: body,
    keepComments: keepComments === "true",
    skipParseJSDoc: skipParseJSDoc === "true"
  });

  const filePath = path.join(tmpDir, crypto.randomBytes(16).toString("hex")) + ".ts";
  const schema = schemaGenerator.getZodSchemasFile(filePath);

  const formattedSchema = schema
    .split(/\r?\n/)
    .slice(1)
    .join("\n");
  return { formattedSchema, schemaGenerator };
}

class StringWriter extends Writable {
  _data: string;

  constructor(options: any) {
    super(options);
    this._data = '';
  }

  _write(chunk, _encoding, callback) {
    this._data += chunk;
    callback();
  }

  getData() {
    return this._data;
  }
}

export default function JsonToZod() {
  const name = "JSON to Zod Schema";

  const [settings, setSettings] = useSettings(name, {
    rootName: "schema"
  });

  const transformer = useCallback(
    async ({ value }) => {
      // first transform to typescript interface
      const mt = await import("maketypes")
      const w = new StringWriter({})
      const emitter = new mt.Emitter( new mt.StreamWriter(w), new mt.NopWriter() );

      emitter.emit(JSON.parse(value), "RootObject")

      const tsInterface = w.getData()

      // then convert the interface to zod schema
      const {formattedSchema} =  tsToZod(tsInterface)
      // return formattedSchema

      const { jsonToZod } = await import("json-to-zod");
      return jsonToZod(JSON.parse(value), settings.rootName, true);
    },
    [settings]
  );

  const getSettingsElement = useCallback<EditorPanelProps["settingElement"]>(
    ({ open, toggle }) => {
      return (
        <Form<Settings>
          title={name}
          onSubmit={setSettings}
          open={open}
          toggle={toggle}
          formsFields={formFields}
          initialValues={settings}
        />
      );
    },
    []
  );

  return (
    <ConversionPanel
      transformer={transformer}
      editorTitle="JSON"
      editorLanguage="json"
      resultTitle="Zod Schema"
      resultLanguage={"typescript"}
      editorSettingsElement={getSettingsElement}
      settings={settings}
    />
  );
}

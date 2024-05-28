import ConversionPanel from "@components/ConversionPanel";
import { EditorPanelProps } from "@components/EditorPanel";
import Form, { InputType } from "@components/Form";
import { useSettings } from "@hooks/useSettings";
import * as React from "react";
import { useCallback } from "react";
import { Writable } from "stream";

interface Settings {
  typealias: boolean;
}

const formFields = [
  {
    type: InputType.SWITCH,
    key: "typealias",
    label: "Create Mono Type"
  }
];

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

export default function JsonToTypescript() {
  const name = "JSON to Typescript";

  const [settings, setSettings] = useSettings(name, {
    typealias: false
  });

  const transformer = useCallback(
    async ({ value }) => {
      const mt = await import("maketypes")
      const w = new StringWriter({})
      const emitter = new mt.Emitter( new mt.StreamWriter(w), new mt.NopWriter() );

      emitter.emit(JSON.parse(value), "RootObject")

      return w.getData()

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
      resultTitle="TypeScript"
      resultLanguage={"typescript"}
      editorSettingsElement={getSettingsElement}
      settings={settings}
    />
  );
}

import { Plugin, PDFRenderProps, UIRenderProps } from "@pdfme/common";
import { text } from "@pdfme/schemas";
import { InstructionBoxSchema } from "./types";

/**
 * Instruction Box Plugin - FIXED
 */
export const instructionBoxPlugin: Plugin<InstructionBoxSchema> = {
  pdf: (props: PDFRenderProps<InstructionBoxSchema>) => {
    const { value, schema } = props;

    const instructionText = value || schema.content || "Instructions";
    const boxStyle = schema.boxStyle || "simple";

    let boxedText = instructionText;

    // Add simple box styling
    if (boxStyle === "simple") {
      const border = "─".repeat(Math.max(instructionText.length + 4, 20));
      boxedText = `┌${border}┐\n│  ${instructionText}  │\n└${border}┘`;
    }

    return text.pdf({
      ...props,
      value: boxedText,
      schema: { ...schema, type: "text", content: boxedText } as any,
    });
  },

  ui: (props: UIRenderProps<InstructionBoxSchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;

    const container = document.createElement("div");
    container.className = "instruction-box-container";
    container.style.cssText = `
      font-family: ${schema.fontName || "Arial"};
      font-size: ${schema.fontSize || 12}px;
      color: ${schema.fontColor || "#000000"};
      padding: 8px;
      border: 2px solid #4f46e5;
      border-radius: 8px;
      background: ${schema.backgroundColor || "#f0f9ff"};
    `;

    if (mode === "viewer") {
      const instructionText = value || schema.content || "";
      container.innerHTML = `
        <div style="font-weight: bold; color: #4f46e5; margin-bottom: 4px;">📋 Instructions</div>
        <div>${instructionText}</div>
      `;
    } else {
      const instructionInput = document.createElement("textarea");
      instructionInput.value = value || schema.content || "";
      instructionInput.style.cssText = `
        width: 100%; 
        padding: 8px; 
        resize: vertical;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: inherit;
      `;
      instructionInput.rows = 2;
      instructionInput.placeholder = "Enter instructions...";
      instructionInput.addEventListener("input", () => {
        onChange && onChange({ key: "content", value: instructionInput.value });
      });
      container.appendChild(instructionInput);
    }

    rootElement.appendChild(container);
  },

  propPanel: {
    schema: {
      boxStyle: {
        type: "string",
        title: "Box Style",
        enum: ["simple", "double", "rounded", "bold"],
        default: "simple",
      },
      backgroundColor: {
        type: "string",
        title: "Background Color",
        format: "color",
        default: "#f0f9ff",
      },
    },
    defaultSchema: {
      name: "instructionBox",
      type: "instructionBox",
      content: "Read all instructions carefully before proceeding.",
      position: { x: 0, y: 0 },
      width: 150,
      height: 40,
      fontSize: 11,
      fontColor: "#333333",
      boxStyle: "simple",
      backgroundColor: "#f0f9ff",
    },
  },
};
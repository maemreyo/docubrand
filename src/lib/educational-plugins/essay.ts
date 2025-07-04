import { Plugin, PDFRenderProps, UIRenderProps } from "@pdfme/common";
import { text } from "@pdfme/schemas";
import { EssaySchema } from "./types";

/**
 * Essay Question Plugin - FIXED
 */
export const essayPlugin: Plugin<EssaySchema> = {
  pdf: (props: PDFRenderProps<EssaySchema>) => {
    const { value, schema } = props;

    const questionText = value || schema.content || "Sample essay question";
    const answerSpace = Array(8).fill("_".repeat(70)).join("\n");
    const fullText = `${questionText}\n\n${answerSpace}`;

    return text.pdf({
      ...props,
      value: fullText,
      schema: { ...schema, type: "text", content: fullText } as any,
    });
  },

  ui: (props: UIRenderProps<EssaySchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;

    const container = document.createElement("div");
    container.className = "essay-container";
    container.style.cssText = `
      font-family: ${schema.fontName || "Arial"};
      font-size: ${schema.fontSize || 12}px;
      color: ${schema.fontColor || "#000000"};
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f8f9fa;
    `;

    if (mode === "viewer") {
      const questionText = value || schema.content || "";
      container.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">${questionText}</div>
        <div style="margin-left: 16px; border: 1px solid #ccc; height: 120px; padding: 8px; background: #f9f9f9;">
          Essay response area
        </div>
      `;
    } else {
      const questionInput = document.createElement("textarea");
      questionInput.value = value || schema.content || "";
      questionInput.style.cssText = `
        width: 100%; 
        padding: 8px; 
        resize: vertical;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: inherit;
      `;
      questionInput.rows = 3;
      questionInput.placeholder = "Enter your essay question...";
      questionInput.addEventListener("input", () => {
        if (onChange) {
          onChange({ key: "content", value: questionInput.value });
        }
      });
      container.appendChild(questionInput);
    }

    rootElement.appendChild(container);
  },

  propPanel: {
    schema: {
      wordLimit: {
        type: "number",
        title: "Word Limit",
        minimum: 50,
        default: 500,
      },
      points: {
        type: "number",
        title: "Points",
        minimum: 0,
        default: 10,
      },
    },
    defaultSchema: {
      name: "essay",
      type: "essay",
      content: "Write a detailed essay on the following topic:",
      position: { x: 0, y: 0 },
      width: 150,
      height: 100,
      fontSize: 12,
      fontColor: "#000000",
      wordLimit: 500,
      points: 10,
    },
  },
};

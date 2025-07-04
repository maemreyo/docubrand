import { Plugin, PDFRenderProps, UIRenderProps } from "@pdfme/common";
import { text } from "@pdfme/schemas";
import { ShortAnswerSchema } from "./types";

/**
 * Short Answer Plugin - FIXED
 */
export const shortAnswerPlugin: Plugin<ShortAnswerSchema> = {
  pdf: (props: PDFRenderProps<ShortAnswerSchema>) => {
    const { value, schema } = props;

    const questionText =
      value || schema.content || "Sample short answer question";
    const answerLines = "_".repeat(50);
    const fullText = `${questionText}\n\n${answerLines}`;

    return text.pdf({
      ...props,
      value: fullText,
      schema: { ...schema, type: "text", content: fullText } as any,
    });
  },

  ui: (props: UIRenderProps<ShortAnswerSchema>) => {
    const { rootElement, schema, value, onChange, mode } = props;

    const container = document.createElement("div");
    container.className = "short-answer-container";
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
        <div style="margin-left: 16px; border-bottom: 1px solid #ccc; height: 24px;"></div>
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
      questionInput.rows = 2;
      questionInput.placeholder = "Enter your short answer question...";
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
      expectedAnswer: {
        type: "string",
        title: "Expected Answer",
        description: "Sample or expected answer",
      },
      maxLength: {
        type: "number",
        title: "Max Length",
        minimum: 10,
        default: 100,
      },
      points: {
        type: "number",
        title: "Points",
        minimum: 0,
        default: 2,
      },
    },
    defaultSchema: {
      name: "shortAnswer",
      type: "shortAnswer",
      content: "What is your answer?",
      position: { x: 0, y: 0 },
      width: 150,
      height: 40,
      fontSize: 12,
      fontColor: "#000000",
      expectedAnswer: "",
      maxLength: 100,
      points: 2,
    },
  },
};

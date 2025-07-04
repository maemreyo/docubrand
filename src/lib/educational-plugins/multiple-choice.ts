import { Plugin, PDFRenderProps, UIRenderProps } from "@pdfme/common";
import { text } from "@pdfme/schemas";
import { MultipleChoiceSchema } from "./types";

/**
 * Multiple Choice Question Plugin - FIXED VERSION
 * Simplified value handling for better PDFme compatibility
 */

// Add timestamp tracking for debugging
let lastRenderTime = 0;
let renderCount = 0;

export const multipleChoicePlugin: Plugin<MultipleChoiceSchema> = {
  pdf: (props: PDFRenderProps<MultipleChoiceSchema>) => {
    const { value, schema } = props;

    // Use the value directly as question text, fallback to schema content
    const questionText =
      value || schema.content || "Sample multiple choice question";
    const questionOptions = schema.options || [
      "Option A",
      "Option B",
      "Option C",
      "Option D",
    ];

    // Build full text with options
    const fullText = [
      questionText,
      "",
      ...questionOptions.map(
        (option: string, index: number) =>
          `${String.fromCharCode(65 + index)}. ${option}`
      ),
    ].join("\n");

    // Use text plugin for actual rendering
    return text.pdf({
      ...props,
      value: fullText,
      schema: {
        ...schema,
        type: "text",
        content: fullText,
      } as any,
    });
  },

  ui: (props: UIRenderProps<MultipleChoiceSchema>) => {
    const currentTime = Date.now();
    renderCount++;
    const timeSinceLastRender = currentTime - lastRenderTime;
    lastRenderTime = currentTime;
    
    console.log(`🔍 MultipleChoice UI render #${renderCount} - Time since last render: ${timeSinceLastRender}ms`);
    console.log("🔍 MultipleChoice UI render - Props:", {
      mode: props.mode,
      value: props.value,
      schema: props.schema,
      onChange: typeof props.onChange
    });

    const { rootElement, schema, value, onChange, mode } = props;
    
    // Check if rootElement already has content (potential re-render issue)
    if (rootElement.children.length > 0) {
      console.warn("🔍 MultipleChoice - rootElement already has children! Potential re-render issue. Children count:", rootElement.children.length);
      // Clear existing content to prevent duplicates
      rootElement.innerHTML = "";
    }

    // Use value directly as question text
    const currentQuestionText = value || schema.content || "";
    const currentOptions = schema.options || ["", "", "", ""];

    console.log("🔍 MultipleChoice UI - Current state:", {
      currentQuestionText,
      currentOptions,
      mode
    });

    if (mode === "viewer") {
      // Display mode - show question and options
      const container = document.createElement("div");
      container.className = "multiple-choice-viewer";
      container.style.cssText = `
        font-family: ${schema.fontName || "Arial"};
        font-size: ${schema.fontSize || 12}px;
        color: ${schema.fontColor || "#000000"};
        line-height: 1.4;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #f9f9f9;
      `;

      const questionEl = document.createElement("div");
      questionEl.style.cssText = "font-weight: bold; margin-bottom: 8px;";
      questionEl.textContent = currentQuestionText;
      container.appendChild(questionEl);

      currentOptions.forEach((option: string, index: number) => {
        if (option.trim()) {
          // Only show non-empty options
          const optionEl = document.createElement("div");
          optionEl.style.cssText = "margin-left: 16px; margin-bottom: 4px;";
          optionEl.textContent = `${String.fromCharCode(
            65 + index
          )}. ${option}`;
          container.appendChild(optionEl);
        }
      });

      rootElement.appendChild(container);
      console.log("🔍 MultipleChoice - Viewer container appended to rootElement");
    } else {
      // Edit mode - simplified input handling
      console.log("🔍 MultipleChoice - Creating editor mode");
      const container = document.createElement("div");
      container.className = "multiple-choice-editor";
      container.style.cssText =
        "padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa;";
      
      // Add container event listeners to debug focus issues
      container.addEventListener("mousedown", (e) => {
        console.log("🔍 MultipleChoice - Container mousedown", e.target);
        // If clicking on container but not on an input, don't prevent default
        if (e.target === container) {
          console.log("🔍 MultipleChoice - Click on container itself, not preventing default");
        }
      });
      
      container.addEventListener("click", (e) => {
        console.log("🔍 MultipleChoice - Container click", e.target);
        // If clicking on container but not on an input, focus the question textarea
        if (e.target === container) {
          console.log("🔍 MultipleChoice - Click on container, focusing question textarea");
          const textarea = container.querySelector("textarea");
          if (textarea) {
            textarea.focus();
          }
        }
      });

      // Question input - FIXED: Direct value handling
      const questionLabel = document.createElement("label");
      questionLabel.textContent = "Question:";
      questionLabel.style.cssText =
        "display: block; font-weight: bold; margin-bottom: 4px; color: #333;";
      container.appendChild(questionLabel);

      const questionInput = document.createElement("textarea");
      questionInput.value = currentQuestionText;
      questionInput.style.cssText = `
        width: 100%; 
        padding: 8px; 
        margin-bottom: 12px; 
        resize: vertical;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: inherit;
        font-size: 12px;
      `;
      questionInput.rows = 2;
      questionInput.placeholder = "Enter your multiple choice question...";

      console.log("🔍 MultipleChoice - Creating textarea with value:", currentQuestionText);

      // Add multiple event listeners for debugging
      questionInput.addEventListener("focus", () => {
        console.log("🔍 MultipleChoice - Textarea focused");
      });

      questionInput.addEventListener("blur", (e) => {
        console.log("🔍 MultipleChoice - Textarea blurred");
        console.log("🔍 MultipleChoice - Blur event:", e);
        console.log("🔍 MultipleChoice - Related target:", e.relatedTarget);
        console.log("🔍 MultipleChoice - Active element:", document.activeElement);
      });

      questionInput.addEventListener("click", (e) => {
        console.log("🔍 MultipleChoice - Textarea clicked", e);
        // Prevent any parent from interfering
        e.stopPropagation();
      });

      questionInput.addEventListener("mousedown", (e) => {
        console.log("🔍 MultipleChoice - Textarea mousedown", e);
        // Prevent any parent from interfering
        e.stopPropagation();
      });

      questionInput.addEventListener("keydown", (e) => {
        console.log("🔍 MultipleChoice - Textarea keydown:", e.key, "Value:", questionInput.value);
      });

      // FIXED: Simple onChange handler for question text
      questionInput.addEventListener("input", (e) => {
        console.log("🔍 MultipleChoice - Input event triggered. Value:", questionInput.value);
        console.log("🔍 MultipleChoice - onChange function exists:", typeof onChange);
        
        if (onChange) {
          console.log("🔍 MultipleChoice - Calling onChange with:", { key: "content", value: questionInput.value });
          onChange({ key: "content", value: questionInput.value });
        } else {
          console.warn("🔍 MultipleChoice - onChange is null/undefined!");
        }
      });

      container.appendChild(questionInput);
      console.log("🔍 MultipleChoice - Textarea appended to container");

      // Try to set focus after a short delay to see if it helps
      setTimeout(() => {
        console.log("🔍 MultipleChoice - Attempting to focus textarea after delay");
        questionInput.focus();
      }, 100);

      // Add document-level focus tracking
      const focusTracker = (e: FocusEvent) => {
        console.log("🔍 MultipleChoice - Document focus changed to:", e.target);
        if (e.target !== questionInput) {
          console.log("🔍 MultipleChoice - Focus moved away from our textarea");
        }
      };
      
      document.addEventListener("focusin", focusTracker);
      document.addEventListener("focusout", focusTracker);
      
      // Clean up event listeners (this is a simple approach, in real code you'd want proper cleanup)
      setTimeout(() => {
        document.removeEventListener("focusin", focusTracker);
        document.removeEventListener("focusout", focusTracker);
      }, 30000); // Clean up after 30 seconds

      // Options section
      const optionsLabel = document.createElement("label");
      optionsLabel.textContent = "Answer Options:";
      optionsLabel.style.cssText =
        "display: block; font-weight: bold; margin-bottom: 8px; color: #333;";
      container.appendChild(optionsLabel);

      // Create options container
      const optionsContainer = document.createElement("div");
      optionsContainer.style.cssText =
        "background: white; padding: 8px; border-radius: 4px; border: 1px solid #e5e5e5;";

      // Note about options
      const optionsNote = document.createElement("div");
      optionsNote.textContent = "Edit options directly below or use the Properties panel →";
      optionsNote.style.cssText =
        "font-size: 11px; color: #666; margin-bottom: 8px; font-style: italic;";
      optionsContainer.appendChild(optionsNote);

      // Display current options (editable in editor)
      currentOptions.forEach((option: string, index: number) => {
        const optionWrapper = document.createElement("div");
        optionWrapper.style.cssText = "margin-bottom: 8px; display: flex; align-items: center;";
        
        const optionLabel = document.createElement("span");
        optionLabel.textContent = `${String.fromCharCode(65 + index)}. `;
        optionLabel.style.cssText = "font-weight: bold; margin-right: 8px; min-width: 24px;";
        
        const optionInput = document.createElement("input");
        optionInput.type = "text";
        optionInput.value = option;
        optionInput.placeholder = `Option ${String.fromCharCode(65 + index)}`;
        optionInput.style.cssText = `
          flex: 1;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-radius: 2px;
          font-size: 12px;
        `;
        
        // Add event listener for option changes
        optionInput.addEventListener("input", () => {
          console.log(`🔍 MultipleChoice - Option ${index} changed to:`, optionInput.value);
          if (onChange) {
            // Update the options array
            const newOptions = [...currentOptions];
            newOptions[index] = optionInput.value;
            onChange({ key: "options", value: newOptions });
          }
        });
        
        // Add event handling to prevent focus issues
        optionInput.addEventListener("click", (e) => {
          console.log(`🔍 MultipleChoice - Option ${index} clicked`);
          e.stopPropagation();
        });
        
        optionInput.addEventListener("mousedown", (e) => {
          console.log(`🔍 MultipleChoice - Option ${index} mousedown`);
          e.stopPropagation();
        });
        
        optionWrapper.appendChild(optionLabel);
        optionWrapper.appendChild(optionInput);
        optionsContainer.appendChild(optionWrapper);
      });

      container.appendChild(optionsContainer);
      rootElement.appendChild(container);
      console.log("🔍 MultipleChoice - Editor container appended to rootElement");
    }
    console.log("🔍 MultipleChoice - UI render complete");
  },

  propPanel: {
    schema: {
      options: {
        type: "array",
        title: "Answer Options",
        items: {
          type: "string",
          title: "Option",
        },
        default: ["Option A", "Option B", "Option C", "Option D"],
      },
      correctAnswer: {
        type: "string",
        title: "Correct Answer",
        enum: ["A", "B", "C", "D"],
        default: "A",
      },
      points: {
        type: "number",
        title: "Points",
        minimum: 0,
        default: 1,
      },
    },
    defaultSchema: {
      name: "multipleChoice",
      type: "multipleChoice",
      content: "What is the correct answer?",
      position: { x: 0, y: 0 },
      width: 150,
      height: 80,
      fontSize: 12,
      fontColor: "#000000",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "A",
      points: 1,
    },
  },
};

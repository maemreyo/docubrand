# Multiple Choice Plugin for pdfme

A comprehensive multiple-choice question plugin for pdfme that allows teachers to create questions with multiple correct answers.

## Features

- ✅ Support for multiple correct answers
- ✅ Interactive editor for creating and editing questions
- ✅ Customizable styling (font, size, color)
- ✅ Points assignment for grading
- ✅ Instruction text support
- ✅ Choice randomization option
- ✅ Min/max correct answer validation
- ✅ PDF rendering with checkboxes
- ✅ Full TypeScript support

## Installation

1. Copy the `src/lib/educational-plugins` folder to your project
2. Import the plugin in your code:

```typescript
import { multipleChoice } from './lib/educational-plugins';
```

## Usage

### Basic Example

```typescript
import { Template } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { multipleChoice } from './lib/educational-plugins';

const template: Template = {
  basePdf: { width: 210, height: 297 }, // A4 size
  schemas: [
    {
      name: 'question1',
      type: 'multipleChoice',
      position: { x: 20, y: 30 },
      width: 170,
      height: 100,
      question: 'Which of the following are primary colors?',
      choices: [
        { id: '1', text: 'Red', isCorrect: true },
        { id: '2', text: 'Blue', isCorrect: true },
        { id: '3', text: 'Green', isCorrect: false },
        { id: '4', text: 'Yellow', isCorrect: true },
      ],
      points: 3,
      instructionText: 'Select all that apply',
    },
  ],
};

// Generate PDF
const pdf = await generate({
  template,
  inputs: [{}],
  plugins: { multipleChoice },
});
```

### With Designer

```typescript
import { Designer } from '@pdfme/ui';
import { multipleChoice } from './lib/educational-plugins';

const designer = new Designer({
  domContainer: document.getElementById('designer'),
  template,
  plugins: { multipleChoice },
});
```

## Schema Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `question` | string | The question text | Required |
| `choices` | Choice[] | Array of answer choices | Required |
| `points` | number | Points for the question | 1 |
| `instructionText` | string | Instructions shown above question | Optional |
| `fontName` | string | Font family | 'Helvetica' |
| `fontSize` | number | Font size in points | 12 |
| `fontColor` | string | Text color (hex) | '#000000' |
| `showCorrectAnswers` | boolean | Show correct answers in PDF | false |
| `randomizeChoices` | boolean | Randomize choice order | false |
| `minCorrectAnswers` | number | Minimum correct answers | 1 |
| `maxCorrectAnswers` | number | Maximum correct answers | - |

### Choice Interface

```typescript
interface Choice {
  id: string;      // Unique identifier
  text: string;    // Choice text
  isCorrect: boolean; // Whether this is a correct answer
}
```

## Editor Features

### In Designer/Form Mode
- Add unlimited choices (minimum 2)
- Remove choices (keeps minimum 2)
- Mark multiple choices as correct
- Edit question text with textarea
- Real-time preview

### In Viewer Mode
- Displays question and choices
- Shows checkboxes for selection
- Clean, printable format

## Customization

### Styling
```typescript
{
  fontName: 'Arial',
  fontSize: 14,
  fontColor: '#333333',
}
```

### Validation
```typescript
{
  minCorrectAnswers: 2,  // At least 2 correct answers
  maxCorrectAnswers: 4,  // At most 4 correct answers
}
```

## Best Practices

1. **Clear Questions**: Write unambiguous questions
2. **Distinct Choices**: Make each choice clearly different
3. **Instruction Text**: Use when multiple answers are expected
4. **Points**: Assign based on question difficulty
5. **Validation**: Set min/max for complex questions

## Advanced Features

### Random Choice Order
Enable `randomizeChoices` to present choices in different order for each student:

```typescript
{
  randomizeChoices: true
}
```

### Conditional Logic
You can programmatically modify the schema based on conditions:

```typescript
const schema = {
  ...baseSchema,
  choices: studentLevel === 'advanced' 
    ? advancedChoices 
    : basicChoices
};
```

## Troubleshooting

### Common Issues

1. **Choices not saving**: Ensure each choice has a unique `id`
2. **PDF rendering issues**: Check font availability in pdfme options
3. **Validation errors**: Verify min/max correct answers make sense

## Future Enhancements

- [ ] Drag-and-drop choice reordering
- [ ] Rich text support for questions
- [ ] Image support in choices
- [ ] Partial credit scoring
- [ ] Export/import question banks

## Contributing

Feel free to submit issues or pull requests to improve this plugin!
# Text Diff Checker

A modern, browser-based text difference checking tool that processes everything locally on your device. Compare code snippets, configuration files, or any text with syntax highlighting and intuitive visualization.

## Features

- **100% Client-Side Processing**: All difference calculations happen entirely in your browser - no data is ever sent to any server
- **Private & Secure**: Your text never leaves your device, making it safe for sensitive information
- **Syntax Highlighting**: Supports multiple programming languages and file formats
- **Line-by-Line Comparison**: Clear visualization of additions, deletions, and modifications
- **Word-Level Diffs**: Highlights specific changes within modified lines
- **Automatic Language Detection**: Identifies programming language based on content
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Online Version

Visit [https://diff.pwp.sh](https://diff.pwp.sh) to use the tool immediately without installation.

### Run Locally

If you prefer to run the application on your local machine:

```sh
# Clone this repository
git clone https://github.com/alkinum/text-diff-checker.git

# Navigate to the project directory
cd text-diff-checker

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## How It Works

1. Paste or type your original text in the left panel
2. Paste or type your modified text in the right panel
3. Click "Compare" to see the differences
4. The syntax highlighting will automatically adjust based on the content
5. You can manually select a different language using the dropdown menu

## Technology Stack

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [diff](https://github.com/kpdecker/jsdiff) - JavaScript library for calculating text differences

## Privacy

This application:
- Never sends your text data to any server
- Has no analytics or tracking
- Functions entirely in your browser
- Can even work offline after initial load

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

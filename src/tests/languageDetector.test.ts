import { describe, it, expect } from 'vitest';
import { detectLanguage } from '@/utils/diff/languageDetector';

describe('Language Detector', () => {
  describe('detectLanguage', () => {
    it('should detect plaintext for empty content', () => {
      expect(detectLanguage('')).toBe('plaintext');
      expect(detectLanguage('   ')).toBe('plaintext');
      expect(detectLanguage('\n\n')).toBe('plaintext');
    });

    it('should detect JSON correctly', () => {
      const jsonContent = `{
        "name": "test",
        "version": "1.0.0",
        "scripts": {
          "start": "node index.js"
        }
      }`;
      expect(detectLanguage(jsonContent)).toBe('json');

      const arrayJson = `[
        {"id": 1, "name": "item1"},
        {"id": 2, "name": "item2"}
      ]`;
      expect(detectLanguage(arrayJson)).toBe('json');

      const simpleJson = `{"key": "value"}`;
      expect(detectLanguage(simpleJson)).toBe('json');
    });

    it('should detect XML correctly', () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
      <root>
        <item>value</item>
      </root>`;
      expect(detectLanguage(xmlContent)).toBe('xml');

      const xmlWithDeclaration = `<?xml version="1.0"?>
      <data></data>`;
      expect(detectLanguage(xmlWithDeclaration)).toBe('xml');
    });

    it('should detect HTML correctly', () => {
      const htmlContent = `<!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body><h1>Hello</h1></body>
      </html>`;
      expect(detectLanguage(htmlContent)).toBe('html');

      const simpleHtml = `<html>
        <body>Content</body>
      </html>`;
      expect(detectLanguage(simpleHtml)).toBe('html');
    });

    it('should detect JavaScript correctly', () => {
      const jsWithImport = `import React from 'react';
      export default function Component() {
        return <div>Hello</div>;
      }`;
      expect(detectLanguage(jsWithImport)).toBe('javascript');

      const jsWithExport = `export const API_URL = 'https://api.example.com';`;
      expect(detectLanguage(jsWithExport)).toBe('javascript');

      const jsWithFunction = `function calculate(a, b) {
        return a + b;
      }`;
      expect(detectLanguage(jsWithFunction)).toBe('javascript');

      const jsWithConst = `const data = {
        name: 'test',
        value: 42
      };`;
      expect(detectLanguage(jsWithConst)).toBe('javascript');

      const jsWithLet = `let counter = 0;
      counter++;`;
      expect(detectLanguage(jsWithLet)).toBe('javascript');

      const jsWithVar = `var oldStyle = true;`;
      expect(detectLanguage(jsWithVar)).toBe('javascript');

      const jsWithClass = `class MyClass {
        constructor() {
          this.value = 0;
        }
      }`;
      expect(detectLanguage(jsWithClass)).toBe('javascript');
    });

    it('should detect C++ correctly', () => {
      const cppWithInclude = `#include <iostream>
      using namespace std;
      
      int main() {
        cout << "Hello World" << endl;
        return 0;
      }`;
      expect(detectLanguage(cppWithInclude)).toBe('cpp');

      const cppWithDefine = `#define PI 3.14159
      #define MAX_SIZE 100`;
      expect(detectLanguage(cppWithDefine)).toBe('cpp');

      const cppWithClass = `class Rectangle {
      private:
        int width, height;
      public:
        Rectangle(int w, int h) : width(w), height(h) {}
      };`;
      expect(detectLanguage(cppWithClass)).toBe('cpp');
    });

    it('should detect Python correctly', () => {
      const pythonWithDef = `def hello_world():
        print("Hello, World!")
        return True`;
      expect(detectLanguage(pythonWithDef)).toBe('python');

      const pythonWithClass = `class MyClass:
        def __init__(self):
          self.value = 0
        
        def get_value(self):
          return self.value`;
      expect(detectLanguage(pythonWithClass)).toBe('python');

      const pythonWithImport = `import os
      import sys
      from datetime import datetime`;
      expect(detectLanguage(pythonWithImport)).toBe('python');

      const pythonWithFromImport = `from flask import Flask, request, jsonify`;
      expect(detectLanguage(pythonWithFromImport)).toBe('python');
    });

    it('should detect Java correctly', () => {
      const javaWithPackage = `package com.example.myapp;
      
      public class HelloWorld {
        public static void main(String[] args) {
          System.out.println("Hello World");
        }
      }`;
      expect(detectLanguage(javaWithPackage)).toBe('java');

      const javaWithImport = `import java.util.ArrayList;
      import java.util.List;`;
      expect(detectLanguage(javaWithImport)).toBe('java');

      const javaWithClass = `public class Calculator {
        private int value;
        
        public Calculator(int initialValue) {
          this.value = initialValue;
        }
      }`;
      expect(detectLanguage(javaWithClass)).toBe('java');
    });

    it('should detect Perl correctly', () => {
      const perlWithUse = `use strict;
      use warnings;
      
      my $name = "World";
      print "Hello, $name!\\n";`;
      expect(detectLanguage(perlWithUse)).toBe('perl');

      const perlWithPackage = `package MyModule;
      use Exporter;
      our @ISA = qw(Exporter);`;
      expect(detectLanguage(perlWithPackage)).toBe('perl');

      const perlWithSub = `sub calculate {
        my ($a, $b) = @_;
        return $a + $b;
      }`;
      expect(detectLanguage(perlWithSub)).toBe('perl');
    });

    it('should detect EJS correctly', () => {
      const ejsContent = `<% if (user) { %>
        <h1>Welcome, <%= user.name %>!</h1>
      <% } else { %>
        <h1>Please log in</h1>
      <% } %>`;
      expect(detectLanguage(ejsContent)).toBe('ejs');

      const ejsWithInclude = `<%- include('header') %>
      <main>Content</main>
      <%- include('footer') %>`;
      expect(detectLanguage(ejsWithInclude)).toBe('ejs');
    });

    it('should detect C-like languages correctly', () => {
      const cLikeWithComment = `/* This is a comment */
      // Another comment
      int main() {
        return 0;
      }`;
      expect(detectLanguage(cLikeWithComment)).toBe('clike');

      const cLikeWithSlashComment = `// Configuration file
      #define VERSION "1.0"`;
      expect(detectLanguage(cLikeWithSlashComment)).toBe('clike');
    });

    it('should detect YAML correctly', () => {
      const yamlContent = `name: my-app
      version: 1.0.0
      dependencies:
        - express
        - mongoose`;
      expect(detectLanguage(yamlContent)).toBe('yaml');

      const yamlWithColon = `database:
        host: localhost
        port: 5432`;
      expect(detectLanguage(yamlWithColon)).toBe('yaml');
    });

    it('should detect INI correctly', () => {
      const iniContent = `[database]
      host=localhost
      port=5432
      
      [server]
      port=3000`;
      expect(detectLanguage(iniContent)).toBe('ini');

      const iniWithSection = `[settings]
      debug=true
      timeout=30`;
      expect(detectLanguage(iniWithSection)).toBe('ini');
    });

    it('should fallback to plaintext for unrecognized content', () => {
      const plainContent = `This is just plain text
      with multiple lines
      and no special syntax.`;
      expect(detectLanguage(plainContent)).toBe('plaintext');

      const mixedContent = `Some text with random symbols
      @#$%^&*()
      123456789`;
      expect(detectLanguage(mixedContent)).toBe('plaintext');
    });

    it('should handle edge cases', () => {
      // Invalid JSON should not be detected as JSON
      const invalidJson = `{
        "name": "test"
        "missing": comma
      }`;
      expect(detectLanguage(invalidJson)).toBe('plaintext');

      // Content that looks like JSON but isn't valid
      const fakeJson = `{not valid json}`;
      expect(detectLanguage(fakeJson)).toBe('plaintext');

      // Mixed content with multiple language patterns
      const mixedLanguage = `import React from 'react';
      def python_function():
        return True`;
      expect(detectLanguage(mixedLanguage)).toBe('javascript'); // First match wins
    });

    it('should handle whitespace and formatting variations', () => {
      // JSON with extra whitespace
      const spacedJson = `   {
        "key": "value"
      }   `;
      expect(detectLanguage(spacedJson)).toBe('json');

      // JavaScript with indentation
      const indentedJs = `    function test() {
          return true;
        }`;
      expect(detectLanguage(indentedJs)).toBe('javascript');

      // Python with mixed indentation
      const pythonCode = `  def calculate():
      return 42`;
      expect(detectLanguage(pythonCode)).toBe('python');
    });
  });
}); 
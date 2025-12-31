# Contributing to PCI-DSS Docs MCP

Thank you for your interest in contributing!

## How to Contribute

### Reporting Bugs

- Check existing issues first
- Include steps to reproduce
- Provide error messages and logs
- Specify Node.js and Claude version

### Suggesting Enhancements

- Explain the use case clearly
- Provide examples
- Consider backward compatibility

### Contributing Code

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm run build && npm run dev`
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Code Style

- TypeScript strict mode
- Use Zod for validation
- Follow existing tool patterns
- Add JSDoc comments for public APIs

### Adding Control Mappings

To expand framework mappings:

1. Edit `data/control-mappings.json`
2. Add mappings following existing structure
3. Test with relevant tools (map_to_framework, etc.)
4. Document new framework in README

### Adding Evidence Examples

To add evidence guidance:

1. Edit `data/evidence-examples.json`
2. Follow existing structure (type, description, examples)
3. Test with get_evidence_examples tool

### Adding Synonym Mappings

To expand search synonym support:

1. Edit `src/tools/search_synonyms.ts`
2. Add new v3.2.1 → v4.0.1 terminology mappings
3. Test with search_requirements tool
4. Update tool description if needed

## Questions?

Open an issue for discussion!

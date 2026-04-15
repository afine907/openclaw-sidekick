# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2024-04-14

### Added
- XSS security protection in markdown rendering
- API Key configuration support
- URL validation on settings save
- Request timeout (60s) with AbortController
- Message history auto-cleanup (max 100, keep 50)
- Image size validation (max 5MB)
- Input length limit (10000 chars)
- Clear conversation history button
- Unit tests (17 test cases)

### Changed
- API Key moved from hardcoded to storage-based
- Enhanced error messages with actionable feedback
- Improved markdown rendering security

### Fixed
- XSS vulnerability in renderMarkdown()
- Missing URL format validation
- Unbounded message history growth

## [0.1.0] - 2024-04-01

### Added
- Initial release
- Side panel with OpenClaw integration
- Context menu for selected text
- Keyboard shortcuts (Ctrl+Shift+O, Ctrl+Shift+S)
- Image paste support (Ctrl+V)
- Dark theme UI
- Markdown rendering
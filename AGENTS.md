# AGENTS.md

## Project Overview
- Backend application built with NestJS.
- TypeScript with strict mode enabled.
- ESM module system.
- Vitest for testing.
- Oxlint for linting.

## Architecture Guidelines
- Keep controllers responsible for HTTP handling.
- Keep business logic inside providers/services.
- Use dependency injection.
- Keep database access separate from business logic when appropriate.
- Avoid unnecessary abstractions.

## Coding Standards
- Follow SOLID principles where appropriate.
- Prefer composition over inheritance.
- Use DTOs for request validation.
- Avoid unnecessary dependencies.
- Keep functions focused and maintainable.

## Testing
- Write unit tests for business logic.
- Test important integration points.
- Run tests after making changes.

## AI Instructions
- Explain architectural decisions.
- Don't modify unrelated files.
- Don't install dependencies without explaining why.
- Don't implement features beyond the requested scope.

# Contributing to SpecFlow AI

## Development Setup

```bash
git clone https://github.com/specflow-ai/specflow.git
cd specflow
pnpm install
pnpm build
pnpm test
```

## Project Structure

```
specflow/
├── packages/
│   ├── core/           # @specflow/core — engine
│   └── claude-code/    # @specflow/claude-code — plugin
├── specs/              # Test fixtures
└── docs/               # Documentation
```

## Running Tests

```bash
pnpm test               # Run all tests
pnpm test -- --coverage # With coverage
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`pnpm test`)
5. Run type check (`pnpm typecheck`)
6. Submit a pull request

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change that neither fixes nor adds
- `test:` adding or fixing tests
- `docs:` documentation
- `chore:` build process or tooling

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

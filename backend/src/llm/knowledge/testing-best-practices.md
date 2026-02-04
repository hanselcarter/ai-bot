# Testing Best Practices

## Testing Pyramid

### Unit Tests
Unit tests verify individual components in isolation. They should be:
- Fast (milliseconds)
- Isolated (no external dependencies)
- Repeatable (same result every time)
- Self-validating (pass/fail automatically)

**Guidelines:**
- Test one behavior per test
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Keep tests independent

### Integration Tests
Integration tests verify that components work together correctly. They test:
- Database interactions
- API endpoints
- Service communication
- File system operations

**Guidelines:**
- Use test databases or containers
- Clean up test data
- Test realistic scenarios
- Balance coverage with speed

### End-to-End Tests
E2E tests verify the complete application flow from user perspective.

**Guidelines:**
- Focus on critical user journeys
- Keep them minimal (expensive to maintain)
- Use stable selectors
- Handle async operations properly

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle
1. **Red:** Write a failing test
2. **Green:** Write minimal code to pass
3. **Refactor:** Improve code while keeping tests green

### Benefits of TDD
- Better design through test-first thinking
- Built-in regression safety
- Documentation through tests
- Confidence to refactor

### TDD Guidelines
- Start with the simplest test case
- One test at a time
- Don't write production code without a failing test
- Refactor only when tests are green

## Mocking Strategies

### When to Mock
- External services (APIs, databases)
- Slow operations
- Non-deterministic behavior
- Edge cases difficult to reproduce

### Types of Test Doubles
- **Dummy:** Placeholder, never used
- **Stub:** Returns predetermined values
- **Spy:** Records calls for verification
- **Mock:** Pre-programmed expectations
- **Fake:** Working implementation (in-memory DB)

### Mocking Best Practices
- Don't mock what you don't own (wrap first)
- Avoid over-mocking (test becomes meaningless)
- Mock at architectural boundaries
- Verify behavior, not implementation

## Test Organization

### Naming Conventions
```
methodName_stateUnderTest_expectedBehavior
should_expectedBehavior_when_stateUnderTest
```

### Test Structure
```
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Test Data
- Use factories or builders
- Avoid magic numbers/strings
- Keep test data minimal
- Use meaningful names

## Code Coverage

### Coverage Metrics
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

### Coverage Guidelines
- 80% is a common target
- Don't chase 100% blindly
- Focus on critical paths
- Coverage != quality

## Testing Anti-Patterns

### Common Mistakes
- Testing implementation details
- Flaky tests (intermittent failures)
- Slow test suites
- Tests that require specific order
- Excessive setup/teardown
- Testing private methods directly
- Ignoring test maintenance

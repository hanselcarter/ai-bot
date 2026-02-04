# Clean Code Principles

## SOLID Principles

### Single Responsibility Principle (SRP)
A class should have only one reason to change. Each class should focus on a single concern.

**Signs of violation:**
- Class has multiple unrelated methods
- Changes in one area affect unrelated functionality
- Hard to name the class concisely

**Solution:** Split into focused classes with clear responsibilities.

### Open/Closed Principle (OCP)
Software entities should be open for extension but closed for modification. Add new functionality without changing existing code.

**Implementation:**
- Use abstractions (interfaces, abstract classes)
- Favor composition over inheritance
- Apply Strategy or Decorator patterns

### Liskov Substitution Principle (LSP)
Subtypes must be substitutable for their base types. Derived classes shouldn't break expectations.

**Violations:**
- Throwing unexpected exceptions
- Strengthening preconditions
- Weakening postconditions
- Removing functionality

### Interface Segregation Principle (ISP)
Clients shouldn't depend on interfaces they don't use. Prefer many specific interfaces over one general interface.

**Benefits:**
- Reduced coupling
- Easier implementation
- Better organization

### Dependency Inversion Principle (DIP)
High-level modules shouldn't depend on low-level modules. Both should depend on abstractions.

**Implementation:**
- Depend on interfaces, not concrete classes
- Use dependency injection
- Abstract infrastructure concerns

## Naming Conventions

### Variables and Functions
- Use intention-revealing names
- Avoid abbreviations (except common ones)
- Use pronounceable names
- Use searchable names

**Examples:**
- Bad: `d`, `temp`, `data`
- Good: `elapsedTimeInDays`, `userAccount`, `orderItems`

### Classes and Methods
- Classes: Nouns (User, OrderService)
- Methods: Verbs (calculateTotal, sendEmail)
- Booleans: is/has/can prefix (isActive, hasPermission)

### Constants
- Use UPPER_SNAKE_CASE
- Group related constants
- Consider enums for related values

## Functions

### Function Guidelines
- Keep functions small (20 lines max ideal)
- Do one thing only
- One level of abstraction
- Minimal parameters (3 or fewer)
- No side effects (or document them)

### Command Query Separation
- Commands: Perform actions, return nothing
- Queries: Return data, no side effects
- Don't mix both in one function

## Comments

### When to Comment
- Legal comments
- Explanation of intent
- Clarification of obscure code
- Warning of consequences
- TODO notes (temporary)

### When Not to Comment
- Explaining bad code (refactor instead)
- Redundant information
- Commented-out code (delete it)
- Journal comments (use version control)

## Code Smells and Refactoring

### Common Code Smells
- **Long Method:** Break into smaller functions
- **Large Class:** Extract classes
- **Duplicate Code:** Extract common code
- **Long Parameter List:** Use parameter objects
- **Feature Envy:** Move method to appropriate class
- **Data Clumps:** Group related data into classes
- **Primitive Obsession:** Use domain objects
- **Switch Statements:** Use polymorphism

### Refactoring Techniques
- **Extract Method:** Pull code into new function
- **Extract Class:** Create new class for related functionality
- **Rename:** Improve naming
- **Move Method/Field:** Better organize code
- **Replace Conditional with Polymorphism:** Use inheritance
- **Introduce Parameter Object:** Group related parameters

## Error Handling

### Best Practices
- Use exceptions for exceptional cases
- Create meaningful exception types
- Provide context in error messages
- Don't return null (use Optional, empty collections)
- Fail fast

### Exception Guidelines
- Catch specific exceptions
- Don't swallow exceptions silently
- Log appropriately
- Clean up resources (try-with-resources)

## Code Organization

### File Structure
- One class per file
- Related classes in same package/module
- Logical grouping of functionality
- Clear dependency direction

### Class Structure
- Constants first
- Fields
- Constructors
- Public methods
- Private methods
- Nested classes last

# Design Patterns

## Creational Patterns

### Singleton Pattern
The Singleton pattern ensures a class has only one instance and provides a global point of access to it. Use when exactly one object is needed to coordinate actions across the system.

**Implementation:**
- Private constructor
- Static instance variable
- Static getInstance() method
- Thread-safety considerations (double-checked locking, eager initialization)

**Use cases:** Configuration managers, logging services, database connection pools.

**Drawbacks:** Global state, harder to test, violates Single Responsibility Principle.

### Factory Pattern
The Factory pattern provides an interface for creating objects without specifying their concrete classes. It delegates instantiation to subclasses or factory methods.

**Types:**
- Simple Factory: Single factory method with conditionals
- Factory Method: Abstract method overridden in subclasses
- Abstract Factory: Family of related objects

**Use cases:** Object creation that depends on runtime conditions, decoupling client from concrete implementations.

### Builder Pattern
The Builder pattern separates the construction of a complex object from its representation. It allows step-by-step construction and produces different representations.

**Components:**
- Builder interface
- Concrete builders
- Director (optional)
- Product

**Use cases:** Objects with many optional parameters, immutable objects, complex construction logic.

## Structural Patterns

### Adapter Pattern
The Adapter pattern allows incompatible interfaces to work together by wrapping an object in an adapter that translates calls.

**Types:**
- Class adapter (inheritance)
- Object adapter (composition)

**Use cases:** Integration with legacy code, third-party libraries, API versioning.

### Decorator Pattern
The Decorator pattern attaches additional responsibilities to objects dynamically. It provides a flexible alternative to subclassing.

**Structure:**
- Component interface
- Concrete component
- Decorator base class
- Concrete decorators

**Use cases:** Adding features without modifying existing code, runtime behavior extension.

### Facade Pattern
The Facade pattern provides a simplified interface to a complex subsystem. It doesn't hide the subsystem but provides a convenient entry point.

**Use cases:** Simplifying complex APIs, reducing dependencies, providing a unified interface.

## Behavioral Patterns

### Observer Pattern
The Observer pattern defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified automatically.

**Components:**
- Subject (observable)
- Observer interface
- Concrete observers

**Use cases:** Event systems, MVC architecture, reactive programming.

### Strategy Pattern
The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from clients.

**Use cases:** Multiple algorithms for same task, avoiding conditionals, runtime algorithm selection.

### Command Pattern
The Command pattern encapsulates a request as an object, allowing parameterization, queuing, logging, and undo operations.

**Components:**
- Command interface
- Concrete commands
- Invoker
- Receiver

**Use cases:** Undo/redo functionality, transaction systems, macro recording.

### Dependency Injection
Dependency Injection is a technique where an object receives its dependencies from external sources rather than creating them internally.

**Types:**
- Constructor injection
- Setter injection
- Interface injection

**Benefits:** Loose coupling, easier testing, better maintainability.

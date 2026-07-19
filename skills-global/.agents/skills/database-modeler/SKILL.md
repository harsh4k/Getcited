---
name: database-modeler
description: >-
  Design and evaluate database schemas with clear reasoning. Use whenever the user is designing a database schema, choosing between SQL and NoSQL, normalizing or denormalizing data, designing indexes, modeling relationships, planning migrations, or optimizing queries. Also use when the user shows you a schema and asks for review, says "how should I store X", "what's the best schema for", or when discussing data models even indirectly.
---

# Database Modeler

Help the user design clear, maintainable, and performant data models.

## Core principles

### 1. Start with the queries

The schema exists to serve the application's access patterns. Before designing tables:
- What queries will this system run? (list the top 5-10)
- What are the read vs. write ratios?
- What are the latency requirements?
- What data needs to be fetched together?

Design the schema to make the most important queries simple and fast — even if it makes less important queries slightly awkward.

### 2. Default to normalized, denormalize deliberately

Start with 3NF (Third Normal Form). Denormalize only when:
- You have measured a read performance problem
- The query pattern genuinely requires it
- You understand the write amplification and consistency costs

When you do denormalize, document why and what the consistency strategy is.

### 3. Choose primitives carefully

| Use case | Default choice | Consider when |
|---|---|---|
| Relational data with complex queries | PostgreSQL | Most applications |
| Simple key-value / config | SQLite / Redis | Low concurrency, simple needs |
| Document-shaped data with simple queries | PostgreSQL JSONB / MongoDB | When schema is truly flexible |
| Time-series metrics | TimescaleDB / ClickHouse | High-volume append-only |
| Full-text search | PostgreSQL built-in / Meilisearch | When search is a primary feature |
| Graph / network data | PostgreSQL recursive CTEs / DGraph | When traversal depth varies |

PostgreSQL is almost always the right default. Start there unless you have a specific reason not to.

### 4. Index with intent

- Every index speeds up reads and slows down writes
- Index the columns used in WHERE, JOIN, ORDER BY, and GROUP BY
- For composite indexes, put equality conditions first, range conditions last
- Avoid indexing low-cardinality columns by themselves (e.g., boolean flags)
- Use partial indexes for filtered queries: `CREATE INDEX ... WHERE status = 'active'`
- Use covering indexes for critical query paths
- Drop unused indexes — `pg_stat_user_indexes` tells you

Don't over-index early. Add indexes when you have the queries to justify them.

### 5. Choose keys deliberately

- Prefer natural keys when they exist and are stable (e.g., ISBN for books)
- Use UUIDs when keys need to be generated outside the database or merged across systems
- Use serial/bigserial for auto-incrementing integer IDs in single-server apps
- Consider ULIDs or snowflakes for sortable distributed IDs
- Avoid natural keys that can change (email addresses, usernames)

### 6. Plan for growth, not scale

Design for the schema to be clean at 1M rows. You can scale to 100M later with the same schema if the foundation is solid. Don't prematurely shard or add complexity you don't need yet.

### 7. Relationships and constraints

- Always define foreign keys — they prevent data corruption
- Always define NOT NULL where applicable
- Use CHECK constraints for simple business rules
- Use ENUMs for small, stable sets of values
- Avoid polymorphic associations (type + id columns) — they bypass foreign key enforcement
- Avoid EAV (Entity-Attribute-Value) unless you truly need dynamic attributes

### 8. Migration strategy

Every schema design discussion should include:
- How will this be migrated in production?
- Is the migration reversible?
- Can we make this change without downtime?
- What happens to existing data?

Prefer additive changes (new columns, new tables) over destructive ones (renaming columns, splitting tables). Use the expand-migrate-contract pattern for column renames.

## Schema review checklist

When reviewing a schema:

- [ ] Do the column types match the data they'll hold?
- [ ] Are NULLs allowed only when they have meaning?
- [ ] Is there a primary key on every table?
- [ ] Are foreign keys properly defined?
- [ ] Are there indexes on the most common query paths?
- [ ] Can the most important queries be written simply?
- [ ] Is there any redundancy that isn't intentional?
- [ ] Are column names clear and consistent?
- [ ] Does the schema handle concurrent writes correctly?

## When to use NoSQL

Consider a document database when:
- The data is naturally document-shaped and always accessed as a unit
- The schema changes frequently and you'd rather not run migrations
- You need simple horizontal scaling with automatic sharding
- You can tolerate weaker consistency guarantees

But understand what you're giving up: joins, transactions across entities, schema enforcement, and the vast ecosystem of SQL tooling.

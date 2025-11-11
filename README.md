# Fitness App Setup Guide

This project relies on a PostgreSQL database. The schema is defined in [`database.sql`](database.sql), and you can load it with the provided npm command.

## Database initialization

1. Ensure the PostgreSQL connection environment variables (such as `DATABASE_URL` or the standard `PG*` variables) are set.
2. Run the migration script, which executes `database.sql` against the configured database:

   ```bash
   npm run migrate
   ```

   The `migrate` npm script is backed by [`scripts/init-db.js`](scripts/init-db.js); the script reads `database.sql` and applies the statements using the shared connection pool from [`src/db/index.js`](src/db/index.js).

After the schema is in place, you can start the application with:

```bash
npm start
```

or, for hot-reload during development:

```bash
npm run devStart
```

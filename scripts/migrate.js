/**
 * ============================================================================
 * KrishiSetu Nexus - Supabase Cloud PostgreSQL Migration Runner
 * ============================================================================
 * 
 * Features:
 *  1. Direct PostgreSQL execution via `DATABASE_URL` (Direct or Pooled) with SSL
 *  2. Auto-construction of connection URI from SUPABASE_URL / REF + SUPABASE_DB_PASSWORD
 *  3. Fallback support for Supabase Management API (SUPABASE_ACCESS_TOKEN)
 *  4. Fallback support for Supabase Service Role Key RPC execution (exec_sql)
 *  5. Migration tracking via `_schema_migrations` table (idempotent runs)
 *  6. CLI options: --status, --force, --dry-run, --file <path>
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');
require('dotenv').config();

// ANSI color helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function logStep(step, detail = '') {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${detail}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✔ ${msg}${colors.reset}`);
}

function logWarning(msg) {
  console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function logError(msg) {
  console.log(`${colors.red}✖ ${msg}${colors.reset}`);
}

// Extract project ref from URL if available
function extractProjectRef(url) {
  if (!url) return null;
  const match = url.match(/https?:\/\/([a-z0-9_-]+)\.supabase\.(co|in|net)/i);
  return match ? match[1] : null;
}

// Compute SHA256 checksum of SQL content
function getChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    statusOnly: args.includes('--status'),
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run'),
    filePath: null,
  };

  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    options.filePath = args[fileIdx + 1];
  }

  return options;
}

// Resolve connection configuration
function resolveConnectionConfig() {
  const env = process.env;

  // 1. Explicit DATABASE_URL / SUPABASE_DB_URL
  const databaseUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;
  if (databaseUrl) {
    return {
      type: 'postgres_url',
      connectionString: databaseUrl,
      source: env.DATABASE_URL ? 'DATABASE_URL' : 'SUPABASE_DB_URL',
    };
  }

  // 2. Individual standard PG environment variables
  if (env.PGHOST && env.PGPASSWORD) {
    return {
      type: 'postgres_params',
      host: env.PGHOST,
      port: parseInt(env.PGPORT || '5432', 10),
      user: env.PGUSER || 'postgres',
      password: env.PGPASSWORD,
      database: env.PGDATABASE || 'postgres',
      source: 'PGHOST / PGPASSWORD variables',
    };
  }

  // 3. Auto-compose from Supabase URL + DB Password
  const supabaseUrl = env.SUPABASE_URL;
  const dbPassword = env.SUPABASE_DB_PASSWORD;
  const projectRef = env.SUPABASE_PROJECT_REF || extractProjectRef(supabaseUrl);

  if (projectRef && dbPassword) {
    const encodedPassword = encodeURIComponent(dbPassword);
    // Supabase standard direct connection
    const generatedUrl = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
    return {
      type: 'postgres_url',
      connectionString: generatedUrl,
      source: 'Composed from SUPABASE_PROJECT_REF & SUPABASE_DB_PASSWORD',
    };
  }

  // 4. Supabase Management API via Personal Access Token
  const accessToken = env.SUPABASE_ACCESS_TOKEN;
  if (projectRef && accessToken) {
    return {
      type: 'management_api',
      projectRef,
      accessToken,
      source: 'SUPABASE_ACCESS_TOKEN (Management API)',
    };
  }

  // 5. Supabase REST API via Service Role Key (RPC fallback)
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    return {
      type: 'service_role_rpc',
      supabaseUrl,
      serviceRoleKey,
      projectRef,
      source: 'SUPABASE_SERVICE_ROLE_KEY',
    };
  }

  return null;
}

// Initialize migration tracking table
async function ensureMigrationTable(client) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS public._schema_migrations (
      version text PRIMARY KEY,
      name text NOT NULL,
      checksum text NOT NULL,
      applied_at timestamptz DEFAULT now()
    );
  `;
  await client.query(ddl);
}

// Get applied migrations from tracking table
async function getAppliedMigrations(client) {
  try {
    const res = await client.query('SELECT version, name, checksum, applied_at FROM public._schema_migrations ORDER BY version ASC;');
    return res.rows;
  } catch (err) {
    // If table doesn't exist yet, return empty list
    return [];
  }
}

// Record applied migration
async function recordMigration(client, version, name, checksum) {
  await client.query(
    `INSERT INTO public._schema_migrations (version, name, checksum, applied_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (version) DO UPDATE SET
       name = EXCLUDED.name,
       checksum = EXCLUDED.checksum,
       applied_at = now();`,
    [version, name, checksum]
  );
}

// Execute migration via PostgreSQL client
async function runWithPgClient(connectionConfig, migrations, options) {
  let client;
  if (connectionConfig.type === 'postgres_url') {
    client = new Client({
      connectionString: connectionConfig.connectionString,
      ssl: { rejectUnauthorized: false }, // Required for Supabase Cloud
    });
  } else {
    client = new Client({
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      password: connectionConfig.password,
      database: connectionConfig.database,
      ssl: { rejectUnauthorized: false },
    });
  }

  logStep('CONNECT', `Connecting to Supabase PostgreSQL using ${connectionConfig.source}...`);
  await client.connect();
  logSuccess('Connected to Supabase PostgreSQL database.');

  try {
    await ensureMigrationTable(client);
    const applied = await getAppliedMigrations(client);
    const appliedMap = new Map(applied.map(m => [m.version, m]));

    if (options.statusOnly) {
      log('\n--- Migration Status ---', colors.bold);
      for (const m of migrations) {
        const isApplied = appliedMap.has(m.version);
        const record = appliedMap.get(m.version);
        const status = isApplied ? `${colors.green}[APPLIED]${colors.reset} (${record.applied_at})` : `${colors.yellow}[PENDING]${colors.reset}`;
        console.log(`  ${m.version} - ${m.name}: ${status}`);
      }
      return;
    }

    logStep('MIGRATE', `Evaluating ${migrations.length} migration file(s)...`);

    for (const m of migrations) {
      const alreadyApplied = appliedMap.has(m.version);
      if (alreadyApplied && !options.force) {
        log(`  [SKIP] ${m.file} already applied. (Use --force to re-apply)`, colors.gray);
        continue;
      }

      if (options.dryRun) {
        log(`  [DRY RUN] Would execute ${m.file} (${m.content.length} bytes)`, colors.yellow);
        continue;
      }

      logStep('APPLYING', `${m.file} ...`);
      const startTime = Date.now();

      // Execute SQL content
      await client.query(m.content);

      // Record migration
      await recordMigration(client, m.version, m.name, m.checksum);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logSuccess(`Applied ${m.file} in ${duration}s`);
    }

    logSuccess('All migrations completed successfully!\n');
  } finally {
    await client.end();
  }
}

// Execute migration via Supabase Management API
async function runWithManagementApi(connectionConfig, migrations, options) {
  const { projectRef, accessToken } = connectionConfig;
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  logStep('CONNECT', `Connecting via Supabase Management API for project: ${projectRef}`);

  for (const m of migrations) {
    logStep('APPLYING', `${m.file} via Supabase Management API...`);
    const startTime = Date.now();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: m.content }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase Management API error (${response.status}): ${errText}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logSuccess(`Applied ${m.file} in ${duration}s`);
  }
}

// Execute via Supabase REST RPC or provide guidance
async function runWithServiceRoleRpc(connectionConfig, migrations, options) {
  const { supabaseUrl, serviceRoleKey, projectRef } = connectionConfig;

  logStep('SERVICE ROLE', `Supabase Service Role Key detected for URL: ${supabaseUrl}`);

  // Test if an exec_sql RPC function exists on the project
  const rpcUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
  try {
    const testResp = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'SELECT 1;' }),
    });

    if (testResp.ok) {
      logSuccess('Found existing exec_sql RPC endpoint. Executing migrations via Service Role RPC...');
      for (const m of migrations) {
        logStep('APPLYING', `${m.file}...`);
        const resp = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: m.content }),
        });
        if (!resp.ok) {
          throw new Error(`RPC execution error: ${await resp.text()}`);
        }
        logSuccess(`Applied ${m.file}`);
      }
      return;
    }
  } catch (err) {
    // Fall through to guide user
  }

  // If no RPC endpoint exists, guide user on setting DATABASE_URL
  log('\n' + '='.repeat(78), colors.yellow);
  log('⚡ Notice: Direct DDL execution via Supabase requires PostgreSQL Connection URI', colors.bold);
  log('='.repeat(78), colors.yellow);
  console.log(`
The Supabase PostgREST API is designed for table CRUD queries. Applying raw SQL
migrations (CREATE TABLE, ALTER TABLE, RLS policies, extensions) requires the
direct PostgreSQL connection string or database password.

To apply this migration directly to your Supabase Cloud project:

1. Open your Supabase Dashboard:
   https://supabase.com/dashboard/project/${projectRef || '<your-project-ref>'}

2. Go to: Project Settings -> Database -> Connection string -> URI

3. Add either of the following to your .env file:

   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef || '<project-ref>'}.supabase.co:5432/postgres"

   - OR -

   SUPABASE_DB_PASSWORD="[YOUR-PASSWORD]"

4. Re-run:
   npm run migrate

Alternatively, you can copy the contents of:
  ${migrations.map(m => m.path).join('\n  ')}
and paste directly into the Supabase Dashboard "SQL Editor" to run with 1 click!
`);
}

// Discover and read migration files
function loadMigrations(options) {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');

  if (options.filePath) {
    const absPath = path.resolve(options.filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Migration file not found: ${absPath}`);
    }
    const fileName = path.basename(absPath);
    const content = fs.readFileSync(absPath, 'utf8');
    return [{
      file: fileName,
      path: absPath,
      version: fileName.split('_')[0] || '001',
      name: fileName,
      content,
      checksum: getChecksum(content),
    }];
  }

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory does not exist: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No SQL migration files found in: ${migrationsDir}`);
  }

  return files.map(file => {
    const fullPath = path.join(migrationsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const version = file.split('_')[0];
    return {
      file,
      path: fullPath,
      version,
      name: file,
      content,
      checksum: getChecksum(content),
    };
  });
}

// Main Runner
async function main() {
  log('\n' + '='.repeat(70), colors.cyan);
  log('  🌱 KrishiSetu Nexus - Supabase Cloud PostgreSQL Migration Runner', colors.bold);
  log('='.repeat(70) + '\n', colors.cyan);

  const options = parseArgs();
  const migrations = loadMigrations(options);

  log(`Discovered ${migrations.length} migration file(s):`);
  migrations.forEach(m => console.log(`  • ${colors.bold}${m.file}${colors.reset} (${(m.content.length / 1024).toFixed(1)} KB)`));
  console.log('');

  const connectionConfig = resolveConnectionConfig();

  if (!connectionConfig) {
    logError('No Supabase database credentials found in environment or .env file!');
    console.log(`
Please create a .env file with your Supabase credentials:

  DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

See .env.example for all configuration options.
`);
    process.exit(1);
  }

  try {
    if (connectionConfig.type === 'postgres_url' || connectionConfig.type === 'postgres_params') {
      await runWithPgClient(connectionConfig, migrations, options);
    } else if (connectionConfig.type === 'management_api') {
      await runWithManagementApi(connectionConfig, migrations, options);
    } else if (connectionConfig.type === 'service_role_rpc') {
      await runWithServiceRoleRpc(connectionConfig, migrations, options);
    }
  } catch (err) {
    logError(`Migration execution failed: ${err.message}`);
    if (err.stack) {
      console.error(colors.gray + err.stack + colors.reset);
    }
    process.exit(1);
  }
}

main();

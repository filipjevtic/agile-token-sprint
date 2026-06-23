import { runCommand } from "./run.js";
import { parseArgs } from "./parse.js";

function printBanner() {
  console.log(`
     )\ )         )          (
    (()/(      ( /(          )\ )           )
     /(_))  (  )\())  (     (()/(      (   (     (
    (_))_   )\((_)\   )\     /(_))  (  )\  )\ )  )\ )
    |   \  ((_) |(_) ((_)   (_))_|  )\((_) _(_/((()/( )
    | |) |/ _ \\ \ / / _ \  | |_   ((_) _ | ' \)))(_))
    |___/ \___/_\_\_\\___/  |___|  \__/__||_||_|(/__/

    Burnwise CLI — turn AI usage into sprint-planning signal
  `);
}

function printUsage() {
  printBanner();
  console.log(`
Usage: ats [options] -- <command> [args...]

Options:
  --ticket-id <id>      Associate this session with a ticket
  --activity-type <t>   coding, review, planning, debugging, or other (default: other)

Environment:
  ATS_SERVER_URL        Ingestion server URL (default: http://localhost:3000)
  ATS_INGEST_API_KEY    API key for ingestion (default: dev-key)
  ATS_WORKSPACE_ID      Workspace ID (default: default)
  ATS_PROJECT_ID        Project ID (default: default)
  ATS_USER_ID           User ID (default: default)
  ATS_TICKET_ID         Default ticket ID

Examples:
  ats --ticket-id PROJ-123 -- npm test
  ats --activity-type coding -- claude code "refactor login"
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const parsed = parseArgs(args);
  if (parsed.error) {
    console.error(parsed.error);
    printUsage();
    process.exit(1);
  }

  const [command, ...childArgs] = parsed.args;
  const exitCode = await runCommand({
    command,
    args: childArgs,
    activityType: parsed.activityType,
    ticketId: parsed.ticketId,
  });
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

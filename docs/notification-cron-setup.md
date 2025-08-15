# Notification Cron Job Setup

To enable scheduled notifications, you need to set up a cron job that calls the notification processing API endpoint.

## Option 1: Vercel Cron Jobs

Add this to your `vercel.json`:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/notifications/process",
      "schedule": "*/15 * * * *"
    }
  ]
}
\`\`\`

This will process notifications every 15 minutes.

## Option 2: External Cron Service

Use a service like:
- GitHub Actions (scheduled workflows)
- Uptime Robot (monitoring with webhooks)
- Cron-job.org
- EasyCron

Set up a cron job to make a POST request to:
`https://your-domain.com/api/notifications/process`

## Option 3: Server Cron Job

If you have server access, add this to your crontab:

\`\`\`bash
# Process notifications every 15 minutes
*/15 * * * * curl -X POST https://your-domain.com/api/notifications/process
\`\`\`

## Recommended Schedule

- **Every 15 minutes**: For time-sensitive notifications
- **Every hour**: For less critical notifications
- **Every 5 minutes**: For high-priority applications

## Security

Consider adding authentication to the API endpoint:
- API key validation
- IP whitelist
- Rate limiting

## Monitoring

Monitor the API endpoint to ensure:
- Notifications are being processed
- No errors are occurring
- Performance is acceptable

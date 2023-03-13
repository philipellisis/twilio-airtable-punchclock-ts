This is a simple time management application that works with Twilio and Airtable to keep track of employee time and work. 

To deploy -- create an env file with the following keys:

```yaml
ACCOUNT_SID=your twillio account sid
AUTH_TOKEN=your twillio auth token
API_KEY=Your airtable API Key
```

and run the following command:

```npm run build```

Then copy the timesheet.js that is created in dist/functions into the src/functions directory and run the command:

```npm run deployToTwilio```

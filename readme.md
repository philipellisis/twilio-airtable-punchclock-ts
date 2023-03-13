This is a simple time management application that works with Twilio and Airtable to keep track of employee time and work. 

To deploy -- create an env file with the following keys:

```yaml
ACCOUNT_SID=ACca7affeebb46fb0dbf212a1b608fc1d3
AUTH_TOKEN=8ef638f693d97348686d7e374cabd123
API_KEY=patByQcKcttVPEGKO.5345ad2b09084c9a0b810467ce16664a6be3a7d2167a1f2f8cd0e14cc71193c8
```

and run the following command:

```npm run build```

Then copy the timesheet.js that is created in dist/functions into the src/functions directory and run the command:

```npm run deployToTwilio```
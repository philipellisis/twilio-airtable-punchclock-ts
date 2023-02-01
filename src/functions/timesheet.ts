import { Context, ServerlessCallback, ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import '@twilio-labs/serverless-runtime-types';
import Airtable from "airtable/lib/airtable"
import { Collaborator, Attachment } from "airtable";


export const handler: ServerlessFunctionSignature  = async (context: Context, event: any, callback: ServerlessCallback) => {
    var base = new Airtable({apiKey: process.env.API_KEY}).base('appIYujosS9RbtTtl');
    // Create a new messaging response object
    
    const message = event.Body.toLowerCase();
    const phoneNumber = event.From || event.phoneNumber || '+14405273672';
    const twiml = new Twilio.twiml.MessagingResponse();
    try {

      if (message === 'in' || message === 'out') {
        const id = await getCurrentPunch(base, phoneNumber)
        const user = await getCurrentUser(base, phoneNumber)

        if (id && message === 'out') {
            const result = await updateCurrentPunch(base, id)
            if (result) {
                twiml.message("succesfully punched out");
            }
        } else if (!id && message === 'in') {
            const result = await punchIn(base, phoneNumber, user)
            if (result) {
                twiml.message("succesfully punched in");
            }
        } else {
            twiml.message("You are already punched in!");
        }

      } else {
        twiml.message("not sure what you wanted to do");
      }
      return callback(null, twiml);
        
    } catch (error: any) {
        return callback(error);
    }
    
  };
  async function punchIn(base: Airtable.Base, phoneNumber: string, user: string): Promise<string> {
    return base('Timesheet').create([
        {
          "fields": {
            "Phone Number": phoneNumber,
            "Punch In": "in",
            "User": user
          }
        }
    ]).then(record =>{
        return record[0].id
    }).catch(err => {
        throw Error("unable to create record")
    });
  }


  async function getCurrentPunch(base: Airtable.Base, phoneNumber: string): Promise<string> {
    let found = false
    let id = ''

    return base('Timesheet').select({
        view: 'Grid view',
        filterByFormula: `AND(({Phone Number} = '${phoneNumber}'),({Punch Out} = ''))`
    }).firstPage().then(records => {
        for (const record of records) {
            found = true
            id = record.id
        }
        return id
    }).catch(err => {
        throw Error("unable to get record")
    }).finally(() => {
        if (!found) {
            return undefined
        }
    })
}

async function getCurrentUser(base: Airtable.Base, phoneNumber: string): Promise<string> {
    let found = false
    let id = ''

    return base('Users').select({
        view: 'Grid view',
        filterByFormula: `({Phone Number} = '${phoneNumber}')`
    }).firstPage().then(records => {
        for (const record of records) {
            found = true
            id = ensureString(record.get("Employee"))
        }
        return id
    }).catch(err => {
        throw Error("unable to get record")
    }).finally(() => {
        if (!found) {
            return ''
        }
    })
}

async function updateCurrentPunch(base: Airtable.Base, id: string): Promise<string> {
    return base('Timesheet').update(id, {
        "Punch Out": "out"
    }).then(record =>{
        return record.id
    }).catch(err => {
        throw Error("unable to update record")
    })
}

function ensureString(data: string | number | boolean | Collaborator | readonly Collaborator[] | readonly string[] | readonly Attachment[] | undefined): string {
    if (typeof data == 'string') {
        return data;
    } else {
        return ''
    }
}
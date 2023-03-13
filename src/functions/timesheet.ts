import { Context, ServerlessCallback, ServerlessFunctionSignature } from "@twilio-labs/serverless-runtime-types/types";
import '@twilio-labs/serverless-runtime-types';
import Airtable from "airtable/lib/airtable"
import { Collaborator, Attachment } from "airtable";


export const handler: ServerlessFunctionSignature  = async (context: Context, event: any, callback: ServerlessCallback) => {
    var base = new Airtable({apiKey: process.env.API_KEY}).base('appIYujosS9RbtTtl');
    // Create a new messaging response object
    
    const message: string[] = event.Body.toLowerCase().split(' ');
    const phoneNumber = event.From || event.phoneNumber || '+14405273672';
    const twiml = new Twilio.twiml.MessagingResponse();
    try {

      if (message[0] === 'in' || message[0] === 'out' || message[0] === 'hours') {
        const id = await getCurrentPunch(base, phoneNumber)
        const user = await getCurrentUser(base, phoneNumber)

        if (id && message[0] === 'out') {
            const result = await updateCurrentPunch(base, id)
            const workid = await getCurrentWorkItem(base, phoneNumber)
            let deletedWork = true
            if (workid) {
                deletedWork = await deleteWork(base, workid)
            }
            if (result && deletedWork) {
                twiml.message("succesfully punched out");
            } else {
                twiml.message("problem while punching out");
            }
        } else if (!id && message[0] === 'in') {
            const result = await punchIn(base, phoneNumber, user)
            const result2 = await addWorkItem(base, phoneNumber, user)
            if (result && result2) {
                twiml.message("succesfully punched in");
            } else {
                twiml.message("error punching you in");
            }
        } else if (message[0] === 'hours') {
            const hours = await getCurrentHours(base, phoneNumber)
            twiml.message(`Last 24 Hours: ${hours.last24Hours.toFixed(2)}
Last week: ${hours.weekHours.toFixed(2)}
Pay Cycle: ${hours.payCycleHours.toFixed(2)}`)
        } else {
            if (message[0] === 'in') {
                twiml.message("You are already punched in!");
            } else if (message[0] === 'out') {
                twiml.message("You are already punched out!");
            } else {
                twiml.message("not sure what you wanted to do");
            }
            
        }
      } else if (message[0] === 'work' && message.length > 1 && message[1]) {
        const id = await getCurrentWorkItem(base, phoneNumber)
        if (id) {
            const user = await getCurrentUser(base, phoneNumber)
            const result = await updateWork(base, id, message[1])
            const result2 = await addWorkItem(base, phoneNumber, user)
            if (result && result2) {
                twiml.message("succesfully added work");
            } else {
                twiml.message("error while adding work");
            }
        } else {
            twiml.message("no work to add to!");
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

  async function addWorkItem(base: Airtable.Base, phoneNumber: string, user: string): Promise<string> {
    return base('Work').create([
        {
          "fields": {
            "Phone Number": phoneNumber,
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

async function getCurrentWorkItem(base: Airtable.Base, phoneNumber: string): Promise<string> {
    let found = false
    let id = ''

    return base('Work').select({
        view: 'Grid view',
        filterByFormula: `AND(({Phone Number} = '${phoneNumber}'),({Order Number} = ''))`
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

interface hours {
    last24Hours: number
    weekHours: number
    payCycleHours: number
}

async function getCurrentHours(base: Airtable.Base, phoneNumber: string): Promise<hours> {
    let found = false

    return base('Timesheet').select({
        view: 'Grid view',
        filterByFormula: `AND(({Phone Number} = '${phoneNumber}'),({Current Pay Cycle} = 1))`
    }).firstPage().then(records => {
        let hours: hours = {last24Hours: 0, weekHours: 0, payCycleHours: 0}
        for (const record of records) {
            found = true
            const dayNum: number = ensureNumber(record.get("Days Since Punched"))
            const hoursWorked: number = ensureNumber(record.get("Time Worked"))
            if(dayNum === 0) {
                hours.last24Hours += hoursWorked
                hours.payCycleHours += hoursWorked
                hours.weekHours += hoursWorked
            }
            if(dayNum <= 7 && dayNum > 0) {
                hours.payCycleHours += hoursWorked
                hours.weekHours += hoursWorked
            }
            if(dayNum > 7) {
                hours.payCycleHours += hoursWorked
            }
        }
        return hours
    }).catch(err => {
        throw Error("unable to get record")
    }).finally(() => {
        if (!found) {
            return {last24Hours: 0, weekHours: 0, payCycleHours: 0}
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

async function updateWork(base: Airtable.Base, id: string, workItem: string): Promise<string> {
    return base('Timesheet').update(id, {
        "Order Number": workItem
    }).then(record =>{
        return record.id
    }).catch(err => {
        throw Error("unable to update record")
    })
}

async function deleteWork(base: Airtable.Base, id: string): Promise<boolean> {
    return base('Timesheet').destroy(id).then(record =>{
        return true
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

function ensureNumber(data: string | number | boolean | Collaborator | readonly Collaborator[] | readonly string[] | readonly Attachment[] | undefined): number {
    if (typeof data == 'number') {
        return data;
    } else {
        return -1
    }
}
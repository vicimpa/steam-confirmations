# Steam-Confirmations
[![npm version](https://img.shields.io/npm/v/steam-confirmations.svg)](https://npmjs.com/package/steam-confirmations)
[![npm downloads](https://img.shields.io/npm/dm/steam-confirmations.svg)](https://npmjs.com/package/steam-confirmations)
[![license](https://img.shields.io/npm/l/steam-confirmations.svg)](https://github.com/vicimpa/steam-confirmations/blob/master/LICENSE)


This module allows you to accept confirmation of sales and trades in the Steam Community. Simple interface. TypeScript support.

## Usage:

#### From TypeScript:
```ts
import { SteamMobile } from "steam-confirmations";

const mobileClient = new SteamMobile({
  steamid: "",              // Your SteamID
  identity_secret: "",      // Identity Secret of your device
  device_id: "",            // Device ID of your device
  webCookie: []             // Optional. An array of strings containing cookies
});



mobileClient.loadConfirm()  // Returns a Promise with SteamMobileConfList object
  .then(async (confirmList) => {

    for(let confirm of confirmList.confirmations) {
      let result = await confirm.accep()  // Return a Promise with a boolean
      let id = confirm.id                 // Numeric Confirmation Id

      if(result)
        console.log(`Accept confirmation success`)
      else
        console.log(`Accept confirmation `)
    }
  })
  .then(() => console.log('Confirmations end'))
  .catch(console.error)
```

#### From JavaScript:
```js
const SteamMobile = require("steam-confirmations");

const mobileClient = new SteamMobile({
  steamid: "",              // Your SteamID
  identity_secret: "",      // Identity Secret of your device
  device_id: "",            // Device ID of your device
  webCookie: []             // Optional. An array of strings containing cookies
});



mobileClient.loadConfirm()  // Returns a Promise with SteamMobileConfList object
  .then(async (confirmList) => {

    for(let confirm of confirmList.confirmations) {
      let result = await confirm.accep()  // Return a Promise with a boolean
      let id = confirm.id                 // Numeric Confirmation Id

      if(result)
        console.log(`Accept confirmation success`)
      else
        console.log(`Accept confirmation `)
    }
  })
  .then(() => console.log('Confirmations end'))
  .catch(console.error)
```

## Classes and Interfaces

#### SteamMobile:
```ts
interface Options {
  steamid: string         // Your SteamID
  identity_secret: string // Identity Secret of your device
  device_id: string       // Device ID of your device
  webCookie?: string[]    // Optional. An array of strings containing cookies
}

// This type for sendConfirm method in SteamMobile
type Operator = 'allow'|'cancel'



class SteamMobile {
  constructor(options: Options)

  // Set cookies. Type array of strings 
  setCookies(cookies: string[]): SteamMobile

  // Load confirmations in Confirmations List
  loadConfirm(): Promise<SteamMobileConfList>

  // Load confirmations in string html code
  loadHtmlConfirm(): Promise<string>

  // Send request for confirmation
  sendConfirm(conf: SteamConfirmation, op: Operator): Promise<boolean>
}
```

#### SteamMobileConfList:
```ts
class SteamMobile {
  length: number                      // Number of Confirmations
  idsConfirmations: number[]          // Array of Confirmation ID
  confirmations: SteamConfirmation[]  // Array of Confirmation

  // Get Confirmation by numeric ID
  getConfirm(id: number): SteamConfirmation

  // Create new Array whith results of caling a provided function
  map(callback: (item: SteamConfirmation, index: number) => any): any

  // Send accept request for confirmation 
  accept(confirmation: SteamConfirmation): Promise<boolean>

  // Send deny request for confirmation 
  deny(confirmation: SteamConfirmation): Promise<boolean>

  // Update this confirmation list instead of creating a new one
  updateList(): Promise<void>
}
```

#### SteamConfirmation:   
```ts
class SteamConfirmation {
  id: number                // Numeric Confirmation ID
  key: string               // String Confirmation Key
  descriptions: string[]    // Array of Confirmations Description Strings

  // Accept this Confirmation
  accept(): Promise<boolean>

  // Deny this Confirmation
  deny(): Promise<boolean>
}
```
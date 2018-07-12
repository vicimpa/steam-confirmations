declare module 'steam-confirmations' {
  namespace SteamMobile {
    interface IOptions {
      steamid: string
      identity_secret: string
      device_id: string
      webCookie?: string[]
    }
    
    interface IConfirmationData {
      id: number
      key: string
      descriptions: string[]
      accept: string
      cancel: string
    }
    
    type TOperator = 'allow' | 'cancel'
  }

  class SteamConfirmation {
    id: number
    key: string
    descriptions: string[]

    accept(): Promise<boolean>
    deny(): Promise<boolean>
  
    updateData(data: SteamMobile.IConfirmationData): SteamConfirmation
  
    drop()
  }

  class SteamMobileConfList {
    length: number
    idsConfirmations: number[]
    confirmations: SteamConfirmation[]

    getConfirm(id: number): SteamConfirmation

    map(callback: (item: SteamConfirmation, index: number) => any): any

    accept(confirmation: SteamConfirmation): Promise<boolean>
    deny(confirmation: SteamConfirmation): Promise<boolean>

    updateList(): Promise<void>
  }

  class SteamMobile {
    constructor(options: SteamMobile.IOptions)

    setCookies(cookies: string[]): SteamMobile

    loadConfirm(): Promise<SteamMobileConfList>
    loadHtmlConfirm(): Promise<string>

    sendConfirm(confirmation: SteamConfirmation, operator: SteamMobile.TOperator): Promise<boolean>
  }

  export {SteamMobile}
}
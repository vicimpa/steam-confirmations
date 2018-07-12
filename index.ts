import * as Crypto from 'crypto'
import * as Request from 'request'
import * as Cheerio from 'cheerio'

const baseUrl = 'https://steamcommunity.com'
const mobileConf = 'mobileconf/conf'
const mobileAjax = 'mobileconf/ajaxop'

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

class SteamConfirmation {
  public id: number
  public key: string
  public descriptions: string[]

  constructor(data: IConfirmationData, private _list: SteamMobileConfList) {
    this.updateData(data)

    for (let key in this) if (/^_/.test(key))
      Object.defineProperty(this, key, { enumerable: false })
  }

  public async accept() {
    return await this._list.accept(this)
  }

  public async deny() {
    return await this._list.deny(this)
  }

  public updateData(data: IConfirmationData) {
    let { id, key, descriptions, accept, cancel } = data

    this.id = id
    this.key = key
    this.descriptions = descriptions
  }

  public drop() {
    this._list = null
    delete this._list
  }
}

class SteamMobileConfList {
  private _confirms: { [key: number]: SteamConfirmation } = {}

  public length: number = 0
  public idsConfirmations: number[] = [] 
  public confirmations: SteamConfirmation[] = []

  constructor(data: any, private _mobile: SteamMobile) {
    this._parseBody(data)

    for (let key in this) if (/^_/.test(key))
      Object.defineProperty(this, key, { enumerable: false })
  }

  public getConfirm(id: number) {
    return this._confirms[id] || null
  }

  public map(callback: (confirm: SteamConfirmation, index: number) => any) {
    return this.idsConfirmations.map((id, index) => {
      callback.call(this, this.getConfirm(id), index)
    })
  }

  public async accept(confirmation: SteamConfirmation) {
    let mobile = this._mobile

    let result = await mobile.sendConfirm(confirmation, 'allow')

    if(result)
      confirmation.drop()

    return result
  }

  public async deny(confirmation: SteamConfirmation) {
    let mobile = this._mobile

    let result = await mobile.sendConfirm(confirmation, 'cancel')

    if(result)
      confirmation.drop()

    return result
  }

  public async updateList() {
    let mobile = this._mobile
    let body = await mobile.loadHtmlConfirm()
    this._parseBody(body)
  }

  private _parseBody(data: any) {
    let $ = Cheerio.load(data)

    for(let id in this._confirms)
      this._set(parseInt(id), null)

    $('[data-confid]').map((index, element) => {
      let elem = $(element)

      let id: number = elem.data('confid')
      let key: string = elem.data('key')
      let cancel: string = elem.data('cancel')
      let accept: string = elem.data('accept')

      if (!cancel && !accept)
        return null

      let descriptions: string[] = [], find = '.mobileconf_list_entry_description > div'

      elem.find(find).each((i, element) => {
        let elem = $(element)
        descriptions.push(elem.text())
      })

      this._set(id, { id, key, cancel, accept, descriptions })
    })
  }

  private _set(id: number, data: IConfirmationData = null) {
    delete this.confirmations
    this.confirmations = []
    let { _confirms, confirmations = [] } = this

    if (data === null) {
      try {
        _confirms[id].drop()
        _confirms[id] = null
        delete _confirms[id]
      } catch (e) { }
    }

    (_confirms[id] || (_confirms[id] = new SteamConfirmation(data, this)))
      .updateData(data)

    let ids = Object.keys(_confirms)

    for(let id of ids)
      confirmations.push(this._confirms[id])

    this.idsConfirmations = ids.map(e => parseInt(e))
    this.length = this.idsConfirmations.length
  }
}

class SteamMobile {
  private _steamid: string
  private _identity_secret: string
  private _device_id: string

  private _j = Request.jar()
  private _req = Request.defaults({ jar: this._j })

  constructor(options: IOptions) {
    let { steamid, identity_secret, device_id, webCookie = [] } = options

    this._steamid = steamid
    this._identity_secret = identity_secret
    this._device_id = device_id

    this.setCookies(webCookie)

    for (let key in this) if (/^_/.test(key))
      Object.defineProperty(this, key, { enumerable: false })
  }

  public setCookies(webCookies: string[] = []) {
    webCookies.forEach(cookie =>
      this._j.setCookie(Request.cookie(cookie), baseUrl)
    )

    return this
  }

  public async loadConfirm() {
    let body = await this.loadHtmlConfirm()
    return new SteamMobileConfList(body, this)
  }

  public async sendConfirm(confirmation: SteamConfirmation, operator: TOperator) {
    let {id, key} = confirmation
    let url = this._generateUrlAjax(operator, id, key)
    let body = await this._getAsync(url)
    return <boolean> JSON.parse(body).success
  }

  public async loadHtmlConfirm() {
    let url = this._generateUrl()
    return await this._getAsync(url)
  }

  private _getAsync(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this._req.get(url, (err, res, body) => {
        if (err || res.statusCode !== 200)
          return reject(err || new Error(res.statusMessage))

        if (!body)
          return reject(new Error('Invalid Response'))

        resolve(body)
      })
    })
  }

  private _generateUrl(tag?: string) {
    let query = this._generateQuery(tag || 'conf')

    return `${baseUrl}/${mobileConf}?${query}`
  }

  private _generateUrlAjax(tag: string, id: number, key: string) {
    let query = this._generateQuery(tag || 'conf', {cid: id, ck: key, op: tag})
    
    return `${baseUrl}/${mobileAjax}?${query}`
  }

  private _queryToString(data: object, sep: string = '&'): string {
    let outPut: string[] = []

    for (let key in data)
      outPut.push(`${key}=${data[key].toString()}`)

    return outPut.join(sep)
  }

  private _generateQuery(tag?: string, append: object = {}) {
    let time = Math.floor(Date.now() / 1000)
    let { _device_id, _steamid } = this
    let hash = this._generateHash(time, tag)

    return this._queryToString(Object.assign({
      p: _device_id, a: _steamid,
      k: hash, t: time,
      m: 'android', tag,

    }, append))
  }

  private _generateHash(time: number, tag?: string) {
    let tagL = tag ? tag.length : 0
    let sourceLength = 8 + (tagL > 32 ? 32 : tagL)
    let source = new Buffer(sourceLength)
    let { _identity_secret } = this

    source.writeUInt32BE(0, 0)
    source.writeUInt32BE(time, 4)

    tagL && (new Buffer(tag, 'utf-8').copy(source, 8, 0, sourceLength - 8))

    try {
      let secret = new Buffer(_identity_secret, 'base64')
      let hmacGenerator = Crypto.createHmac('sha1', secret)
      let hashedData = hmacGenerator.update(source).digest()
      let encodedData = hashedData.toString('base64')

      return encodeURIComponent(encodedData)
    } catch (e) {
      throw new Error('Bad data for generate Auth. Fix it!')
    }
  }
}

export { SteamMobile }
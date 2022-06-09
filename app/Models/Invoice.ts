import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, beforeSave, beforeUpdate, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { string } from '@ioc:Adonis/Core/Helpers'

import User from './User'
import Wallet from './Wallet'
import Category from './Category'


export default class Invoice extends BaseModel {

  @column({ isPrimary: true })
  public id: number

  @belongsTo(() => User, { foreignKey: 'user_id' })
  public user: BelongsTo<typeof User>
  
  @column()
  public user_id: number

  @belongsTo(() => Wallet, { foreignKey: 'wallet_id' })
  public wallet: BelongsTo<typeof Wallet>

  @column()
  public wallet_id: number

  @belongsTo(() => Category, { foreignKey: 'category_id' })
  public category: BelongsTo<typeof Category>

  @column()
  public category_id: number

  @column()
  public description: string
  
  @column()
  public installment_of: string

  @column()
  public value: number

  @column()
  public date: Date

  @column()
  public installment: number

  @column()
  public installments: number

  @column()
  public invoice_type: string
  
  @column()
  public type: string
  
  @column()
  public period: string
  
  @column()
  public status: boolean
 
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

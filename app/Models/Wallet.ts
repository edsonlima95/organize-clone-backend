import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column, HasMany, hasMany, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Invoice from './Invoice'
import Balance from './Balance'

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @belongsTo(() => User, {
    foreignKey: "user_id"
  })
  public user: BelongsTo<typeof User>

  @column()
  public user_id: number

  @hasMany(() => Invoice, {
    foreignKey: "wallet_id"
  })
  public invoices: HasMany<typeof Invoice>

  @column()
  public description?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
